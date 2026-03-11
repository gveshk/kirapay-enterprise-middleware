# API Specification - KIRAPAY Enterprise Middleware

## Base URL

```
Production: https://api.your-middleware.com
Development: http://localhost:3000
```

## Authentication

This middleware uses simple UID-based auth for agents.

### Register Agent
```
POST /v1/agents/register
```

**Request:**
```json
{
  "name": "string (required)",
  "use_case": "string (optional)",
  "wallet_address": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "agent": {
    "uid": "KA-abc123xyz",
    "name": "merchant-payout-bot",
    "wallet_address": "0x742d...",
    "use_case": "automated settlements",
    "status": "active",
    "created_at": "2026-03-11T07:00:00Z"
  }
}
```

---

### List Agents
```
GET /v1/agents
```

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "uid": "KA-abc123xyz",
      "name": "merchant-payout-bot",
      "wallet_address": "0x742d...",
      "status": "active",
      "created_at": "2026-03-11T07:00:00Z"
    }
  ]
}
```

### Get Agent
```
GET /v1/agents/:uid
```

---

## Chains & Tokens

### Get Supported Chains
```
GET /v1/chains
```

**Response:**
```json
{
  "success": true,
  "chains": [
    { "id": "1", "name": "Ethereum", "symbol": "ETH", "type": "EVM" },
    { "id": "137", "name": "Polygon", "symbol": "MATIC", "type": "EVM" },
    { "id": "8453", "name": "Base", "symbol": "ETH", "type": "EVM" },
    { "id": "56", "name": "BNB Chain", "symbol": "BNB", "type": "EVM" },
    { "id": "43114", "name": "Avalanche", "symbol": "AVAX", "type": "EVM" },
    { "id": "sol", "name": "Solana", "symbol": "SOL", "type": "SOL" },
    { "id": "btc", "name": "Bitcoin", "symbol": "BTC", "type": "BTC" }
  ]
}
```

### Get Tokens for Chain
```
GET /v1/chains/tokens/:chainId
```

**Example:** `GET /v1/chains/tokens/8453` (Base)

**Response:**
```json
{
  "success": true,
  "chainId": "8453",
  "tokens": [
    { "chainId": 8453, "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "name": "USD Coin", "symbol": "USDC" },
    { "chainId": 8453, "address": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", "name": "Dai Stablecoin", "symbol": "DAI" },
    { "chainId": 8453, "address": "0x4200000000000000000000000000000000000006", "name": "Wrapped Ether", "symbol": "WETH" }
  ]
}
```

---

## Payments

All payment requests use the `X-Agent-UID` header.

### Create Payment Link
```
POST /v1/payments/create-link
Headers: X-Agent-UID: KA-abc123xyz
```

**Request:**
```json
{
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment for Order #12345",
  "reference": "order-12345",
  "tokenOut": {
    "chainId": "8453",
    "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  }
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "klp_xyz789",
    "link": "https://checkout.kira-pay.com/xyz789",
    "amount": 100.00,
    "currency": "USD",
    "status": "pending",
    "created_at": "2026-03-11T07:00:00Z"
  }
}
```

#### tokenOut Options

| Chain | chainId | USDC Address | Symbol |
|-------|---------|---------------|--------|
| Ethereum | 1 | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 | USDC |
| Polygon | 137 | 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 | USDC |
| Base | 8453 | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | USDC |
| BNB | 55 | 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d | USDC |
| Solana | sol | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v | USDC |

### Get Payment Status
```
GET /v1/payments/:payment_id
Headers: X-Agent-UID: KA-abc123xyz
```

---

## Transactions

### List All Transactions
```
GET /v1/transactions
```

### Filter by Agent
```
GET /v1/transactions?agent_uid=KA-abc123xyz
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_abc123",
      "agent_uid": "KA-abc123xyz",
      "kirapay_payment_id": "klp_xyz789",
      "amount": 100.00,
      "currency": "USD",
      "status": "completed",
      "description": "Payment for Order #12345",
      "created_at": "2026-03-11T07:00:00Z"
    }
  ]
}
```

---

## Webhooks

### Register Webhook
```
POST /v1/webhooks
Headers: X-Agent-UID: KA-abc123xyz
```

**Request:**
```json
{
  "url": "https://your-agent.com/webhook",
  "events": ["payment.completed", "payment.failed"]
}
```

---

## Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | invalid_request | Malformed request |
| 401 | unauthorized | Missing or invalid X-Agent-UID |
| 404 | not_found | Agent or payment not found |
| 500 | server_error | KIRAPAY API error |

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "invalid_request",
    "message": "Amount must be positive"
  }
}
```

---

## Code Examples

### Python
```python
import requests

class KirapayAgent:
    def __init__(self, agent_uid, base_url="http://localhost:3000"):
        self.agent_uid = agent_uid
        self.url = base_url
    
    def create_payment_link(self, amount, description, tokenOut=None):
        data = {
            "amount": amount,
            "description": description
        }
        if tokenOut:
            data["tokenOut"] = tokenOut
        
        resp = requests.post(
            f"{self.url}/v1/payments/create-link",
            headers={"X-Agent-UID": self.agent_uid},
            json=data
        )
        return resp.json()

# Usage
agent = KirapayAgent("KA-abc123xyz")
result = agent.create_payment_link(
    amount=100,
    description="Payment for Order #12345",
    tokenOut={"chainId": "8453", "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}
)
print(result["payment"]["link"])
```

### Node.js
```javascript
class KirapayAgent {
  constructor(agentUid, baseUrl = 'http://localhost:3000') {
    this.agentUid = agentUid;
    this.baseUrl = baseUrl;
  }

  async createPaymentLink(amount, description, tokenOut = null) {
    const body = { amount, description };
    if (tokenOut) body.tokenOut = tokenOut;
    
    const resp = await fetch(`${this.baseUrl}/v1/payments/create-link`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Agent-UID': this.agentUid
      },
      body: JSON.stringify(body)
    });
    return resp.json();
  }
}

// Usage
const agent = new KirapayAgent('KA-abc123xyz');
const result = await agent.createPaymentLink(
  100,
  'Payment for Order #12345',
  { chainId: '8453', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }
);
console.log(result.payment.link);
```
