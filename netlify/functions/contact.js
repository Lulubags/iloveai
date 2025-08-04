const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { contacts } = require('../../shared/schema');
const ws = require('ws');

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

// Database setup
let db;
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool);
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { firstName, lastName, email, company, industry, message } = JSON.parse(event.body);
    
    // Basic validation
    if (!firstName || !lastName || !email || !company || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Please fill in all required fields' 
        }),
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Please enter a valid email address' 
        }),
      };
    }

    // Save contact to database
    if (db) {
      try {
        await db.insert(contacts).values({
          firstName,
          lastName,
          email,
          company,
          industry,
          message
        });
        console.log('Contact saved to database successfully');
      } catch (dbError) {
        console.error('Failed to save contact to database:', dbError);
        // Continue with success response even if database fails
      }
    }

    // Log the contact form submission
    console.log('Contact form submission:', {
      firstName,
      lastName, 
      email,
      company,
      industry,
      message,
      submittedAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Thank you for your inquiry! We will contact you within 24 hours.',
        success: true
      }),
    };
  } catch (error) {
    console.error('Contact form error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Unable to process your request. Please try again.' 
      }),
    };
  }
};