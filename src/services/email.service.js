/**
 * Email Service
 * Handles sending transactional emails using Nodemailer
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter with SMTP configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Verify transporter connection on startup
 */
transporter.verify(error => {
  if (error) {
    logger.error('❌ Email service verification failed:', error);
  } else {
    logger.info('✅ Email service is ready to send messages');
  }
});

/**
 * Send email with subject and HTML content
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @returns {Promise} - Resolves with send information or rejects with error
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    // Validate input
    if (!to || !subject || !html) {
      throw new Error('Missing required email parameters: to, subject, html');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'StellarAid'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`📧 Email sent successfully to ${to}`, {
      messageId: info.messageId,
    });
    return info;
  } catch (error) {
    logger.error(`❌ Error sending email to ${to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendEmail, transporter };
