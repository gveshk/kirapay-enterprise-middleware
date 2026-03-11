# KIRAPAY Enterprise Middleware

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/gveshk/kirapay-enterprise-middleware.git
cd kirapay-enterprise-middleware/code

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your KIRAPAY API key
# Get it from https://dashboard.kira-pay.com

# Start the server
npm start
```

### Docker

```bash
# Build and run
docker build -t kirapay-middleware .
docker run -p 3000:3000 -e KIRAPAY_API_KEY=your_key kirapay-middleware
```

Or use docker-compose:

```bash
docker-compose up -d
```

## Quick Test

```bash
# Register an agent
curl -X POST http://localhost:3000/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "test-agent", "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f6eB12"}'

# Create payment (use the UID from above)
curl -X POST http://localhost:3000/v1/payments/create-link \
  -H "Content-Type: application/json" \
  -H "X-Agent-UID: KA-xxx" \
  -d '{"amount": 10, "description": "Test payment"}'
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/agents/register | Register new agent |
| GET | /v1/agents | List all agents |
| GET | /v1/chains | Get supported chains |
| GET | /v1/chains/tokens/:chainId | Get tokens for chain |
| POST | /v1/payments/create-link | Create payment link |
| GET | /v1/transactions | List transactions |

See [API-SPEC.md](../API-SPEC.md) for full documentation.

## License

MIT
