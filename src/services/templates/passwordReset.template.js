/**
 * Password Reset Template
 * Sends a password reset link to help users recover their account
 */

const passwordResetTemplate = (
  userName,
  resetLink,
  expiryTime = '24 hours'
) => {
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
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 30px 0;
          border-radius: 4px;
          color: #856404;
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
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
          box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
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
          color: #f5576c;
          word-break: break-all;
        }
        .instructions {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          font-size: 14px;
          color: #555;
        }
        .instructions ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        .instructions li {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${userName},</div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> We received a request to reset your password. 
            If you didn't make this request, please ignore this email.
          </div>
          
          <div class="message">
            Click the button below to reset your password. This link will expire in ${expiryTime}.
          </div>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <div class="instructions">
            <strong>Or follow these steps:</strong>
            <ol>
              <li>Copy the link below</li>
              <li>Open it in your web browser</li>
              <li>Enter your new password</li>
              <li>Confirm and save your changes</li>
            </ol>
          </div>
          
          <div class="message" style="margin-top: 30px; font-size: 14px; color: #999;">
            <strong>Reset Link:</strong>
            <br>
            <span class="link-text">${resetLink}</span>
          </div>
          
          <div class="message" style="margin-top: 30px; color: #999; font-size: 14px;">
            <strong>Security Tips:</strong>
            <ul>
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>This link expires in ${expiryTime} for your security</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 StellarAid. All rights reserved.</p>
          <p>This is an automated email. Please do not reply directly.</p>
          <p>If you need help, contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = passwordResetTemplate;
