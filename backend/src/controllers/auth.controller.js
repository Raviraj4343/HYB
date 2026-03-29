import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendMail } from "../utils/mailer.js";
import { buildAuthCodeEmail } from "../utils/mailer.js";
import { USER_ROLE } from "../constants.js";


// helper senetize user
const sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  return userObj;
};

const generateVerificationPayload = () => ({
  code: Math.floor(100000 + Math.random() * 900000).toString(),
  expires: new Date(Date.now() + 15 * 60 * 1000),
});

const createMailDeliveryError = (context) =>
  new ApiError(503, `${context} is unavailable right now. Please try again in a moment.`);

const sendVerificationCodeEmail = async (email, code, fullName = "there") => {
  const subject = "Verify your HYB account";
  const { text, html } = buildAuthCodeEmail({
    title: "Verify your email",
    subtitle: `Hi ${fullName}, enter this code to finish creating your HYB account.`,
    code,
    note: "This verification code expires in 15 minutes.",
  });

  await sendMail({ to: email, subject, text, html });
};

const sendPasswordResetCodeEmail = async (email, code) => {
  const subject = "Your HYB password reset code";
  const { text, html } = buildAuthCodeEmail({
    title: "Reset your password",
    subtitle: "Use this code to reset your HYB password.",
    code,
    note: "This reset code expires in 15 minutes.",
  });

  await sendMail({ to: email, subject, text, html });
};

const clearExpiredBlockIfNeeded = async (user) => {
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

const avatarUploadOptions = {
  folder: "hyb/avatars",
  width: 512,
  height: 512,
  crop: "fill",
  gravity: "face",
  quality: "auto:good",
  fetch_format: "auto",
};


const registerUser = asyncHandler(async (req, res) => {
  if (!req.body) {
  throw new ApiError(400, "Request body is missing");
  }

  const { fullName, userName, email, password, branch, year, hostel } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedUserName = userName?.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { userName: normalizedUserName }]
  });

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      if (existingUser.email === normalizedEmail) {
        throw new ApiError(400, "Email already registered");
      }
      if (existingUser.userName === normalizedUserName) {
        throw new ApiError(400, "Username already taken");
      }
    }
  }

  let avatarUrl = null;

  if (req.file) {
    const uploadedAvatar = await uploadOnCloudinary(req.file.path, avatarUploadOptions);

    if (!uploadedAvatar?.secure_url) {
      throw new ApiError(500, "Avatar upload failed");
    }

    avatarUrl = uploadedAvatar.secure_url;
  }

  const { code, expires } = generateVerificationPayload();
  let user;

  if (existingUser && !existingUser.isEmailVerified) {
    if (existingUser.avatar && avatarUrl) {
      await deleteFromCloudinary(existingUser.avatar);
    }

    existingUser.fullName = fullName;
    existingUser.userName = normalizedUserName;
    existingUser.email = normalizedEmail;
    existingUser.password = password;
    existingUser.branch = branch;
    existingUser.year = year;
    existingUser.hostel = hostel;
    existingUser.avatar = avatarUrl || existingUser.avatar;
    existingUser.emailVerificationCode = code;
    existingUser.emailVerificationExpires = expires;
    existingUser.isEmailVerified = false;

    user = await existingUser.save();
  } else {
    const userCount = await User.countDocuments();
    user = await User.create({
      fullName,
      userName: normalizedUserName,
      email: normalizedEmail,
      password,
      branch,
      year,
      hostel,
      avatar: avatarUrl,
      emailVerificationCode: code,
      emailVerificationExpires: expires,
      role:userCount === 0 ? USER_ROLE.SUPER_ADMIN : USER_ROLE.USER
    });
  }

  let emailSent = true;
  try {
    await sendVerificationCodeEmail(user.email, code, user.fullName);
  } catch (err) {
    emailSent = false;
    console.error("Failed to send registration verification email", err);
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        email: user.email,
        avatar: user.avatar,
        emailSent
      },
      emailSent
        ? "Account created. Verification code sent to your email"
        : "Account created, but we could not send the verification code. Please use resend after fixing email service configuration."
    )
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const code = req.body.code?.trim();

  if (!normalizedEmail || !code) {
    throw new ApiError(400, "Please provide email and verification code");
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationCode +emailVerificationExpires +password +refreshToken"
  );

  if (!user || !user.emailVerificationCode) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  if (
    user.emailVerificationCode !== code ||
    !user.emailVerificationExpires ||
    user.emailVerificationExpires < new Date()
  ) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  user.isEmailVerified = true;
  user.emailVerificationCode = null;
  user.emailVerificationExpires = null;
  user.lastLogin = new Date();

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      },
      "Email verified successfully"
    )
  );
});

