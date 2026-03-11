const { getSupportedChains, getSupportedTokens } = require('../services/kirapay');

const router = require('express').Router();

// Get all supported chains
router.get('/', async (req, res) => {
  try {
    const chains = await getSupportedChains();
    res.json({
      success: true,
      chains
    });
  } catch (error) {
    console.error('Get chains error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'server_error', message: 'Failed to get chains' }
    });
  }
});

// Get tokens for a specific chain
router.get('/tokens/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;
    const tokens = await getSupportedTokens(chainId);
    res.json({
      success: true,
      chainId,
      tokens
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'server_error', message: 'Failed to get tokens' }
    });
  }
});

module.exports = router;
