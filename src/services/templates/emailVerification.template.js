/**
 * Email Verification Template
 * Sends a verification link to confirm user email address
 */

const emailVerificationTemplate = (userName, verificationLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }
        .message {
          font-size: 16px;
          color: #666;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff !important;
          padding: 14px 40px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s ease;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .footer {
          background-color: #f9f9f9;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
        }
        .footer p {
          margin: 5px 0;
        }
        .link-text {
          color: #667eea;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${userName},</div>
          
          <div class="message">
            Welcome to StellarAid! We're excited to have you on board. 
            To get started, please verify your email address by clicking the button below.
            This link will expire in 24 hours.
          </div>
          
          <div class="button-container">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </div>
          
          <div class="message" style="margin-top: 30px; font-size: 14px; color: #999;">
            If the button above doesn't work, copy and paste this link in your browser:
            <br>
            <span class="link-text">${verificationLink}</span>
          </div>
          
          <div class="message" style="margin-top: 30px; color: #999; font-size: 14px;">
            If you didn't create an account, please disregard this email.
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 StellarAid. All rights reserved.</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = emailVerificationTemplate;
