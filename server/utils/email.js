const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to Students Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Welcome to Students Enrollment System!</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse our course catalog</li>
          <li>Enroll in courses</li>
          <li>Track your learning progress</li>
          <li>Access course materials</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Students Enrollment Team</p>
      </div>
    `
  }),

  courseEnrollment: (userName, courseTitle, coursePrice) => ({
    subject: 'Course Enrollment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Enrollment Confirmed!</h2>
        <p>Hi ${userName},</p>
        <p>Your enrollment in <strong>${courseTitle}</strong> has been confirmed.</p>
        <p><strong>Course Price:</strong> $${coursePrice}</p>
        <p>You can now access your course materials and start learning!</p>
        <p>Best regards,<br>The Students Enrollment Team</p>
      </div>
    `
  }),

  paymentConfirmation: (userName, courseTitle, amount, transactionId) => ({
    subject: 'Payment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Successful!</h2>
        <p>Hi ${userName},</p>
        <p>Your payment has been processed successfully.</p>
        <p><strong>Course:</strong> ${courseTitle}</p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p>Thank you for your purchase!</p>
        <p>Best regards,<br>The Students Enrollment Team</p>
      </div>
    `
  }),

  courseCompletion: (userName, courseTitle) => ({
    subject: 'Course Completion Certificate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Congratulations!</h2>
        <p>Hi ${userName},</p>
        <p>You have successfully completed <strong>${courseTitle}</strong>!</p>
        <p>Your certificate is now available for download.</p>
        <p>Keep up the great work!</p>
        <p>Best regards,<br>The Students Enrollment Team</p>
      </div>
    `
  }),

  passwordReset: (userName, resetUrl) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Students Enrollment Team</p>
      </div>
    `
  }),

  emailVerification: (userName, verificationUrl) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Verify Your Email</h2>
        <p>Hi ${userName},</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The Students Enrollment Team</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
}; 