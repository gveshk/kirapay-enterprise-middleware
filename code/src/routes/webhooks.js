const { v4: uuidv4 } = require('uuid');
const { webhooks, transactions } = require('../config/database');
const { logActivity } = require('../utils/logger');

const router = require('express').Router();

// Middleware to validate X-Agent-UID
function validateAgent(req, res, next) {
  const agentUid = req.headers['x-agent-uid'];
  
  if (!agentUid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'unauthorized',
        message: 'Missing X-Agent-UID header'
      }
    });
  }
  
  const { agents } = require('../config/database');
  const agent = agents.findByUid.get(agentUid);
  
  if (!agent) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'unauthorized',
        message: 'Invalid agent UID'
      }
    });
  }
  
  req.agent = agent;
  next();
}

// Register webhook for agent
router.post('/', validateAgent, (req, res) => {
  try {
    const { url, events } = req.body;
    const agentUid = req.agent.uid;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'url is required'
        }
      });
    }
    
    const webhookId = uuidv4();
    
    webhooks.create.run({
      id: webhookId,
      agent_uid: agentUid,
      url,
      events: JSON.stringify(events || ['payment.completed', 'payment.failed'])
    });
    
    logActivity(agentUid, 'webhook_registered', { url, events });
    
    res.status(201).json({
      success: true,
      webhook: {
        id: webhookId,
        url,
        events: events || ['payment.completed', 'payment.failed']
      }
    });
  } catch (error) {
    console.error('Register webhook error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to register webhook'
      }
    });
  }
});

// Receive webhook from KIRAPAY (public endpoint)
router.post('/receive', async (req, res) => {
  try {
    const { event, payment_id, amount, status } = req.body;
    
    console.log('📥 Webhook received:', { event, payment_id, status });
    
    // Find transaction
    const transaction = transactions.findByKirapayId.get(payment_id);
    
    if (transaction) {
      // Update transaction status
      const statusMap = {
        'payment.completed': 'completed',
        'payment.failed': 'failed',
        'payment.pending': 'pending'
      };
      
      transactions.updateStatus.run(statusMap[event] || status, transaction.id);
      
      logActivity(transaction.agent_uid, 'webhook_received', {
        event,
        payment_id,
        status
      });
      
      // TODO: Forward to registered agent webhook endpoint
      // This is stubbed for MVP
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook receive error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
