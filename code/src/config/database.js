require('dotenv').config();
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/kirapay.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize sql.js
let db;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS agents (
      uid VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      wallet_address VARCHAR(100) NOT NULL,
      use_case TEXT,
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
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
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      agent_uid VARCHAR(20) NOT NULL,
      url TEXT NOT NULL,
      events TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_uid) REFERENCES agents(uid)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_uid VARCHAR(20),
      action VARCHAR(100),
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Save initially
  saveDatabase();
  
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper to run queries
function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

// Helper to get one row
function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// Helper to get all rows
function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Prepared statements for agents
const agents = {
  create: {
    run: (params) => runQuery(
      `INSERT INTO agents (uid, name, wallet_address, use_case, status) VALUES (?, ?, ?, ?, ?)`,
      [params.uid, params.name, params.wallet_address, params.use_case, params.status]
    )
  },
  
  findByUid: {
    get: (uid) => getOne(`SELECT * FROM agents WHERE uid = ?`, [uid])
  },
  
  findAll: {
    all: () => getAll(`SELECT * FROM agents ORDER BY created_at DESC`)
  },
  
  updateStatus: {
    run: (status, uid) => runQuery(`UPDATE agents SET status = ? WHERE uid = ?`, [status, uid])
  }
};

// Prepared statements for transactions
const transactions = {
  create: {
    run: (params) => runQuery(
      `INSERT INTO transactions (id, agent_uid, kirapay_payment_id, amount, currency, status, description, reference, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [params.id, params.agent_uid, params.kirapay_payment_id, params.amount, params.currency, params.status, params.description, params.reference, params.link]
    )
  },
  
  findById: {
    get: (id) => getOne(`SELECT * FROM transactions WHERE id = ?`, [id])
  },
  
  findByAgent: {
    all: (agentUid) => getAll(`SELECT * FROM transactions WHERE agent_uid = ? ORDER BY created_at DESC`, [agentUid])
  },
  
  findAll: {
    all: () => getAll(`SELECT * FROM transactions ORDER BY created_at DESC`)
  },
  
  updateStatus: {
    run: (status, id) => runQuery(`UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id])
  },
  
  findByKirapayId: {
    get: (kirapayId) => getOne(`SELECT * FROM transactions WHERE kirapay_payment_id = ?`, [kirapayId])
  }
};

// Prepared statements for activity log
const activityLog = {
  create: {
    run: (params) => runQuery(
      `INSERT INTO activity_log (agent_uid, action, details) VALUES (?, ?, ?)`,
      [params.agent_uid, params.action, params.details]
    )
  },
  
  findByAgent: {
    all: (agentUid) => getAll(`SELECT * FROM activity_log WHERE agent_uid = ? ORDER BY created_at DESC LIMIT 100`, [agentUid])
  },
  
  findAll: {
    all: () => getAll(`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100`)
  }
};

// Prepared statements for webhooks
const webhooks = {
  create: {
    run: (params) => runQuery(
      `INSERT INTO webhooks (id, agent_uid, url, events) VALUES (?, ?, ?, ?)`,
      [params.id, params.agent_uid, params.url, params.events]
    )
  },
  
  findByAgent: {
    all: (agentUid) => getAll(`SELECT * FROM webhooks WHERE agent_uid = ?`, [agentUid])
  },
  
  findById: {
    get: (id) => getOne(`SELECT * FROM webhooks WHERE id = ?`, [id])
  },
  
  delete: {
    run: (id) => runQuery(`DELETE FROM webhooks WHERE id = ?`, [id])
  }
};

// Export sync version for backwards compatibility (when db is initialized)
let dbModule = {
  ready: false,
  agents,
  transactions,
  activityLog,
  webhooks
};

// Initialize and export
initDatabase().then(database => {
  dbModule.db = database;
  dbModule.ready = true;
  console.log('✅ Database initialized');
});

module.exports = dbModule;
