# Agent Integration Flow - KIRAPAY Enterprise Middleware

## How It Works

This middleware lets AI agents make payments through KIRAPAY using **your** enterprise API key, while you track each agent's activity.

---

## The Flow

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐     ┌──────────┐
│   Agent     │────▶│   Middleware   │────▶│   KIRAPAY  │────▶│ Wallet   │
│ (Autonomous)│     │ (Your Engine)  │     │ (Your Key) │     │ (Agent's)│
└─────────────┘     └─────────────────┘     └─────────────┘     └──────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Your DB    │
                   │  Tracks:    │
                   │  - Agent UID│
                   │  - Wallet   │
                   │  - Payments │
                   └─────────────┘
```

---

## Step 1: Agent Registration

**Agent sends:**
```bash
curl -X POST https://api.your-middleware.com/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "merchant-payout-bot",
    "use_case": "automated settlements for merchants",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f6eB12"
  }'
```

**Middleware does:**
1. Validates required fields
2. Generates UID: `KA-abc123xyz`
3. Stores in DB with wallet mapping

**Response to Agent:**
```json
{
  "success": true,
  "agent": {
    "uid": "KA-abc123xyz",
    "name": "merchant-payout-bot",
    "wallet_address": "0x742d...6eB12",
    "status": "active"
  }
}
```

**What you track in DB:**
| uid | name | wallet | created_at |
|-----|------|--------|------------|
| KA-abc123xyz | merchant-payout-bot | 0x742d... | 2026-03-11 |

---

## Step 2: Agent Requests Payment

**Agent sends:**
```bash
curl -X POST https://api.your-middleware.com/v1/payments/create-link \
  -H "X-Agent-UID: KA-abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "USD",
    "description": "Settlement for Order #12345",
    "reference": "order-12345"
  }'
```

**Middleware does:**
1. Validate UID exists
2. Log activity
3. Call KIRAPAY API (using YOUR key)
4. Store transaction with agent_uid
5. Return payment link

**To KIRAPAY (from your server):**
```bash
curl -X POST https://api.kira-pay.com/v1/payment-links \
  -H "Authorization: Bearer YOUR_KIRAPAY_API_KEY" \
  -d '{
    "amount": 1000,
    "currency": "USD",
    "description": "Settlement for Order #12345"
  }'
```

**KIRAPAY sees:** Just your enterprise account making the request

**Your DB tracks:**
| agent_uid | amount | kirapay_id | status |
|-----------|--------|------------|--------|
| KA-abc123xyz | 1000 | klp_xyz789 | pending |

---

## Step 3: Agent Receives Payment Link

**Response to Agent:**
```json
{
  "success": true,
  "payment": {
    "id": "klp_xyz789",
    "link": "https://pay.kira-pay.com/xyz789",
    "amount": 1000,
    "currency": "USD",
    "status": "pending"
  }
}
```

---

## Step 4: Payment Completion (Webhook)

When KIRAPAY notifies of payment completion:

1. **KIRAPAY → Your Webhook:**
```json
{
  "event": "payment.completed",
  "payment_id": "klp_xyz789",
  "amount": 1000
}
```

2. **Middleware updates DB:**
```sql
UPDATE transactions 
SET status = 'completed' 
WHERE kirapay_payment_id = 'klp_xyz789'
```

3. **Forward to agent (if webhook registered):**
```json
{
  "event": "payment.completed",
  "agent_uid": "KA-abc123xyz",
  "payment_id": "klp_xyz789",
  "amount": 1000,
  "status": "completed"
}
```

---

## Code Example: Python Agent

```python
import requests

class KirapayAgent:
    def __init__(self, agent_uid, middleware_url):
        self.agent_uid = agent_uid
        self.url = middleware_url
    
    def register(self, name, wallet, use_case=None):
        resp = requests.post(f"{self.url}/v1/agents/register", json={
            "name": name,
            "wallet_address": wallet,
            "use_case": use_case
        })
        data = resp.json()
        if data.get("success"):
            self.agent_uid = data["agent"]["uid"]
        return data
    
    def create_payment_link(self, amount, description, reference=None):
        resp = requests.post(
            f"{self.url}/v1/payments/create-link",
            headers={"X-Agent-UID": self.agent_uid},
            json={
                "amount": amount,
                "currency": "USD",
                "description": description,
                "reference": reference
            }
        )
        return resp.json()

# Usage
agent = KirapayAgent(
    agent_uid="KA-abc123xyz",  # Or None if not registered yet
    middleware_url="https://api.your-middleware.com"
)

# If new agent
agent.register(
    name="payout-bot",
    wallet="0x742d35Cc6634C0532925a3b844Bc9e7595f6eB12",
    use_case="merchant settlements"
)

# Request payment
result = agent.create_payment_link(
    amount=1000,
    description="Payment for Order #12345",
    reference="order-12345"
)

print(result["payment"]["link"])  # Payment link to send to user
```

---

## What's Tracked

| What KIRAPAY Sees | What You Track |
|-------------------|----------------|
| Your API key | Agent UID |
| Payment amount | Agent wallet |
| Payment status | Agent name |
| Timestamp | Full transaction history |

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| 404 | Invalid UID | Agent must register first |
| 400 | Invalid amount | Check input format |
| 500 | KIRAPAY error | Retry with backoff |

---

## Best Practices

1. **Store UID securely** - Agents need it for every request
2. **Verify wallet** - Confirm before first payment
3. **Use webhooks** - Track payment completion
4. **Log everything** - Full audit trail
