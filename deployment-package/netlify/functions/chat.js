const OpenAI = require('openai');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { chatSessions } = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const ws = require('ws');

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Database setup
let db;
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool);
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured in environment variables' 
        }),
      };
    }

    const { message, sessionId } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    console.log('Processing chat message:', { message: message.substring(0, 50) + '...', sessionId });

    // Get existing conversation history if sessionId exists
    let conversationHistory = [
      {
        role: "system",
        content: `You are an AI consultant for iLove AI, a South African AI solutions company. 
        Help businesses understand how AI can transform their operations. Be professional, 
        knowledgeable, and focus on practical AI applications for business growth.`
      }
    ];

    let currentSessionId = sessionId || `session_${Date.now()}`;
    
    if (db && sessionId) {
      try {
        const [existingSession] = await db
          .select()
          .from(chatSessions)
          .where(eq(chatSessions.sessionId, sessionId));
        
        if (existingSession && existingSession.messages) {
          conversationHistory = [
            conversationHistory[0], // Keep system message
            ...existingSession.messages
          ];
        }
      } catch (dbError) {
        console.warn('Database query failed, continuing without history:', dbError);
      }
    }

    // Add current user message
    conversationHistory.push({
      role: "user",
      content: message
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversationHistory,
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Save conversation to database if available
    if (db) {
      try {
        const updatedMessages = [
          ...conversationHistory.slice(1), // Remove system message for storage
          {
            role: "assistant",
            content: response,
            timestamp: new Date().toISOString()
          }
        ];

        // Check if session exists, update or insert
        const [existingSession] = await db
          .select()
          .from(chatSessions)
          .where(eq(chatSessions.sessionId, currentSessionId));

        if (existingSession) {
          await db
            .update(chatSessions)
            .set({
              messages: updatedMessages,
              updatedAt: new Date()
            })
            .where(eq(chatSessions.sessionId, currentSessionId));
        } else {
          await db
            .insert(chatSessions)
            .values({
              sessionId: currentSessionId,
              messages: updatedMessages
            });
        }
      } catch (dbError) {
        console.warn('Failed to save conversation:', dbError);
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        response: response,
        message: response,
        sessionId: currentSessionId
      }),
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Check if it's an API key issue
    if (error.status === 401 || error.code === 'invalid_api_key') {
      console.error('OpenAI API key authentication failed');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Invalid OpenAI API key. Please check your API key in Netlify environment variables.' 
        }),
      };
    }

    // Log the full error for debugging
    console.error('OpenAI API Error Details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'AI service temporarily unavailable. Please try again.' 
      }),
    };
  }
};