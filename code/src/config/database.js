require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './data/kirapay.db';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
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
    id TEXT PRIMARY KEY,
    agent_uid VARCHAR(20) NOT NULL,
    kirapay_payment_id VARCHAR(100),
    amount REAL NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    reference VARCHAR(100),
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_uid) REFERENCES agents(uid)
  );

  -- Webhooks table
  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    agent_uid VARCHAR(20) NOT NULL,
    url TEXT NOT NULL,
    events TEXT,
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
`);

// Prepared statements for agents
const agents = {
  create: db.prepare(`
    INSERT INTO agents (uid, name, wallet_address, use_case, status)
    VALUES (@uid, @name, @wallet_address, @use_case, @status)
  `),
  
  findByUid: db.prepare(`
    SELECT * FROM agents WHERE uid = ?
  `),
  
  findAll: db.prepare(`
    SELECT * FROM agents ORDER BY created_at DESC
  `),
  
  updateStatus: db.prepare(`
    UPDATE agents SET status = ? WHERE uid = ?
  `)
};

// Prepared statements for transactions
const transactions = {
  create: db.prepare(`
    INSERT INTO transactions (id, agent_uid, kirapay_payment_id, amount, currency, status, description, reference, link)
    VALUES (@id, @agent_uid, @kirapay_payment_id, @amount, @currency, @status, @description, @reference, @link)
  `),
  
  findById: db.prepare(`
    SELECT * FROM transactions WHERE id = ?
  `),
  
  findByAgent: db.prepare(`
    SELECT * FROM transactions WHERE agent_uid = ? ORDER BY created_at DESC
  `),
  
  findAll: db.prepare(`
    SELECT * FROM transactions ORDER BY created_at DESC
  `),
  
  updateStatus: db.prepare(`
    UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),
  
  findByKirapayId: db.prepare(`
    SELECT * FROM transactions WHERE kirapay_payment_id = ?
  `)
};

// Prepared statements for activity log
const activityLog = {
  create: db.prepare(`
    INSERT INTO activity_log (agent_uid, action, details)
    VALUES (@agent_uid, @action, @details)
  `),
  
  findByAgent: db.prepare(`
    SELECT * FROM activity_log WHERE agent_uid = ? ORDER BY created_at DESC LIMIT 100
  `),
  
  findAll: db.prepare(`
    SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100
  `)
};

// Prepared statements for webhooks
const webhooks = {
  create: db.prepare(`
    INSERT INTO webhooks (id, agent_uid, url, events)
    VALUES (@id, @agent_uid, @url, @events)
  `),
  
  findByAgent: db.prepare(`
    SELECT * FROM webhooks WHERE agent_uid = ?
  `),
  
  findById: db.prepare(`
    SELECT * FROM webhooks WHERE id = ?
  `),
  
  delete: db.prepare(`
    DELETE FROM webhooks WHERE id = ?
  `)
};

module.exports = {
  db,
  agents,
  transactions,
  activityLog,
  webhooks
};
