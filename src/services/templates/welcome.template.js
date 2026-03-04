/**
 * Welcome Email Template
 * Sends a welcome message to new users after successful registration
 */

const welcomeTemplate = userName => {
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
          background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .emoji {
          font-size: 40px;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          margin-bottom: 20px;
          color: #333;
          font-weight: 600;
        }
        .message {
          font-size: 16px;
          color: #666;
          margin-bottom: 25px;
          line-height: 1.8;
        }
        .features {
          background-color: #f8f9fa;
          padding: 25px;
          border-radius: 6px;
          margin: 30px 0;
        }
        .features h3 {
          color: #333;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .feature-list li {
          padding: 10px 0;
          color: #555;
          border-bottom: 1px solid #eee;
        }
        .feature-list li:last-child {
          border-bottom: none;
        }
        .feature-list li:before {
          content: "✓ ";
          color: #84fab0;
          font-weight: bold;
          margin-right: 10px;
          font-size: 18px;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
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
          box-shadow: 0 4px 12px rgba(132, 250, 176, 0.4);
        }
        .social-links {
          text-align: center;
          padding: 20px 0;
          margin-top: 30px;
          border-top: 1px solid #eee;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">🎉</div>
          <h1>Welcome to StellarAid!</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Welcome, ${userName}!</div>
          
          <div class="message">
            We're thrilled to have you join our community! StellarAid is a blockchain-enabled 
            crowdfunding platform dedicated to supporting transparent, secure, and efficient 
            fundraising for social impact initiatives.
          </div>
          
          <div class="features">
            <h3>What You Can Do Now:</h3>
            <ul class="feature-list">
              <li>Create and manage fundraising campaigns</li>
              <li>Support causes you care about with secure transactions</li>
              <li>Track your contributions on the blockchain</li>
              <li>Connect with a community of changemakers</li>
              <li>Receive transparent updates on funded projects</li>
              <li>Earn recognition for your impact</li>
            </ul>
          </div>
          
          <div class="message">
            Your account is now active and ready to explore. Whether you're looking to launch 
            a campaign or support existing initiatives, you'll find everything you need in your dashboard.
          </div>
          
          <div class="button-container">
            <a href="https://app.stellaraid.io/dashboard" class="button">Go to Dashboard</a>
          </div>
          
          <div class="message" style="background-color: #f0f8ff; padding: 15px; border-radius: 6px; font-size: 14px;">
            <strong>Getting Started Tips:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Complete your profile to increase trust</li>
              <li>Verify your email to unlock all features</li>
              <li>Check out our tutorials and guides</li>
              <li>Join our community forum for discussions</li>
            </ul>
          </div>
          
          <div class="social-links">
            <a href="https://twitter.com/stellaraid">Follow Us</a> | 
            <a href="https://discord.gg/stellaraid">Join Discord</a> | 
            <a href="https://help.stellaraid.io">Help Center</a>
          </div>
          
          <div class="message" style="margin-top: 30px; color: #999; font-size: 14px;">
            If you have any questions or need assistance, don't hesitate to reach out to our support team. 
            We're here to help you make an impact!
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 StellarAid. All rights reserved.</p>
          <p>This is an automated email. Please do not reply directly.</p>
          <p>For support, visit our help center or contact us directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = welcomeTemplate;
