// Protected function that requires specific scopes
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided or invalid format');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    return jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default-secret-for-development-only'
    );
  } catch (error) {
    throw new Error('Invalid token: ' + error.message);
  }
};

// Middleware to check if user has required scope
const hasScope = (user, requiredScope) => {
  if (!user || !user.scopes || !Array.isArray(user.scopes)) {
    return false;
  }
  
  return user.scopes.includes(requiredScope);
};

exports.handler = async (event, context) => {
  try {
    // Get authorization header
    const authHeader = event.headers.authorization;
    
    // Verify token
    const user = verifyToken(authHeader);
    
    // Check if user has the required scope
    const requiredScope = 'read:trades';
    if (!hasScope(user, requiredScope)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Forbidden',
          message: `Missing required scope: ${requiredScope}`
        })
      };
    }
    
    // If authorized, return protected data
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'You have access to the protected resource!',
        trades: [
          { id: 1, symbol: 'SOL/USDC', amount: 10.5, price: 150.25, timestamp: new Date().toISOString() },
          { id: 2, symbol: 'SOL/USDT', amount: 5.2, price: 149.75, timestamp: new Date().toISOString() }
        ],
        user: {
          sub: user.sub,
          scopes: user.scopes
        }
      })
    };
  } catch (error) {
    console.error('Protected resource error:', error);
    
    if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
