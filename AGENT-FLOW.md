# Agent Integration Flow - KIRAPAY Enterprise Middleware

## How Agents Access KIRAPAY

This document describes the end-to-end flow for AI agents to integrate with KIRAPAY through the enterprise middleware.

---

## Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agent     │     │   Gateway   │     │   Auth      │     │   KIRAPAY   │
│  (AI Bot)   │────▶│   (API)     │────▶│   Service   │────▶│   Core      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                    │
       │ 1. Request        │ 2. Validate      │ 3. Verify          │
       │ 2. Response◀──────│ 3. Route ◀────────│ 4. Token ◀─────────
       │                   │                   │                    │
       │              ┌────┴────┐         ┌────┴────┐
       │              │ Rate    │         │ Webhook │
       │              │ Limiter │         │ Dispatch│
       │              └─────────┘         └─────────┘
```

---

## Step-by-Step Flow

### Step 1: Agent Registration

Before making any API calls, agents must register:

```bash
curl -X POST https://api.kirapay.com/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payment-agent-001",
    "description": "Automates merchant payouts",
    "contact_email": "agent@company.com",
    "webhook_url": "https://agent.company.com/webhooks/kirapay",
    "scopes": ["payments:write", "accounts:read"]
  }'
```

**Response:**
```json
{
  "agent_id": "agn_abc123xyz",
  "api_key": "kp_live_abc123...",
  "api_secret": "ks_live_xyz789...",
  "status": "active",
  "created_at": "2026-03-11T07:00:00Z"
}
```

⚠️ **Important**: Store `api_key` and `api_secret` securely!

---

### Step 2: Authentication

Agents can authenticate using either:

#### Option A: API Key (Simple)
```bash
curl https://api.kirapay.com/v1/accounts/balance \
  -H "Authorization: Bearer kp_live_abc123..."
```

#### Option B: JWT Token (Recommended for high frequency)

1. Exchange API key for JWT:
```bash
curl -X POST https://api.kirapay.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "kp_live_abc123...",
    "api_secret": "ks_live_xyz789...",
    "expires_in": 3600
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

2. Use JWT for requests:
```bash
curl https://api.kirapay.com/v1/accounts/balance \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Step 3: Making API Calls

#### Check Balance
```bash
curl https://api.kirapay.com/v1/accounts/balance \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "account_id": "acc_123",
  "available": 50000.00,
  "pending": 2500.00,
  "currency": "USD"
}
```

#### Initiate Payment
```bash
curl -X POST https://api.kirapay.com/v1/payments/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000.00,
    "currency": "USD",
    "recipient": {
      "type": "merchant",
      "id": "mer_456"
    },
    "reference": "ORDER-12345",
    "description": "Payment for Order #12345"
  }'
```

**Response:**
```json
{
  "payment_id": "pay_789",
  "status": "pending",
  "amount": 1000.00,
  "created_at": "2026-03-11T07:05:00Z"
}
```

---

### Step 4: Webhook Notifications

For async events, agents receive webhooks:

**Webhook Payload:**
```json
{
  "event": "payment.completed",
  "payment_id": "pay_789",
  "timestamp": "2026-03-11T07:06:00Z",
  "data": {
    "status": "completed",
    "amount": 1000.00,
    "settled_to": "mer_456"
  }
}
```

**Verify Webhook Signature:**
```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```

---

### Step 5: Idempotency

For payment operations, use idempotency keys to prevent duplicates:

```bash
curl -X POST https://api.kirapay.com/v1/payments/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: unique-request-id-12345" \
  -d '{...}'
```

If the same key is used within 24 hours, the original response is returned.

---

## Code Examples

### Python
```python
import requests

class KirapayAgent:
    def __init__(self, api_key, api_secret, base_url="https://api.kirapay.com"):
        self.base_url = base_url
        self.api_key = api_key
        self.api_secret = api_secret
        self.token = None
    
    def authenticate(self):
        resp = requests.post(f"{self.base_url}/v1/auth/token", json={
            "api_key": self.api_key,
            "api_secret": self.api_secret
        })
        self.token = resp.json()["access_token"]
    
    def get_balance(self):
        if not self.token:
            self.authenticate()
        resp = requests.get(
            f"{self.base_url}/v1/accounts/balance",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        return resp.json()
    
    def initiate_payment(self, amount, recipient_id, reference):
        if not self.token:
            self.authenticate()
        return requests.post(
            f"{self.base_url}/v1/payments/initiate",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "amount": amount,
                "currency": "USD",
                "recipient": {"type": "merchant", "id": recipient_id},
                "reference": reference
            }
        ).json()
```

### Node.js
```javascript
class KirapayAgent {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://api.kirapay.com';
    this.token = null;
  }

  async authenticate() {
    const resp = await fetch(`${this.baseUrl}/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        api_secret: this.apiSecret
      })
    });
    const data = await resp.json();
    this.token = data.access_token;
  }

  async getBalance() {
    if (!this.token) await this.authenticate();
    const resp = await fetch(`${this.baseUrl}/v1/accounts/balance`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return resp.json();
  }
}
```

---

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Invalid token | Re-authenticate |
| 403 | Insufficient scope | Request more permissions |
| 429 | Rate limited | Wait & retry with backoff |
| 500 | Server error | Retry with idempotency key |

---

## Best Practices

1. **Use JWT**: For high-frequency requests, exchange API key for JWT
2. **Idempotency**: Always use idempotency keys for payments
3. **Webhooks**: Verify signatures before processing
4. **Retry**: Implement exponential backoff for failures
5. **Monitor**: Track rate limit usage via `/v1/usage`
6. **Secure**: Never log or expose API secrets
