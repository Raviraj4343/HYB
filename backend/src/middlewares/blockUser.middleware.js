import {User} from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";

const releaseExpiredBlockIfNeeded = async (user) => {
  if (
    user?.isBlocked &&
    user?.blockedUntil &&
    user.blockedUntil.getTime() <= Date.now()
  ) {
    user.isBlocked = false;
    user.blockedAt = null;
    user.blockedUntil = null;
    user.blockReason = null;
    user.blockedBy = null;
    await user.save({ validateBeforeSave: false });
  }
};


/**
 * Middleware to check if user is blocked
 * Use this on routes that should be restricted for blocked users
 */
const checkBlockedUser = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return next(new ApiError(401, 'Unauthorized: User not authenticated'));
    }

    const user = await User.findById(userId).select('isBlocked warningCount blockedUntil blockReason blockedBy blockedAt');
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    await releaseExpiredBlockIfNeeded(user);

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: user.blockedUntil
          ? `Your account is blocked until ${user.blockedUntil.toISOString()}`
          : 'Your account has been temporarily blocked. You cannot perform this action.',
        isBlocked: true,
        warningCount: user.warningCount,
        blockedUntil: user.blockedUntil,
        blockReason: user.blockReason
      });
    }

    // User is not blocked, proceed to next middleware
    next();

  } catch (error) {
    console.error('[BlockUser Middleware] Error:', error);
    return next(new ApiError(500, 'Error checking user block status'));
  }
};

/**
 * Middleware that only warns but doesn't block
 * Useful for routes where you want to show a warning but still allow access
 */
const warnBlockedUser = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return next();
    }

    const user = await User.findById(userId).select('isBlocked warningCount blockedUntil blockReason blockedBy blockedAt');

    await releaseExpiredBlockIfNeeded(user);
    
    if (user?.isBlocked) {
      // Attach blocked status to request for controllers to use
      req.userBlocked = true;
      req.userWarningCount = user.warningCount;
    }

    next();

  } catch (error) {
    console.error('[BlockUser Middleware] Warning check error:', error);
    next(); // Continue even on error for non-critical routes
  }
};

/**
 * Helper function to check if user is blocked (for use in controllers)
 * @param {string} userId - The user's ID
 * @returns {Promise<{isBlocked: boolean, warningCount: number}>}
 */
const isUserBlocked = async (userId) => {
  try {
    const user = await User.findById(userId).select('isBlocked warningCount blockedUntil blockReason blockedBy blockedAt');
    
    if (!user) {
      return { isBlocked: false, warningCount: 0 };
    }

    await releaseExpiredBlockIfNeeded(user);

    return {
      isBlocked: user.isBlocked || false,
      warningCount: user.warningCount || 0,
      blockedUntil: user.blockedUntil || null,
      blockReason: user.blockReason || null
    };

  } catch (error) {
    console.error('[BlockUser Helper] Error:', error);
    return { isBlocked: false, warningCount: 0 };
  }
};

export{
  checkBlockedUser,
  warnBlockedUser,
  isUserBlocked
};
