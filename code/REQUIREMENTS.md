# Requirements - KIRAPAY Enterprise Middleware

## Functional Requirements

### Agent Registration
- [ ] Agents can register with: name, use_case (optional), wallet_address
- [ ] System generates unique UID (format: `KA-<random>`)
- [ ] Store agent record in DB
- [ ] Return UID to agent
- [ ] List all registered agents

### Agent Authentication
- [ ] Simple UID-based auth (X-Agent-UID header)
- [ ] Validate UID exists before processing requests
- [ ] Optional: API key per agent for external access

### Payment Operations
- [ ] **Create Payment Link** - Generate payment link via KIRAPAY API
- [ ] **Check Payment Status** - Get status of existing payment
- [ ] **Cancel Payment** - Cancel pending payment
- [ ] **Refund** - Process refund (optional v1)

### KIRAPAY Integration
- [ ] Call KIRAPAY APIs using your enterprise API key
- [ ] Map KIRAPAY response to internal transaction
- [ ] Handle errors gracefully

### Tracking & Records
- [ ] Store every transaction with agent_uid
- [ ] Track: amount, currency, status, timestamp
- [ ] Query transactions by agent UID
- [ ] Query transactions by payment reference

### Webhooks
- [ ] Receive webhooks from KIRAPAY
- [ ] Forward to registered agent endpoints
- [ ] Include agent UID in webhook payload

---

## Database Schema

### Table: agents
| Field | Type | Description |
|-------|------|-------------|
| uid | VARCHAR(20) | Primary key (KA-xxx) |
| name | VARCHAR(255) | Agent name |
| wallet_address | VARCHAR(100) | Settlement wallet |
| use_case | TEXT | What agent uses this for |
| created_at | TIMESTAMP | Registration time |
| status | ENUM | active, suspended |

### Table: transactions
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| agent_uid | VARCHAR(20) | FK to agents |
| kirapay_payment_id | VARCHAR(100) | KIRAPAY's ID |
| amount | DECIMAL | Payment amount |
| currency | VARCHAR(3) | USD, etc |
| status | ENUM | pending, completed, failed |
| description | TEXT | Payment description |
| created_at | TIMESTAMP | Request time |
| updated_at | TIMESTAMP | Last update |

---

## Non-Functional Requirements

### Simplicity
- Keep it simple - no complex auth initially
- Single API key for KIRAPAY
- Basic rate limiting

### Performance
- < 200ms response time
- Handle 100+ concurrent agents

### Security
- KIRAPAY key never exposed to agents
- Input validation on all endpoints
- HTTPS only

### Logging
- Every request logged
- Full transaction history
- Searchable by agent UID

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/agents/register` | POST | Register new agent |
| `/v1/agents` | GET | List all agents |
| `/v1/agents/:uid` | GET | Get agent details |
| `/v1/payments/create-link` | POST | Create payment link |
| `/v1/payments/:id` | GET | Get payment status |
| `/v1/payments/:id/cancel` | POST | Cancel payment |
| `/v1/transactions` | GET | List transactions |
| `/v1/transactions?agent_uid=` | GET | By agent |

---

## What's Out of Scope (v1)

- Multiple enterprise API keys
- Complex agent permissions
- Agent-to-agent transfers
- Built-in crypto wallet (use external)
- Payment processing (via KIRAPAY)
