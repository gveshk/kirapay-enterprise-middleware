# KIRAPAY Enterprise Middleware

Enterprise Middleware for AI Agents to interact with KIRAPAY payments.

## The Concept

KIRAPAY's API requires email verification (human involvement). This middleware enables **autonomous agent payments** by:

1. **You hold the KIRAPAY API key** - All requests appear as your enterprise
2. **Middleware manages agents** - Register agents, generate UIDs, track activity
3. **Agents use the middleware** - Request payments via their unique UID
4. **Your DB tracks everything** - Know which agent did what payment

**From KIRAPAY's view:** Just your enterprise making payments  
**From your view:** Full visibility into each agent's activity

## Quick Start

### 1. Register an Agent

```bash
curl -X POST https://api.your-middleware.com/v1/agents/register \
  -H "Authorization: Bearer YOUR_ENTERPRISE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payment-bot-001",
    "use_case": "automated merchant payouts",
    "wallet_address": "0x1234...abcd"
  }'
```

**Response:**
```json
{
  "agent_id": "agn_abc123",
  "uid": "KA-abc123xyz",
  "name": "payment-bot-001",
  "wallet_address": "0x1234...abcd",
  "status": "active",
  "created_at": "2026-03-11T07:00:00Z"
}
```

### 2. Agent Requests Payment

```bash
# Agent requests payment link
curl -X POST https://api.your-middleware.com/v1/payments/create-link \
  -H "Authorization: Bearer AGENT_UID" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "USD",
    "description": "Payment for Order #12345",
    "agent_reference": "order-12345"
  }'
```

### 3. Middleware Routes to KIRAPAY

The middleware:
- Adds the agent's UID to your DB record
- Calls KIRAPAY using **your** API key
- Returns payment link to agent

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌─────────────┐
│   AI Agent  │────▶│   Middleware     │────▶│   KIRAPAY   │────▶│   Payout    │
│  (Your App) │     │  (This Engine)   │     │   (Your Key)│     │  (Wallet)   │
└─────────────┘     └──────────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Your DB    │
                    │  (Tracks    │
                    │   Agents)   │
                    └─────────────┘
```

**Agent View:** Simple API - register, request payments  
**KIRAPAY View:** Just your enterprise account  
**Your View:** Full agent activity tracking

## Why This Works

| Challenge | Solution |
|-----------|----------|
| KIRAPAY needs email verification | All requests via your verified API key |
| Can't distinguish agent payments | Track in your DB by agent UID |
| Agent autonomy | Agents can self-register, get UID, request payments |
| Settlement | Payments go to agent's registered wallet |

## What's Included

- [Architecture](./ARCHITECTURE.md) - System design
- [Requirements](./REQUIREMENTS.md) - What this middleware needs
- [Agent Flow](./AGENT-FLOW.md) - How agents integrate
- [API Spec](./API-SPEC.md) - Endpoints reference

## License

MIT
