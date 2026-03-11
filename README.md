# KIRAPAY Enterprise Middleware

Enterprise Middleware for AI Agents to interact with KIRAPAY payments.

## Overview

KIRAPAY's API requires email verification (human involvement). This middleware enables **autonomous agent payments** by:

1. **You hold the KIRAPAY API key** - All requests appear as your enterprise
2. **Middleware manages agents** - Register agents, generate UIDs, track activity
3. **Agents use the middleware** - Request payments via their unique UID
4. **Your DB tracks everything** - Know which agent did what payment

**From KIRAPAY's view:** Just your enterprise making payments  
**From your view:** Full visibility into each agent's activity

## Quick Start

### 1. Start the Server

```bash
cd code
npm install
cp .env.example .env
# Edit .env with your KIRAPAY API key
npm start
```

Server runs on `http://localhost:3000`

### 2. Register an Agent

```bash
curl -X POST http://localhost:3000/v1/agents/register \
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
  "success": true,
  "agent": {
    "uid": "KA-abc123xyz",
    "name": "payment-bot-001",
    "wallet_address": "0x1234...abcd",
    "status": "active"
  }
}
```

### 3. Get Supported Chains & Tokens

```bash
# List supported chains
curl http://localhost:3000/v1/chains

# Get tokens for a chain (e.g., Base = 8453)
curl http://localhost:3000/v1/chains/tokens/8453
```

### 4. Create Payment Link

```bash
curl -X POST http://localhost:3000/v1/payments/create-link \
  -H "Content-Type: application/json" \
  -H "X-Agent-UID: KA-abc123xyz" \
  -d '{
    "amount": 100,
    "description": "Payment for Order #12345",
    "reference": "order-12345",
    "tokenOut": {
      "chainId": "8453",
      "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "klp_xyz789",
    "link": "https://checkout.kira-pay.com/xyz789",
    "amount": 100,
    "status": "pending"
  }
}
```

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌─────────────┐
│   AI Agent  │────▶│   Middleware     │────▶│   KIRAPAY   │────▶│   Wallet    │
│  (Your App) │     │  (This Engine)   │     │  (Your Key) │     │ (Agent's)   │
└─────────────┘     └──────────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Your DB    │
                   │  (Tracks    │
                   │   Agents)   │
                   └─────────────┘
```

## Supported Chains

| Chain ID | Name | Type |
|----------|------|------|
| 1 | Ethereum | EVM |
| 137 | Polygon | EVM |
| 8453 | Base | EVM |
| 56 | BNB Chain | EVM |
| 43114 | Avalanche | EVM |
| sol | Solana | SOL |
| btc | Bitcoin | BTC |

## Environment Variables

```bash
# Required
KIRAPAY_API_KEY=your_kirapay_api_key

# Optional
PORT=3000
DATABASE_PATH=./data/kirapay.db
KIRAPAY_BASE_URL=https://api.kira-pay.com
```

## License

MIT
