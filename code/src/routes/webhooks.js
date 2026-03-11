const { v4: uuidv4 } = require('uuid');
const { webhooks: webhooksDb, transactions: transactionsDb } = require('../config/database');
const { logActivity } = require('../utils/logger');
const axios = require('axios');

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
    
    webhooksDb.create.run({
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

// Forward webhook to registered agent URLs
async function forwardToAgent(agentUid, event, paymentData) {
  try {
    // Get all webhooks for this agent
    const webhooks = webhooksDb.findByAgent.all(agentUid);
    
    if (!webhooks || webhooks.length === 0) {
      console.log(`📭 No webhooks registered for agent ${agentUid}`);
      return;
    }
    
    console.log(`📤 Forwarding to ${webhooks.length} webhook(s)`);
    
    const payload = {
      event,
      agent_uid: agentUid,
      payment: paymentData,
      timestamp: new Date().toISOString()
    };
    
    for (const webhook of webhooks) {
      try {
        console.log(`   → Forwarding to: ${webhook.url}`);
        await axios.post(webhook.url, payload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-KIRAPAY-Webhook': 'true'
          }
        });
        console.log(`   ✅ Forwarded successfully`);
      } catch (forwardError) {
        console.error(`   ❌ Failed to forward: ${forwardError.message}`);
      }
    }
  } catch (error) {
    console.error('Error in forwardToAgent:', error);
  }
}

// Receive webhook from KIRAPAY (public endpoint)
router.post('/receive', async (req, res) => {
  try {
    const { event, payment_id, amount, status, currency } = req.body;
    
    console.log('📥 Webhook received:', { event, payment_id, status });
    
    // Find transaction
    const transaction = transactionsDb.findByKirapayId.get(payment_id);
    
    if (transaction) {
      // Update transaction status
      const statusMap = {
        'payment.completed': 'completed',
        'payment.failed': 'failed',
        'payment.pending': 'pending'
      };
      
      transactionsDb.updateStatus.run(statusMap[event] || status, transaction.id);
      
      logActivity(transaction.agent_uid, 'webhook_received', {
        event,
        payment_id,
        status
      });
      
      // Forward to registered agent webhook
      console.log('📤 Forwarding to agent webhook...');
      await forwardToAgent(transaction.agent_uid, event, {
        payment_id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: statusMap[event] || status
      });
    } else {
      console.log(`⚠️ Transaction not found for payment_id: ${payment_id}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook receive error:', error);
    res.status(500).json({ success: false });
  }
});

// List webhooks for agent
router.get('/', validateAgent, (req, res) => {
  try {
    const webhooks = webhooksDb.findByAgent.all(req.agent.uid);
    
    res.json({
      success: true,
      webhooks: webhooks.map(w => ({
        id: w.id,
        url: w.url,
        events: w.events ? JSON.parse(w.events) : ['payment.completed', 'payment.failed'],
        created_at: w.created_at
      }))
    });
  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to list webhooks'
      }
    });
  }
});

// Delete webhook
router.delete('/:webhookId', validateAgent, (req, res) => {
  try {
    const { webhookId } = req.params;
    
    const webhook = webhooksDb.findById.get(webhookId);
    
    if (!webhook || webhook.agent_uid !== req.agent.uid) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'not_found',
          message: 'Webhook not found'
        }
      });
    }
    
    webhooksDb.delete.run(webhookId);
    
    logActivity(req.agent.uid, 'webhook_deleted', { webhookId });
    
    res.json({
      success: true,
      message: 'Webhook deleted'
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to delete webhook'
      }
    });
  }
});

module.exports = router;
