import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendMail } from "../utils/mailer.js";


// helper senetize user
const sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  return userObj;
};


const registerUser = asyncHandler(async (req, res) => {
  if (!req.body) {
  throw new ApiError(400, "Request body is missing");
  }

  const { fullName, userName, email, password, branch, year, hostel } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { userName }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(400, "Email already registered");
    }
    if (existingUser.userName === userName) {
      throw new ApiError(400, "Username already taken");
    }
  }

  const userCount = await User.countDocuments();
  const user = await User.create({
    fullName,
    userName,
    email,
    password,
    branch,
    year,
    hostel,
    role:userCount === 0 ? "admin" : "user"
  });
  const accessToken = user.generateAccessToken();

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: sanitizeUser(user),
        accessToken
      },
      "User registered successfully"
    )
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
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
    const uploadedAvatar = await uploadOnCloudinary(req.file.path);

    if(!uploadedAvatar?.url){
      throw new ApiError(500, "Avatar upload failed");
    }

    if(user.avatar){
      await deleteFromCloudinary(user.avatar);
    }

    updates.avatar = uploadedAvatar.url;
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
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Please provide an email');
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Do not reveal whether email exists
    return res.status(200).json(new ApiResponse(200, null, 'If that email exists, a verification code was sent'));
  }

  // generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  user.resetPasswordCode = code;
  user.resetPasswordExpires = expires;

  await user.save({ validateBeforeSave: false });

  const subject = 'Your password reset code';
  const text = `Your password reset code is ${code}. It expires in 15 minutes.`;
  const html = `<p>Your password reset code is <strong>${code}</strong>.</p><p>This code expires in 15 minutes.</p>`;

  try {
    await sendMail({ to: user.email, subject, text, html });
  } catch (err) {
    // Log but don't reveal details to caller
    console.error('Failed to send reset email', err);
  }

  res.status(200).json(new ApiResponse(200, null, 'If that email exists, a verification code was sent'));
});


// --- Verify reset code ---
const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new ApiError(400, 'Please provide email and code');
  }

  const user = await User.findOne({ email }).select('+resetPasswordCode +resetPasswordExpires');

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
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    throw new ApiError(400, 'Please provide email, code and new password');
  }

  const user = await User.findOne({ email }).select('+resetPasswordCode +resetPasswordExpires +password');

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
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
  forgotPassword,
  verifyResetCode,
  resetPassword
};

