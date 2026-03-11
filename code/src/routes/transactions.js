const { transactions } = require('../config/database');

const router = require('express').Router();

// List all transactions (with optional filter)
router.get('/', (req, res) => {
  try {
    const { agent_uid } = req.query;
    
    let results;
    if (agent_uid) {
      results = transactions.findByAgent.all(agent_uid);
    } else {
      results = transactions.findAll.all();
    }
    
    res.json({
      success: true,
      transactions: results.map(t => ({
        id: t.id,
        agent_uid: t.agent_uid,
        kirapay_payment_id: t.kirapay_payment_id,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        description: t.description,
        reference: t.reference,
        created_at: t.created_at,
        updated_at: t.updated_at
      }))
    });
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to list transactions'
      }
    });
  }
});

// Get transaction by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transaction = transactions.findById.get(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'not_found',
          message: 'Transaction not found'
        }
      });
    }
    
    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        agent_uid: transaction.agent_uid,
        kirapay_payment_id: transaction.kirapay_payment_id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        reference: transaction.reference,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to get transaction'
      }
    });
  }
});

module.exports = router;
