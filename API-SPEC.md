# API Specification - KIRAPAY Enterprise Middleware

## Base URL

```
Production: https://api.kirapay.com
Sandbox:    https://api-sandbox.kirapay.com
```

## Authentication

### Register Agent
```
POST /v1/agents/register
```

**Request:**
```json
{
  "name": "string (required)",
  "description": "string",
  "contact_email": "string (required)",
  "webhook_url": "string",
  "scopes": ["payments:write", "accounts:read"]
}
```

**Response:**
```json
{
  "agent_id": "agn_xxx",
  "api_key": "kp_live_xxx",
  "api_secret": "ks_live_xxx",
  "status": "active",
  "created_at": "2026-03-11T07:00:00Z"
}
```

---

### Get JWT Token
```
POST /v1/auth/token
```

**Request:**
```json
{
  "api_key": "string (required)",
  "api_secret": "string (required)",
  "expires_in": 3600
}
```

**Response:**
```json
{
  "access_token": "eyJxxx",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Accounts

### Get Balance
```
GET /v1/accounts/balance
```

**Response:**
```json
{
  "account_id": "acc_xxx",
  "available": 50000.00,
  "pending": 2500.00,
  "currency": "USD"
}
```

### Get Account Details
```
GET /v1/accounts/{account_id}
```

---

## Payments

### Initiate Payment
```
POST /v1/payments/initiate
```

**Request:**
```json
{
  "amount": 1000.00,
  "currency": "USD",
  "recipient": {
    "type": "merchant|wallet|bank",
    "id": "string"
  },
  "reference": "ORDER-12345",
  "description": "string",
  "metadata": {}
}
```

**Response:**
```json
{
  "payment_id": "pay_xxx",
  "status": "pending|completed|failed",
  "amount": 1000.00,
  "currency": "USD",
  "created_at": "2026-03-11T07:00:00Z"
}
```

### Get Payment Status
```
GET /v1/payments/{payment_id}
```

### Cancel Payment
```
POST /v1/payments/{payment_id}/cancel
```

---

## Refunds

### Initiate Refund
```
POST /v1/refunds
```

**Request:**
```json
{
  "payment_id": "pay_xxx",
  "amount": 500.00,
  "reason": "customer_request"
}
```

---

## Merchants

### List Merchants
```
GET /v1/merchants
```

### Get Merchant
```
GET /v1/merchants/{merchant_id}
```

---

## Webhooks

### Register Webhook
```
POST /v1/webhooks
```

**Request:**
```json
{
  "url": "https://your-site.com/webhooks",
  "events": ["payment.completed", "payment.failed"],
  "secret": "your-webhook-secret"
}
```

### List Webhooks
```
GET /v1/webhooks
```

### Delete Webhook
```
DELETE /v1/webhooks/{webhook_id}
```

---

## Usage & Limits

### Get Usage Stats
```
GET /v1/usage
```

**Response:**
```json
{
  "period": "2026-03",
  "requests": {
    "total": 10000,
    "remaining": 90000
  },
  "payments": {
    "total": 500,
    "volume": 500000.00
  }
}
```

---

## Audit

### Query Audit Logs
```
GET /v1/audit/logs
```

**Query Params:**
- `agent_id`
- `payment_id`
- `from` (ISO date)
- `to` (ISO date)
- `limit` (max 100)

---

## Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | invalid_request | Malformed request |
| 401 | unauthorized | Invalid/missing auth |
| 403 | forbidden | Insufficient permissions |
| 404 | not_found | Resource doesn't exist |
| 429 | rate_limited | Too many requests |
| 500 | server_error | Internal error |

**Error Format:**
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Amount must be positive",
    "param": "amount"
  }
}
```
