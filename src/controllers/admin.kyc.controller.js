const User = require('../models/User.model');
const { sendSuccess } = require('../utils/response');
const { sendEmail } = require('../services/email.service');
const kycDecisionTemplate = require('../services/templates/kycDecision.template');

/**
 * Review a user's KYC submission (admin only)
 * Updates the user's kycStatus and notifies them of the decision by email.
 * @route PATCH /api/admin/kyc/:id
 * @access Admin only
 */
const reviewKyc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    const user = await User.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.isOperational = true;
      return next(error);
    }

    // Apply the review decision
    user.kycStatus = status;
    if (reviewNote !== undefined) {
      user.kycReviewNotes = reviewNote;
    }
    await user.save();

    // Notify the user of the decision (non-blocking — review still succeeds if email fails)
    try {
      await sendEmail({
        to: user.email,
        subject: `Your KYC submission has been ${status}`,
        html: kycDecisionTemplate(user.fullName, status, user.kycReviewNotes),
      });
    } catch (emailError) {
      console.error('Failed to send KYC decision email:', emailError.message);
    }

    return sendSuccess(
      res,
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        kycStatus: user.kycStatus,
        kycReviewNotes: user.kycReviewNotes || null,
      },
      200,
      `KYC submission ${status} successfully`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  reviewKyc,
};