const resendVerificationCode = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ApiError(400, "Please provide an email");
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationCode +emailVerificationExpires"
  );

  if (!user) {
    return res.status(200).json(new ApiResponse(200, null, "If that email exists, a verification code was sent"));
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const { code, expires } = generateVerificationPayload();
  user.emailVerificationCode = code;
  user.emailVerificationExpires = expires;

  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationCodeEmail(user.email, code, user.fullName);
  } catch (err) {
    console.error("Failed to resend verification email", err);
    throw createMailDeliveryError("Verification email delivery");
  }

  res.status(200).json(new ApiResponse(200, { email: user.email }, "Verification code sent"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  await clearExpiredBlockIfNeeded(user);

  if (!user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email before signing in",
      data: {
        email: user.email,
      },
    });
  }

  if (user.isBlocked) {
    const untilLabel = user.blockedUntil
      ? new Date(user.blockedUntil).toLocaleString("en-IN", { timeZone: "Asia/Calcutta" })
      : "until an administrator reviews your account";
    const reasonLabel = user.blockReason || "Policy violation";
    throw new ApiError(403, `Your account is blocked for "${reasonLabel}" until ${untilLabel}`);
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account has been deactivated");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();

  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      },
      "Login successful"
    )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } }
  );

  res.status(200).json(
    new ApiResponse(200, null, "Logged out successfully")
  );
});


const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      { user: sanitizeUser(req.user) },
      "User retrieved successfully"
    )
  );
});


const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, branch, year, hostel } = req.body;

  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (branch !== undefined) updates.branch = branch;
  if (year !== undefined) updates.year = year;
  if (hostel !== undefined) updates.hostel = hostel;

  const user = await User.findById(req.user._id);

  if(!user){
    throw new ApiError(400, "user not found");
  }

  if(req.file){
    const uploadedAvatar = await uploadOnCloudinary(req.file.path, avatarUploadOptions);

    if(!uploadedAvatar?.secure_url){
      throw new ApiError(500, "Avatar upload failed");
    }

    if(user.avatar){
      await deleteFromCloudinary(user.avatar);
    }

    updates.avatar = uploadedAvatar.secure_url;
  }


  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json(
    new ApiResponse(
      200,
      { user: sanitizeUser(updatedUser) },
      "Profile updated successfully"
    )
  );
});


const changeUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Please provide current and new password");
  }

  const user = await User.findById(req.user._id).select("+password");

  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  const token = user.generateAccessToken();

  res.status(200).json(
    new ApiResponse(
      200,
      { token },
      "Password changed successfully"
    )
  );
});


// --- Forgot password: send verification code to user's email ---
const forgotPassword = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ApiError(400, 'Please provide an email');
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Do not reveal whether email exists
    return res.status(200).json(new ApiResponse(200, null, 'If that email exists, a verification code was sent'));
  }

  const { code, expires } = generateVerificationPayload();

  user.resetPasswordCode = code;
  user.resetPasswordExpires = expires;

  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetCodeEmail(user.email, code);
  } catch (err) {
    console.error('Failed to send reset email', err);
    throw createMailDeliveryError("Password reset email delivery");
  }

  res.status(200).json(new ApiResponse(200, null, 'If that email exists, a verification code was sent'));
});


// --- Verify reset code ---
const verifyResetCode = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const code = req.body.code?.trim();

  if (!normalizedEmail || !code) {
    throw new ApiError(400, 'Please provide email and code');
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordCode +resetPasswordExpires');

  if (!user || !user.resetPasswordCode) {
    throw new ApiError(400, 'Invalid or expired code');
  }

  if (user.resetPasswordCode !== code || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired code');
  }

  res.status(200).json(new ApiResponse(200, null, 'Code verified'));
});


// --- Reset password using code ---
const resetPassword = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const code = req.body.code?.trim();
  const { newPassword } = req.body;

  if (!normalizedEmail || !code || !newPassword) {
    throw new ApiError(400, 'Please provide email, code and new password');
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordCode +resetPasswordExpires +password');

  if (!user || user.resetPasswordCode !== code || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired code');
  }

  user.password = newPassword;
  user.resetPasswordCode = null;
  user.resetPasswordExpires = null;

  // generate new refresh token
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;

  await user.save();

  const accessToken = user.generateAccessToken();

  res.status(200).json(new ApiResponse(200, { user: sanitizeUser(user), accessToken, refreshToken }, 'Password reset successful'));
});


export {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
  forgotPassword,
  verifyResetCode,
  resetPassword
};

