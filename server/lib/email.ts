import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

export async function sendContactEmail(contactData: {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  industry?: string | null;
  message: string;
}) {
  try {
    const emailHTML = `
      <h2>New Contact Form Submission - iLove AI</h2>
      <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Company:</strong> ${contactData.company}</p>
      <p><strong>Industry:</strong> ${contactData.industry || 'Not specified'}</p>
      <p><strong>Message:</strong></p>
      <p>${contactData.message}</p>
    `;

    // Send notification to business
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@ilove-ai.co.za',
      to: process.env.CONTACT_EMAIL || 'hello@ilove-ai.co.za',
      subject: `New Contact Form Submission from ${contactData.company}`,
      html: emailHTML,
    });

    // Send confirmation to customer
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@ilove-ai.co.za',
      to: contactData.email,
      subject: 'Thank you for contacting iLove AI',
      html: `
        <h2>Thank you for your interest in iLove AI!</h2>
        <p>Dear ${contactData.firstName},</p>
        <p>We've received your inquiry and our team will get back to you within 24 hours.</p>
        <p>In the meantime, feel free to explore our case studies and learn more about how we've helped businesses worldwide transform with AI.</p>
        <p>Best regards,<br>The iLove AI Team</p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email notification');
  }
}
