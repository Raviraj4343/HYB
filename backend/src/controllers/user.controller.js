import {User} from '../models/user.models.js';
import {Request} from '../models/request.models.js';
import {Response} from '../models/response.models.js';
import { Notification } from '../models/notification.models.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { createAndEmitNotification } from '../utils/realtime.js';

const avatarUploadOptions = {
    folder: "hyb/avatars",
    width: 512,
    height: 512,
    crop: "fill",
    gravity: "face",
    quality: "auto:good",
    fetch_format: "auto",
};

const getUserProfile = asyncHandler(async (req, res, next) =>{
    const {userName} = req.params;
    
    let selectFields = "_id fullName userName avatar branch year hostel helpCount isBlocked blockedUntil blockReason";
    if (req.user?.role === 'super_admin' || req.user?.userName === userName) {
      selectFields += " phone";
    }

    const user = await User.findOne({ userName }).select(selectFields);
    if(!user){
        return next(new ApiError(404, "User not found"));
    }

    const [requestsCreated, responsesGiven] = await Promise.all([
        Request.countDocuments({requestedBy: user._id}),
        Response.countDocuments({responder: user._id})
    ]);

    const userProfile ={...user.toObject(),
        stats: {
            requestsCreated,
            responsesGiven,
            helpCount:user.helpCount
        }
    };

    return res
    .status(200)
    .json(new ApiResponse(200, {user: userProfile}, "user profile retrieved successfully"));
});

const uploadAvatar = asyncHandler(async (req, res, next) => {
    if(!req.file){
        return next(new ApiError(400, "please upload an image"));
    }

    const uploaded = await uploadOnCloudinary(req.file.path, avatarUploadOptions);

    if(!uploaded?.secure_url){
        return next(new ApiError(500, "Avatar upload failed"));
    }

    const existingUser = await User.findById(req.user.id).select("avatar");

    if (existingUser?.avatar) {
      await deleteFromCloudinary(existingUser.avatar);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: uploaded.secure_url }, 
      { new: true, select: "fullName userName avatar" }
    );

    if(!user){
        return next(new ApiError(404, "User not found"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {user}, "Avatar uploaded successfully"));
});

const searchUsers = asyncHandler(async (req, res, next) =>{
    const {q, limit =10} =req.query;

    if(!q || q.trim().length < 2){
        return next(new ApiError(400,"search query must be atleast 2 char"));
    }

    const users = await User.find({
        isActive: true,
        $or:[
            {userName: {$regex: q, $options: 'i'}},
            {fullName:{$regex:q, $options:'i'}}
        ]
    }).select("fullName userName avatar branch year helpCount isBlocked blockedUntil blockReason")
      .limit(Number(limit));

    return res
    .status(200)
    .json(new ApiResponse(200, { users }, "user found successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...user.toObject(),
        warningCount: user.warningCount || 0,
        isBlocked: user.isBlocked || false,
      },
      "User fetched successfully"
    )
  );
});

const getBlockedUsers = asyncHandler(async (req, res) => {
  const blockedUsers = await User.findBlockedUsers();

  return res
    .status(200)
    .json(new ApiResponse(200, blockedUsers, "Blocked users fetched successfully"));
});

const getAtRiskUsers = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 8;

  const atRiskUsers = await User.findAtRiskUsers(threshold);

  return res
    .status(200)
    .json(new ApiResponse(200, atRiskUsers, "At-risk users fetched successfully"));
});

const getUserWarningHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .select("userName email warningCount isBlocked blockedAt blockReason reportHistory")
    .populate({
      path: "reportHistory.reportId",
      select: "reason description status createdAt isValidated",
    });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User warning history fetched successfully"));
});

const resetUserWarnings = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { resetCount = true, unblock = true } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (resetCount) {
    user.warningCount = 0;
    user.reportHistory = [];
  }

  if (unblock && user.isBlocked) {
    user.isBlocked = false;
    user.blockedAt = null;
    user.blockReason = null;
  }

  await user.save();

  await createAndEmitNotification({
    user: userId,
    type: "account_unblocked",
    title: "Account Restored",
    message: "✅ Your account warnings have been reset by an administrator.",
    isRead: false,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        warningCount: user.warningCount,
        isBlocked: user.isBlocked,
      },
      "User warnings reset successfully"
    )
  );
});

export{
    getUserProfile,
    uploadAvatar,
    searchUsers,
    getCurrentUser,
    getBlockedUsers,
    getAtRiskUsers,
    getUserWarningHistory,
    resetUserWarnings
}
