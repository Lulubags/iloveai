import { Handler } from '@netlify/functions';

// Import your API handlers
import { registerRoutes } from '../../server/routes.js';

export const handler: Handler = async (event, context) => {
  const { httpMethod, path: requestPath, body, headers } = event;
  
  // Simple routing for API endpoints
  if (requestPath.startsWith('/api/chat')) {
    // Handle chat API
    if (httpMethod === 'POST') {
      try {
        const requestBody = JSON.parse(body || '{}');
        // Your chat logic here
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ message: 'Chat endpoint working' }),
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Server error' }),
        };
      }
    }
  }
  
  if (requestPath.startsWith('/api/contact')) {
    // Handle contact API
    if (httpMethod === 'POST') {
      try {
        const requestBody = JSON.parse(body || '{}');
        // Your contact logic here
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ message: 'Contact form submitted' }),
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Server error' }),
        };
      }
    }
  }
  
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not found' }),
  };
};