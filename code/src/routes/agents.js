const { v4: uuidv4 } = require('uuid');
const { agents } = require('../config/database');
const { logActivity } = require('../utils/logger');

const router = require('express').Router();

// Generate unique UID
function generateUid() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let uid = 'KA-';
  for (let i = 0; i < 10; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}

// Register new agent
router.post('/register', (req, res) => {
  try {
    const { name, wallet_address, use_case } = req.body;
    
    // Validation
    if (!name || !wallet_address) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'name and wallet_address are required'
        }
      });
    }
    
    // Generate UID
    const uid = generateUid();
    
    // Insert into database
    agents.create.run({
      uid,
      name,
      wallet_address,
      use_case: use_case || null,
      status: 'active'
    });
    
    // Log activity
    logActivity(uid, 'agent_registered', { name, wallet_address });
    
    // Return response
    const agent = agents.findByUid.get(uid);
    res.status(201).json({
      success: true,
      agent: {
        uid: agent.uid,
        name: agent.name,
        wallet_address: agent.wallet_address,
        use_case: agent.use_case,
        status: agent.status,
        created_at: agent.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to register agent'
      }
    });
  }
});

// List all agents
router.get('/', (req, res) => {
  try {
    const allAgents = agents.findAll.all();
    res.json({
      success: true,
      agents: allAgents.map(a => ({
        uid: a.uid,
        name: a.name,
        wallet_address: a.wallet_address,
        use_case: a.use_case,
        status: a.status,
        created_at: a.created_at
      }))
    });
  } catch (error) {
    console.error('List agents error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to list agents'
      }
    });
  }
});

// Get agent by UID
router.get('/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    const agent = agents.findByUid.get(uid);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'not_found',
          message: 'Agent not found'
        }
      });
    }
    
    res.json({
      success: true,
      agent: {
        uid: agent.uid,
        name: agent.name,
        wallet_address: agent.wallet_address,
        use_case: agent.use_case,
        status: agent.status,
        created_at: agent.created_at
      }
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to get agent'
      }
    });
  }
});

module.exports = router;
