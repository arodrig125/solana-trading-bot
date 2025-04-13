# Solana Trading Bot API Documentation

## Overview

This API allows users to interact with the Solana Trading Bot programmatically. It provides endpoints for managing wallets, finding arbitrage opportunities, and executing trades.

## Authentication

All API requests (except /health) require authentication using JWT tokens. To authenticate, include the following header in your requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Rate Limits

The API implements rate limiting based on the user's tier:
- Basic tier: 20 requests per minute
- Pro tier: 50 requests per minute
- Enterprise tier: 200 requests per minute

## Endpoints

### Health Check
`GET /api/health`

Checks if the API is running. This endpoint does not require authentication.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-04-13T12:51:04Z"
}
```

### Generate API Key
`POST /api/generate-key`

Generates a new API key and JWT token. In production, this endpoint should be secured by admin authentication.

**Request Body:**
```json
{
  "userId": "user123",
  "tier": "pro",
  "name": "Trading Bot Access"
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "30 days"
}
```

### Initialize Wallets
`POST /api/wallets`

Initializes user wallets for trading.

**Request Body:**
```json
{
  "privateKeys": ["PRIVATE_KEY_1", "PRIVATE_KEY_2"]
}
```

**Response:**
```json
{
  "success": true,
  "walletCount": 2,
  "walletAddresses": ["Address1", "Address2"]
}
```

### Get Wallet Information
`GET /api/wallets`

Returns information about the user's wallets, including balances and status.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 2,
    "ready": 2,
    "lowBalance": 0,
    "wallets": [
      {
        "address": "Address1",
        "status": "Ready",
        "solBalance": 1.5,
        "transactions": 10
      },
      {
        "address": "Address2",
        "status": "Ready",
        "solBalance": 2.3,
        "transactions": 5
      }
    ]
  }
}
```

### Find Arbitrage Opportunities
`GET /api/opportunities?minProfitPercent=1.0`

Finds arbitrage opportunities with the specified minimum profit percentage.

**Query Parameters:**
- `minProfitPercent` (optional): Minimum profit percentage for returned opportunities

**Response:**
```json
{
  "success": true,
  "count": 2,
  "opportunities": [
    {
      "type": "triangular",
      "path": [
        { "from": "USDC", "to": "SOL", "fromAmount": "1000000" },
        { "from": "SOL", "to": "ETH" },
        { "from": "ETH", "to": "USDC" }
      ],
      "startAmount": "1000000",
      "startToken": "USDC",
      "endToken": "USDC",
      "profitAmount": "50000",
      "profitPercent": 5.0
    },
    {...}
  ]
}
```

### Execute Trade
`POST /api/execute-trade`

Executes a trade based on the provided opportunity.

**Request Body:**
```json
{
  "opportunity": {
    "type": "triangular",
    "path": [
      { "from": "USDC", "to": "SOL", "fromAmount": "1000000" },
      { "from": "SOL", "to": "ETH" },
      { "from": "ETH", "to": "USDC" }
    ],
    "startAmount": "1000000",
    "startToken": "USDC",
    "endToken": "USDC",
    "profitAmount": "50000",
    "profitPercent": 5.0
  },
  "simulationMode": false
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "simulation": false,
    "wallet": "Address1",
    "trades": [
      {
        "step": 1,
        "from": "USDC",
        "to": "SOL",
        "inputAmount": 1.0,
        "outputAmount": 0.04,
        "txId": "transaction_hash_1"
      },
      {...}
    ],
    "finalAmount": 1.05,
    "timestamp": "2025-04-13T12:51:04Z"
  }
}
```

### Get Available Tokens
`GET /api/tokens`

Returns a list of all available tokens.

**Response:**
```json
{
  "success": true,
  "tokens": [
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "decimals": 6,
      "category": "stablecoin"
    },
    {...}
  ]
}
```

### Get Token Pairs
`GET /api/token-pairs`

Returns a list of all available token pairs.

**Response:**
```json
{
  "success": true,
  "pairs": [
    {
      "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "outputMint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      "name": "USDC-USDT",
      "minProfitPercent": 0.1,
      "maxSlippagePercent": 0.1
    },
    {...}
  ]
}
```

## Error Handling

In case of an error, the API will return a JSON response with an error message:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- 200 OK: Request succeeded
- 400 Bad Request: Invalid input data
- 401 Unauthorized: Missing or invalid authentication
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server-side error

## Implementation Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_URL = 'https://your-api-url.com';
const JWT_TOKEN = 'your_jwt_token';

async function findOpportunities() {
  try {
    const response = await axios.get(`${API_URL}/api/opportunities?minProfitPercent=1.0`, {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`
      }
    });
    
    console.log(`Found ${response.data.count} opportunities:`, response.data.opportunities);
    return response.data.opportunities;
  } catch (error) {
    console.error('Error finding opportunities:', error.response?.data || error.message);
    return [];
  }
}
```

### Python
```python
import requests

API_URL = 'https://your-api-url.com'
JWT_TOKEN = 'your_jwt_token'

def find_opportunities():
    try:
        headers = {
            'Authorization': f'Bearer {JWT_TOKEN}'
        }
        response = requests.get(
            f'{API_URL}/api/opportunities?minProfitPercent=1.0',
            headers=headers
        )
        data = response.json()
        
        print(f"Found {data['count']} opportunities:", data['opportunities'])
        return data['opportunities']
    except Exception as e:
        print('Error finding opportunities:', e)
        return []
```
