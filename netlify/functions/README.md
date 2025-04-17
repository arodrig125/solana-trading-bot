# SolarBot Netlify Functions

This directory contains serverless functions for the SolarBot application.

## Available Functions

### 1. hello-world.js
A simple function that returns a greeting message.

**Endpoint:** `/.netlify/functions/hello-world`  
**Method:** GET  
**Response:** `{ "message": "Hello from SolarBot!" }`

### 2. auth.js
Authentication function that generates a JWT token with scopes.

**Endpoint:** `/.netlify/functions/auth`  
**Method:** POST  
**Request Body:**
```json
{
  "username": "demo",
  "password": "password",
  "requestedScopes": ["read:user", "read:trades"]
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scopes": ["read:user", "read:trades"],
  "user": {
    "username": "demo",
    "role": "user"
  }
}
```

### 3. protected-resource.js
A protected function that requires the "read:trades" scope.

**Endpoint:** `/.netlify/functions/protected-resource`  
**Method:** GET  
**Headers:** `Authorization: Bearer <token>`  
**Response:**
```json
{
  "message": "You have access to the protected resource!",
  "trades": [
    { "id": 1, "symbol": "SOL/USDC", "amount": 10.5, "price": 150.25, "timestamp": "..." },
    { "id": 2, "symbol": "SOL/USDT", "amount": 5.2, "price": 149.75, "timestamp": "..." }
  ],
  "user": {
    "sub": "demo",
    "scopes": ["read:user", "read:trades"]
  }
}
```

## Available Scopes

- `read:user` - Read user profile information
- `write:user` - Update user profile information
- `read:trades` - View trading history
- `write:trades` - Execute trades
- `read:wallet` - View wallet balances
- `write:wallet` - Transfer funds

## Testing the Functions

You can test these functions using curl or Postman:

```bash
# Get hello world message
curl https://your-site.netlify.app/.netlify/functions/hello-world

# Authenticate and get token
curl -X POST https://your-site.netlify.app/.netlify/functions/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"password","requestedScopes":["read:trades"]}'

# Access protected resource
curl https://your-site.netlify.app/.netlify/functions/protected-resource \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
