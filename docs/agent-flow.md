# KIRAPAY Agent Flow - Complete Guide

> How AI agents integrate with KIRAPAY for autonomous payments

---

## Overview

KIRAPAY enables AI agents to:
1. Register themselves with a unique identity
2. Generate payment links programmatically
3. Receive payments in crypto (USDC, USDT, ETH)
4. Get instant notifications via webhooks

**No bank accounts. No human intervention. Just code.**

---

## Step-by-Step Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AGENT     │     │  MIDDLEWARE │     │  KIRA-PAY   │     │   CUSTOMER  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                    │                    │                    │
       │ 1. POST /register  │                    │                    │
       │  name + wallet     │                    │                    │
       │───────────────────>│                    │                    │
       │<───────────────────│                    │                    │
       │  Agent UID         │                    │                    │
       │  (KA-abc123...)    │                    │                    │
       │                    │                    │                    │
       │ 2. POST /payments  │                    │                    │
       │  amount + desc    │                    │                    │
       │  + X-Agent-UID    │                    │                    │
       │───────────────────>│                    │                    │
       │                    │ 3. Create Payment │                    │
       │                    │───────────────────>│                    │
       │                    │<───────────────────│                    │
       │                    │  Payment Link      │                    │
       │<───────────────────│                    │                    │
       │  Payment URL       │                    │                    │
       │                    │                    │ 4. Customer Pays   │
       │                    │                    │<──────────────────>│
       │                    │                    │                    │
       │                    │ 5. Webhook          │                    │
       │                    │<───────────────────│                    │
       │                    │  payment.completed  │                    │
       │                    │                    │                    │
       │                    │ 6. Forward to Agent │                    │
       │                    │  (your webhook URL)│                    │
       │<───────────────────│                    │                    │
       │  notification      │                    │                    │
       │                    │                    │                    │
```

---

## Step 1: Register Agent

**Endpoint:** `POST /v1/agents/register`

```javascript
// JavaScript
const res = await fetch('https://your-middleware.com/v1/agents/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'my-coding-agent',
    wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1',
    use_case: 'Code generation for clients'
  })
});
const { agent } = await res.json();
// agent.uid = "KA-abc123xyz"
```

```python
# Python
import requests

res = requests.post('https://your-middleware.com/v1/agents/register', json={
    'name': 'my-coding-agent',
    'wallet_address': '0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1',
    'use_case': 'Code generation for clients'
})
agent = res.json()['agent']
# agent['uid'] = "KA-abc123xyz"
```

**Response:**
```json
{
  "success": true,
  "agent": {
    "uid": "KA-abc123xyz",
    "name": "my-coding-agent",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1",
    "status": "active",
    "created_at": "2026-03-12T10:00:00Z"
  }
}
```

---

## Step 2: Create Payment Link

**Endpoint:** `POST /v1/payments/create-link`

**Required Header:** `X-Agent-UID: KA-abc123xyz`

```javascript
// JavaScript
const res = await fetch('https://your-middleware.com/v1/payments/create-link', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-Agent-UID': 'KA-abc123xyz'
  },
  body: JSON.stringify({
    amount: 50.00,
    currency: 'USDC',
    description: 'Code generation service - Project Alpha'
  })
});
const { payment } = await res.json();
// payment.link = "https://checkout.kira-pay.com/xxx"
```

```python
# Python
res = requests.post(
    'https://your-middleware.com/v1/payments/create-link',
    headers={'X-Agent-UID': 'KA-abc123xyz'},
    json={
        'amount': 50.00,
        'currency': 'USDC', 
        'description': 'Code generation service - Project Alpha'
    }
)
payment = res.json()['payment']
# payment['link'] = "https://checkout.kira-pay.com/xxx"
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "pay_abc123",
    "link": "https://checkout.kira-pay.com/ilh9qc7k",
    "amount": 50.00,
    "currency": "USDC",
    "status": "pending",
    "created_at": "2026-03-12T10:05:00Z"
  }
}
```

**Send the `payment.link` to your customer** - they complete payment on KIRA-PAY's checkout page.

---

## Step 3: Register Webhook (Optional but Recommended)

Get instant notifications when payments complete.

**Endpoint:** `POST /v1/webhooks`

**Required Header:** `X-Agent-UID: KA-abc123xyz`

```javascript
// JavaScript
const res = await fetch('https://your-middleware.com/v1/webhooks', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-Agent-UID': 'KA-abc123xyz'
  },
  body: JSON.stringify({
    url: 'https://my-agent.com/kirapay-webhook',
    events: ['payment.completed', 'payment.failed']
  })
});
```

```python
# Python
res = requests.post(
    'https://your-middleware.com/v1/webhooks',
    headers={'X-Agent-UID': 'KA-abc123xyz'},
    json={
        'url': 'https://my-agent.com/kirapay-webhook',
        'events': ['payment.completed', 'payment.failed']
    }
)
```

---

## Step 4: Receive Webhook Notification

When payment completes, KIRAPAY forwards the event to your webhook URL.

**Webhook Payload:**
```json
{
  "event": "payment.completed",
  "agent_uid": "KA-abc123xyz",
  "payment": {
    "payment_id": "pay_abc123",
    "amount": 50.00,
    "currency": "USDC",
    "status": "completed"
  },
  "timestamp": "2026-03-12T10:10:00Z"
}
```

**Webhook Handler Examples:**

```javascript
// Express.js
app.post('/kirapay-webhook', express.json(), (req, res) => {
  const { event, payment } = req.body;
  
  if (event === 'payment.completed') {
    console.log(`Received ${payment.amount} ${payment.currency}`);
    // TODO: Send code, unlock feature, etc.
  }
  
  res.status(200).send('OK');
});
```

```python
# Flask
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/kirapay-webhook', methods=['POST'])
def handle_webhook():
    data = request.json
    event = data.get('event')
    payment = data.get('payment', {})
    
    if event == 'payment.completed':
        amount = payment.get('amount')
        currency = payment.get('currency')
        print(f"Received {amount} {currency}")
        # TODO: Send code, unlock feature, etc.
    
    return jsonify({'ok': True})
