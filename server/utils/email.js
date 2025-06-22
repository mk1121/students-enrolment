const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// OAuth2 configuration
const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client
const createOAuth2Client = () => {
  return new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URL
  );
};

// Get OAuth2 access token
const getAccessToken = async (oauth2Client) => {
  try {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const { token } = await oauth2Client.getAccessToken();
    return token;
  } catch (error) {
    console.error('Error getting OAuth2 access token:', error);
    throw error;
  }
};

// Create transporter with OAuth2
const createTransporter = async () => {
  try {
    // Check if OAuth2 credentials are configured
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN || !process.env.EMAIL_USER) {
      console.log('Gmail OAuth2 credentials not configured. Email functionality will be disabled.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating OAuth2 transporter:', error);
    return null;
  }
};

// Fallback transporter for development/testing
const createFallbackTransporter = () => {
  // For development/testing, use a test account or mock
  if (process.env.NODE_ENV === 'test') {
    return null; // Return null in test environment to mock emails
  }

  // For development, you can use Ethereal Email for testing
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass'
    }
  });
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    let transporter;
    
    // Try to create OAuth2 transporter first
    transporter = await createTransporter();
  
    // If OAuth2 fails, use fallback for development
    if (!transporter) {
      if (process.env.NODE_ENV === 'test') {
        console.log(`[TEST] Email would be sent to ${to}: ${subject}`);
        return { messageId: 'mock-message-id-oauth2' };
      }
      
      console.log('OAuth2 transporter failed, using fallback for development');
       transporter = createFallbackTransporter();
      
      if (!transporter) {
        console.log(`Email service unavailable. Would send to ${to}: ${subject}`);
        return { messageId: 'mock-message-id' };
      }
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@studentsenrollment.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't throw error to prevent application crash
    return { error: error.message };
  }
};

// Verify transporter configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = await createTransporter();
    if (!transporter) {
      return { success: false, message: 'Email transporter not configured' };
    }
    await transporter.verify();
    return { success: true, message: 'Email configuration verified successfully' };
  } catch (error) {
    if (error.message && /BadCredentials|Invalid login|Username and Password not accepted/i.test(error.message)) {
      return {
        success: false,
        message: 'BadCredentials – your Gmail refresh token is invalid, expired, or revoked. Please generate a new one using the OAuth Playground as described in docs/GMAIL_OAUTH_SETUP.md.'
      };
    }
    return { success: false, message: `Email configuration error: ${error.message}` };
  }
};

// Log email configuration on startup (using IIFE)
(async () => {
  const result = await verifyEmailConfig();
})();

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to Students Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin: 0;">Students Enrollment System</h1>
        </div>
        <h2 style="color: #007bff;">Welcome ${userName}!</h2>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">You can now:</h3>
          <ul style="color: #495057;">
            <li>Browse our comprehensive course catalog</li>
            <li>Enroll in courses that interest you</li>
            <li>Track your learning progress</li>
            <li>Access course materials and resources</li>
            <li>Connect with instructors and fellow students</li>
          </ul>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d;">Best regards,<br>The Students Enrollment Team</p>
        </div>
      </div>
    `
  }),

  courseEnrollment: (userName, courseTitle, coursePrice) => ({
    subject: 'Course Enrollment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">✓ Enrollment Confirmed!</h1>
        </div>
        <p>Hi ${userName},</p>
        <p>Your enrollment in <strong>${courseTitle}</strong> has been confirmed.</p>
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Course Details:</h3>
          <p style="margin: 5px 0; color: #155724;"><strong>Course:</strong> ${courseTitle}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Price:</strong> $${coursePrice}</p>
        </div>
        <p>You can now access your course materials and start learning! Log in to your account to begin.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d;">Best regards,<br>The Students Enrollment Team</p>
        </div>
      </div>
    `
  }),

  paymentConfirmation: (userName, courseTitle, amount, transactionId) => ({
    subject: 'Payment Confirmation - Students Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">💳 Payment Successful!</h1>
        </div>
        <p>Hi ${userName},</p>
        <p>Your payment has been processed successfully.</p>
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Payment Details:</h3>
          <p style="margin: 5px 0; color: #155724;"><strong>Course:</strong> ${courseTitle}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Amount:</strong> $${amount}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Transaction ID:</strong> ${transactionId}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Thank you for your purchase! You now have full access to the course.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d;">Best regards,<br>The Students Enrollment Team</p>
        </div>
      </div>
    `
  }),

  courseCompletion: (userName, courseTitle) => ({
    subject: 'Course Completion Certificate - Congratulations!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffc107; margin: 0;">🎉 Congratulations!</h1>
        </div>
        <p>Hi ${userName},</p>
        <p>You have successfully completed <strong>${courseTitle}</strong>!</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Achievement Unlocked:</h3>
          <p style="margin: 5px 0; color: #856404;">✓ Course completed successfully</p>
          <p style="margin: 5px 0; color: #856404;">✓ Certificate available for download</p>
          <p style="margin: 5px 0; color: #856404;">✓ New skills acquired</p>
        </div>
        <p>Your certificate is now available for download in your account dashboard.</p>
        <p>Keep up the great work and continue your learning journey!</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d;">Best regards,<br>The Students Enrollment Team</p>
        </div>
      </div>
    `
  }),

  passwordReset: (userName, resetUrl) => ({
    subject: 'Password Reset Request - Students Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc3545; margin: 0;">🔐 Password Reset Request</h1>
        </div>
        <p>Hi ${userName},</p>
        <p>You requested a password reset for your Students Enrollment System account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;"><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
        </div>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <p><small>For security reasons, this link can only be used once.</small></p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d;">Best regards,<br>The Students Enrollment Team</p>
        </div>
      </div>
    `
  }),

  emailVerification: (userName, verificationUrl) => ({
    subject: 'Verify Your Email Address - Students Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin: 0;">📧 Verify Your Email</h1>
        </div>
        <p>Hi ${userName},</p>
        <p>Thank you for registering with Students Enrollment System! To complete your registration, please verify your email address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; margin: 20px 0;">
          <p style="margin: 0; color: #0c5460;"><strong>Note:</strong> This verification link will expire in 24 hours.</p>
        </div>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <p>Once verified, you'll be able to:</p>
        <ul>
          <li>Access all course features</li>
          <li>Enroll in courses</li>
          <li>Receive important updates</li>
        </ul>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d;">Best regards,<br>The Students Enrollment Team</p>
        </div>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates,
  verifyEmailConfig
}; 