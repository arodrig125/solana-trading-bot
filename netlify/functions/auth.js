// Authentication function with scopes
const jwt = require('jsonwebtoken');

// Define available scopes
const AVAILABLE_SCOPES = [
  'read:user',
  'write:user',
  'read:trades',
  'write:trades',
  'read:wallet',
  'write:wallet'
];

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    const { username, password, requestedScopes = [] } = JSON.parse(event.body || '{}');
    
    // Validate required parameters
    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          message: 'Username and password are required'
        })
      };
    }
    
    // Validate scopes parameter
    if (!Array.isArray(requestedScopes)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid scopes parameter',
          message: 'Scopes must be an array of strings'
        })
      };
    }
    
    // Filter to only include valid scopes
    const validScopes = requestedScopes.filter(scope => 
      AVAILABLE_SCOPES.includes(scope)
    );
    
    // If no valid scopes were requested, use default read scopes
    const scopes = validScopes.length > 0 
      ? validScopes 
      : ['read:user', 'read:trades', 'read:wallet'];
    
    // In a real app, you would validate credentials against a database
    // This is just a simplified example
    if (username === 'demo' && password === 'password') {
      // Generate JWT token with scopes
      const token = jwt.sign(
        { 
          sub: username,
          scopes: scopes
        },
        process.env.JWT_SECRET || 'default-secret-for-development-only',
        { expiresIn: '1h' }
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          token,
          scopes,
          user: {
            username,
            role: 'user'
          }
        })
      };
    }
    
    // Invalid credentials
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials' })
    };
  } catch (error) {
    console.error('Auth error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
