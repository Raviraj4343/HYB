import ApiError from "../utils/ApiError.js";

/**
 * Admin-only access middleware
 * Assumes req.user is populated by verifyJWT
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Unauthorized"));
  }

  if (!["admin", "super_admin"].includes(req.user.role)) {
    return next(new ApiError(403, "Admin access only"));
  }

  next();
};

const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Unauthorized"));
  }

  if (req.user.role !== "super_admin") {
    return next(new ApiError(403, "Super admin access only"));
  }

  next();
};

export { isAdmin, isSuperAdmin };
