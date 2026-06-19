/**
 * KYC Decision Template
 * Notifies a user about the outcome of their KYC review (approved or rejected)
 */

const kycDecisionTemplate = (userName, status, reviewNote = null) => {
  const isApproved = status === 'approved';

  const accent = isApproved
    ? 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  const emoji = isApproved ? '✅' : '⚠️';
  const heading = isApproved ? 'KYC Approved' : 'KYC Update';
  const message = isApproved
    ? `Great news! Your identity verification (KYC) has been approved. You now have full access to all StellarAid features.`
    : `Thank you for submitting your identity verification (KYC). After review, we were unable to approve your submission at this time.`;

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
          background: ${accent};
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
        .note {
          background-color: #f8f9fa;
          border-left: 4px solid ${isApproved ? '#84fab0' : '#f5576c'};
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
          font-size: 15px;
          color: #555;
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
          <div class="emoji">${emoji}</div>
          <h1>${heading}</h1>
        </div>

        <div class="content">
          <div class="greeting">Hi ${userName},</div>

          <div class="message">${message}</div>

          ${
            reviewNote
              ? `<div class="note"><strong>Reviewer note:</strong><br>${reviewNote}</div>`
              : ''
          }

          ${
            isApproved
              ? ''
              : `<div class="message" style="font-size: 14px; color: #999;">
                  You may update your details and resubmit, or contact our support team if you believe this was a mistake.
                </div>`
          }
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

module.exports = kycDecisionTemplate;
