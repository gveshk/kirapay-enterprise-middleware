# Architecture - KIRAPAY Enterprise Middleware

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agents                                │
│   (Autonomous agents, AI workflows, Enterprise systems)         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS + Auth
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Gateway                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Rate      │  │    Auth      │  │    Request           │  │
│  │   Limiter   │  │    Validator │  │    Router            │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Core Services                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │  Payment   │  │  Account   │  │  Merchant  │  │  Webhook │  │
│  │  Service   │  │  Service   │  │  Service   │  │  Service │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      KIRAPAY Core                                │
│              (Existing payment infrastructure)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Agent Gateway
- **Purpose**: Single entry point for all agent traffic
- **Features**: 
  - TLS termination
  - Request validation
  - Metrics & monitoring
  - DDoS protection

### 2. Authentication Layer
- **API Key Auth**: Per-agent unique keys
- **OAuth2 Flow**: For enterprise integrations
- **JWT Tokens**: Short-lived access tokens
- **Scopes**: Fine-grained permissions (read, write, admin)

### 3. Rate Limiter
- **Per-Agent Limits**: Configurable quotas
- **Burst Handling**: Token bucket algorithm
- **Priority Queues**: VIP agents get priority
- **Usage Tracking**: Real-time monitoring

### 4. Payment Engine
- **Operations**: 
  - Balance queries
  - Payment initiation
  - Payment confirmation
  - Refunds & reversals
  - Recurring payments
- **Idempotency**: Duplicate request handling

### 5. Webhook Dispatcher
- **Async Events**: Payment status updates
- **Retry Logic**: Exponential backoff
- **Event Types**:
  - `payment.completed`
  - `payment.failed`
  - `account.updated`
  - `merchant.verified`

### 6. Audit Logger
- **Full Trail**: Every request logged
- **Compliance**: SOC2, PCI-DSS ready
- **Retention**: Configurable policies
- **Query API**: Search & analytics

## Data Flow

### Agent Payment Flow
```
1. Agent → POST /v1/payments/initiate
2. Gateway → Validate API key
3. Gateway → Check rate limits
4. Payment Service → Create payment record
5. Payment Service → Process with KIRAPAY Core
6. Payment Service → Update status
7. Gateway → Return response to agent
8. Webhook Dispatch → Async notification (if webhook registered)
```

### Authentication Flow
```
1. Agent → Register at /v1/agents/register
2. System → Generate API key + secret
3. Agent → Include in requests (Authorization: Bearer <key>)
4. Gateway → Validate, issue JWT
5. Agent → Use JWT for subsequent requests
```

## Security

- **Encryption**: TLS 1.3 everywhere
- **API Keys**: AES-256 encrypted at rest
- **IP Whitelisting**: Optional per agent
- **Mutual TLS**: For high-security integrations
- **Input Validation**: Strict schema validation
- **SQL Injection**: Parameterized queries only

## Scalability

- **Horizontal Scaling**: Stateless gateway
- **Database**: Sharded for performance
- **Caching**: Redis for hot data
- **CDN**: For static assets
- **Load Balancing**: Round-robin + health checks

## Deployment

- **Container**: Docker + Kubernetes
- **Regions**: Multi-region ready
- **CI/CD**: Automated deployments
- **Health Checks**: Liveness + readiness probes
- **Metrics**: Prometheus + Grafana
