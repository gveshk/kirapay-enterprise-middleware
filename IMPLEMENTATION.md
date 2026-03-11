# Implementation Plan - KIRAPAY Enterprise Middleware

## Tech Stack Recommendation

**Node.js with Express** - Chosen for:
- Simple, well-understood patterns
- Excellent JSON handling for API work
- Large ecosystem for future extensibility
- Easy deployment anywhere
- Good fit for middleware/proxy patterns

### Key Dependencies
- `express` - Web framework
- `uuid` - Generate unique IDs
- `better-sqlite3` - Simple SQL DB (zero-config, production-ready)
- `axios` - HTTP client for KIRAPAY API calls
- `dotenv` - Environment configuration

---

## Project Structure

```
kirapay-enterprise-middleware/
├── code/
│   ├── src/
│   │   ├── index.js           # Main server entry
│   │   ├── config/
│   │   │   └── database.js    # SQLite setup
│   │   ├── routes/
│   │   │   ├── agents.js      # Agent endpoints
│   │   │   ├── payments.js    # Payment endpoints
│   │   │   └── webhooks.js    # Webhook handling
│   │   ├── middleware/
│   │   │   └── auth.js        # X-Agent-UID validation
│   │   ├── services/
│   │   │   └── kirapay.js     # KIRAPAY API integration
│   │   └── utils/
│   │       └── logger.js      # Activity logging
│   ├── .env.example           # Environment template
│   ├── package.json
│   └── README.md
├── IMPLEMENTATION.md
└── docs/
    ├── ARCHITECTURE.md
    ├── REQUIREMENTS.md
    ├── API-SPEC.md
    └── AGENT-FLOW.md
```

---

## Implementation Order

### Phase 1: Foundation (Day 1)
1. [x] Set up Node.js project with dependencies
2. [x] Configure SQLite database with schema
3. [x] Create basic Express server
4. [x] Add health check endpoint

### Phase 2: Agent Management (Day 1-2)
5. [ ] Implement `/v1/agents/register` endpoint
6. [ ] Implement `/v1/agents` (list all)
7. [ ] Implement `/v1/agents/:uid` (get one)
8. [ ] Add X-Agent-UID validation middleware

### Phase 3: Payments (Day 2-3)
9. [ ] Implement `/v1/payments/create-link` (stub)
10. [ ] Implement `/v1/payments/:id` (get status)
11. [ ] Implement `/v1/payments/:id/cancel`
12. [ ] Add KIRAPAY service integration

### Phase 4: Transactions & Webhooks (Day 3-4)
13. [ ] Implement `/v1/transactions` (list with filters)
14. [ ] Implement webhook receiver
15. [ ] Implement webhook forwarding to agents

### Phase 5: Production Ready (Day 4-5)
16. [ ] Add input validation (Joi/zod)
17. [ ] Add rate limiting
18. [ ] Add proper error handling
19. [ ] Write unit tests
20. [ ] Dockerize

---

## Database Setup

### SQLite (Recommended for MVP)

The database is automatically created on first run. Schema:

```sql
-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    uid VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(100) NOT NULL,
    use_case TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    agent_uid VARCHAR(20) NOT NULL,
    kirapay_payment_id VARCHAR(100),
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    reference VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_uid) REFERENCES agents(uid)
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY,
    agent_uid VARCHAR(20) NOT NULL,
    url TEXT NOT NULL,
    events TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_uid) REFERENCES agents(uid)
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_uid VARCHAR(20),
    action VARCHAR(100),
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# KIRAPAY (your enterprise key)
KIRAPAY_API_KEY=your_api_key_here
KIRAPAY_BASE_URL=https://api.kira-pay.com

# Database
DATABASE_PATH=./data/kirapay.db
```

---

## MVP Scope

### What's Included
- ✅ Agent registration with UID generation
- ✅ In-memory/SQLite database
- ✅ Basic payment link creation (stub)
- ✅ Transaction logging
- ✅ Health check endpoint

### What's Stubbed (v1)
- KIRAPAY API calls return mock responses
- Webhook forwarding queued for v1.1
- Rate limiting queued for v1.1

---

## Running the MVP

```bash
cd code
npm install
cp .env.example .env
# Edit .env with your KIRAPAY API key
npm start
```

Server runs on `http://localhost:3000`

---

## Next Steps After MVP

1. Replace stub with real KIRAPAY API calls
2. Add webhook receiver endpoint
3. Implement webhook forwarding
4. Add input validation
5. Dockerize for production
6. Deploy to cloud (Railway/Render/DigitalOcean)