```

---

## Complete Example: Autonomous Coding Agent

```python
import requests
from flask import Flask, request, jsonify

API_BASE = 'https://your-middleware.com'

# === AGENT SETUP ===
AGENT_UID = None  # Set after registration
WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1'

def register():
    global AGENT_UID
    res = requests.post(f'{API_BASE}/v1/agents/register', json={
        'name': 'code-gen-bot',
        'wallet_address': WALLET_ADDRESS,
        'use_case': 'Generates code for clients'
    })
    AGENT_UID = res.json()['agent']['uid']
    
    # Register webhook
    requests.post(f'{API_BASE}/v1/webhooks', 
        headers={'X-Agent-UID': AGENT_UID},
        json={'url': 'https://my-agent.com/webhook'})
    
    return AGENT_UID

def create_invoice(amount_usd, description):
    res = requests.post(
        f'{API_BASE}/v1/payments/create-link',
        headers={'X-Agent-UID': AGENT_UID},
        json={'amount': amount_usd, 'description': description}
    )
    return res.json()['payment']['link']

# === WEBHOOK HANDLER ===
app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def handle_payment():
    data = request.json
    if data['event'] == 'payment.completed':
        # Payment received! Send the code.
        print(f"Got paid! Sending code...")
    return jsonify({'ok': True})

# === USAGE ===
if __name__ == '__main__':
    register()
    
    # Client asks for code
    payment_link = create_invoice(100, "Full-stack web app")
    print(f"Please pay here: {payment_link}")
    
    # Wait for webhook to trigger code delivery
    app.run(port=5000)
```

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v1/agents/register` | POST | None | Register new agent |
| `/v1/agents/:uid` | GET | None | Get agent details |
| `/v1/payments/create-link` | POST | X-Agent-UID | Generate payment link |
| `/v1/payments/:id` | GET | X-Agent-UID | Get payment status |
| `/v1/payments/:id/cancel` | POST | X-Agent-UID | Cancel pending payment |
| `/v1/webhooks` | POST | X-Agent-UID | Register webhook |
| `/v1/webhooks` | GET | X-Agent-UID | List webhooks |
| `/v1/transactions` | GET | X-Agent-UID | List all transactions |

---

## Supported Cryptocurrencies

- **USDC** (recommended)
- **USDT**
- **ETH**

---

## Supported Chains

| Chain | Chain ID |
|-------|----------|
| Ethereum | 1 |
| Base | 8453 |
| Solana | 101 |
| Polygon | 137 |
| Arbitrum | 42161 |
| BNB Chain | 56 |
| Avalanche | 43114 |
| + 13 more | |

---

## Fees

- **Transaction Fee:** 0.5%
- **No setup fees**
- **No monthly fees**

---

## Questions?

- Email: support@kira-pay.com
- Docs: https://docs.kira-pay.com
- Dashboard: https://dashboard.kira-pay.com
