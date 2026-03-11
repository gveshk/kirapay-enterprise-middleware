# Architecture - KIRAPAY Enterprise Middleware

## Core Concept

**The middleware sits between agents and your KIRAPAY API key:**

1. Agents register → get a UID
2. Agents make requests → middleware adds UID tracking
3. Middleware calls KIRAPAY → uses YOUR API key
4. Your DB tracks everything → agent wallet, payment history

---

## System Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                           Agent                                   │
│   - Has UID (e.g., KA-abc123)                                    │
│   - Calls middleware for payments                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │ 1. Request with UID
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Middleware API                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Agent         │  │ Request       │  │ Payment              │  │
│  │ Validator     │─▶│ Transformer  │─▶│ Router               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Agent DB     │  │ Activity     │  │ Webhook              │  │
│  │ (UID→Wallet) │  │ Logger       │  │ Dispatcher           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ 2. Your KIRAPAY API Key
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      KIRAPAY API                                 │
│                   (docs.kira-pay.com)                           │
│                                                                  │
│  - Payment link generation                                      │
│  - Transaction status                                           │
│  - Settlement                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Agent Registry
- Register agents with: name, use_case, wallet_address
- Generate unique UID (format: `KA-<random>`)
- Store mapping: UID → wallet, name, created_at

### 2. Request Transformer
- Takes agent request + UID
- Maps to KIRAPAY API format
- Adds internal reference for tracking

### 3. Payment Router
- Calls KIRAPAY with YOUR API key
- Handles all payment types:
  - Payment link generation
  - Status checks
  - Refunds

### 4. Agent Database (Your DB)
- **Table: agents**
  - `uid` (PRIMARY KEY)
  - `name`
  - `wallet_address`
  - `use_case`
  - `created_at`
  - `status`

- **Table: transactions**
  - `transaction_id`
  - `agent_uid` (FK)
  - `amount`
  - `currency`
  - `status`
  - `kirapay_response`
  - `created_at`

### 5. Activity Logger
- Every request logged
- Track: which agent, what operation, result
- Searchable for debugging

### 6. Webhook Dispatcher
- Forward KIRAPAY webhooks to agents
- Include agent UID in payload

---

## Data Flow Examples

### Agent Registration
```
Agent → POST /agents/register → Middleware
                               → Generate UID: KA-xyz789
                               → Store in DB
                               → Return UID to Agent
```

### Payment Link Request
```
Agent → POST /payments/create-link
       + Header: X-Agent-UID: KA-xyz789
       + Body: { amount, currency, description }

Middleware:
  1. Validate UID exists
  2. Log activity
  3. Call KIRAPAY with YOUR API key
  4. Store transaction with agent_uid
  5. Return payment link to agent
```

### Tracking
```
Your DB knows:
- Agent KA-xyz789 requested $1000 payment
- Status: completed
- Settlement: to wallet 0x1234...
```

---

## Security

- **API Key**: Only your backend holds the KIRAPAY key
- **Agent Auth**: Simple UID header (for internal agents)
- **Rate Limiting**: Per-agent limits optional
- **Input Validation**: Strict schema validation
- **Logging**: Full audit trail

---

## What's NOT Included (v1)

- Complex permission models (keep it simple)
- Multiple API keys (single enterprise key)
- Agent-to-agent transfers
- Crypto conversions

---

## Deployment

- **Simple**: Node.js/Python backend
- **Database**: PostgreSQL/MySQL
- **Hosting**: Your infrastructure or cloud
