# KIRAPAY Enterprise Middleware

Enterprise Middleware for AI Agents to integrate with KIRAPAY payments.

## Overview

This middleware provides a standardized API layer that allows autonomous AI agents to programmatically interact with KIRAPAY's payment infrastructure. Built for enterprises deploying agentic workflows at scale.

## Why This Matters

- **Agentic Finance**: Autonomous agents can now execute payments, check balances, manage merchants
- **Enterprise-Ready**: Scalable, secure, and compliant infrastructure
- **Standardized Interface**: RESTful APIs with agent-friendly patterns

## Quick Start

```bash
# Register your agent
curl -X POST https://api.kirapay.com/v1/agents/register \
  -H "Authorization: Bearer YOUR_AGENT_KEY" \
  -D "name": "payment-agent-001"

# Check balance
curl https://api.kirapay.com/v1/accounts/balance \
  -H "Authorization: Bearer YOUR_AGENT_KEY"

# Initiate payment
curl -X POST https://api.kirapay.com/v1/payments/initiate \
  -H "Authorization: Bearer YOUR_AGENT_KEY" \
  -d '{"amount": 1000, "currency": "USD", "recipient": "merchant123"}'
```

## Architecture Components

| Component | Description |
|-----------|-------------|
| **Agent Gateway** | Entry point for all agent requests |
| **Auth Layer** | API key + OAuth2 for agent authentication |
| **Rate Limiter** | Per-agent rate limits & quotas |
| **Payment Engine** | Core payment processing |
| **Webhook Dispatcher** | Async notifications to agents |
| **Audit Logger** | Full audit trail for compliance |

## Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API-SPEC.md)
- [Agent Integration Guide](./AGENT-FLOW.md)
- [Requirements](./REQUIREMENTS.md)

## License

MIT
