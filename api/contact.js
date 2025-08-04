// Simple contact form handler
async function contactHandler(req, res) {
  const { firstName, lastName, email, company, industry, message } = req.body;
  
  // Basic validation
  if (!firstName || !lastName || !email || !company || !message) {
    return res.status(400).json({ 
      error: 'Please fill in all required fields' 
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address' 
    });
  }

  try {
    // In production, you would save to database here
    console.log('Contact form submission:', {
      firstName,
      lastName, 
      email,
      company,
      industry,
      message,
      submittedAt: new Date().toISOString()
    });

    res.json({
      message: 'Thank you for your inquiry! We will contact you within 24 hours.',
      success: true
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Unable to process your request. Please try again.' 
    });
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    try {
      await contactHandler(req, res);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}