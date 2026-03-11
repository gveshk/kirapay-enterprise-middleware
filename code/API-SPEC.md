# API Specification - KIRAPAY Enterprise Middleware

## Base URL

```
Production: https://api.your-middleware.com
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
  "amount": 1000.00,
  "currency": "USD",
  "description": "Payment for Order #12345",
  "reference": "order-12345"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "klp_xyz789",
    "link": "https://pay.kira-pay.com/xyz789",
    "amount": 1000.00,
    "currency": "USD",
    "status": "pending",
    "created_at": "2026-03-11T07:00:00Z"
  }
}
```

### Get Payment Status
```
GET /v1/payments/:payment_id
Headers: X-Agent-UID: KA-abc123xyz
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "klp_xyz789",
    "amount": 1000.00,
    "currency": "USD",
    "status": "completed",
    "created_at": "2026-03-11T07:00:00Z"
  }
}
```

### Cancel Payment
```
POST /v1/payments/:payment_id/cancel
Headers: X-Agent-UID: KA-abc123xyz
```

---

## Transactions

### List All Transactions
```
GET /v1/transactions
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
      "amount": 1000.00,
      "currency": "USD",
      "status": "completed",
      "description": "Payment for Order #12345",
      "created_at": "2026-03-11T07:00:00Z"
    }
  ]
}
```

### Filter by Agent
```
GET /v1/transactions?agent_uid=KA-abc123xyz
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

### Webhook Payload (forwarded to agent)

```json
{
  "event": "payment.completed",
  "agent_uid": "KA-abc123xyz",
  "payment": {
    "id": "klp_xyz789",
    "amount": 1000.00,
    "status": "completed"
  }
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
