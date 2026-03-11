const axios = require('axios');

const KIRAPAY_API_KEY = process.env.KIRAPAY_API_KEY;
const KIRAPAY_BASE_URL = process.env.KIRAPAY_BASE_URL || 'https://api.kira-pay.com';

// Supported chains
const SUPPORTED_CHAINS = [
  { id: '1', name: 'Ethereum', symbol: 'ETH', type: 'EVM' },
  { id: '137', name: 'Polygon', symbol: 'MATIC', type: 'EVM' },
  { id: '8453', name: 'Base', symbol: 'ETH', type: 'EVM' },
  { id: '56', name: 'BNB Chain', symbol: 'BNB', type: 'EVM' },
  { id: '43114', name: 'Avalanche', symbol: 'AVAX', type: 'EVM' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', type: 'SOL' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', type: 'BTC' }
];

// Stub mode
const STUB_MODE = !KIRAPAY_API_KEY || KIRAPAY_API_KEY.startsWith('your_');

console.log(`📦 KIRAPAY Service: ${STUB_MODE ? 'STUB MODE' : 'LIVE MODE'}`);

// Get supported chains
async function getSupportedChains() {
  return SUPPORTED_CHAINS;
}

// Get supported tokens for a chain
async function getSupportedTokens(chainId) {
  if (STUB_MODE) {
    // Return mock tokens
    const mockTokens = {
      '1': [ // Ethereum
        { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USD Coin', symbol: 'USDC' },
        { chainId: 1, address: '0x6B175474E89094C44Da98b954EesadcdEF9ce6CC', name: 'Dai Stablecoin', symbol: 'DAI' }
      ],
      '137': [ // Polygon
        { chainId: 137, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', name: 'USD Coin', symbol: 'USDC' }
      ],
      '8453': [ // Base
        { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', name: 'USD Coin', symbol: 'USDC' },
        { chainId: 8453, address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', name: 'Dai Stablecoin', symbol: 'DAI' }
      ],
      'sol': [ // Solana
        { chainId: 'sol', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'USD Coin', symbol: 'USDC' }
      ],
      'btc': [ // Bitcoin
        { chainId: 'btc', address: 'native', name: 'Bitcoin', symbol: 'BTC' }
      ]
    };
    return mockTokens[chainId] || [];
  }
  
  try {
    const response = await axios.get(`${KIRAPAY_BASE_URL}/api/link/tokens/${chainId}`);
    return response.data?.data || [];
  } catch (error) {
    console.error('KIRAPAY Tokens Error:', error.response?.data || error.message);
    return [];
  }
}

// Generate mock payment ID
function generateMockPaymentId() {
  return 'klp_' + Math.random().toString(36).substring(2, 15);
}

// Create payment link
async function createPaymentLink(params) {
  const { amount, currency, description, reference, receiver, tokenOut } = params;
  
  if (STUB_MODE) {
    console.log('🔧 [STUB] Creating payment link:', params);
    return {
      id: generateMockPaymentId(),
      link: `https://checkout.kira-pay.com/${Math.random().toString(36).substring(2, 10)}`,
      amount,
      currency: currency || 'USD',
      status: 'pending',
      description,
      reference
    };
  }
  
  try {
    // Build tokenOut from params or use defaults
    const tokenConfig = tokenOut || {
      chainId: "8453",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base
    };
    
    const response = await axios.post(
      `${KIRAPAY_BASE_URL}/api/link/generate`,
      {
        tokenOut: tokenConfig,
        receiver: receiver,
        price: amount,
        name: description,
        customOrderId: reference,
        type: "single_use"
      },
      {
        headers: {
          'x-api-key': KIRAPAY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      id: response.data?.data?.id || generateMockPaymentId(),
      link: response.data?.data?.url,
      amount,
      currency: currency || 'USD',
      status: 'pending',
      description,
      reference
    };
  } catch (error) {
    console.error('KIRAPAY API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'KIRAPAY API error');
  }
}

// Get payment status
async function getPaymentStatus(paymentId) {
  if (STUB_MODE) {
    return {
      id: paymentId,
      amount: 1000,
      currency: 'USD',
      status: 'pending'
    };
  }
  
  try {
    const response = await axios.get(
      `${KIRAPAY_BASE_URL}/api/link/${paymentId}`,
      {
        headers: { 'x-api-key': KIRAPAY_API_KEY }
      }
    );
    return response.data;
  } catch (error) {
    console.error('KIRAPAY API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'KIRAPAY API error');
  }
}

// Cancel payment (not supported by KIRAPAY)
async function cancelPayment(paymentId) {
  throw new Error('Payment cancellation not supported - links are single-use');
}

module.exports = {
  getSupportedChains,
  getSupportedTokens,
  createPaymentLink,
  getPaymentStatus,
  cancelPayment
};
