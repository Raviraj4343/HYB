import {Report} from '../models/report.models.js';
import {User} from '../models/user.models.js';
import {Message} from '../models/message.models.js';
import {Chat} from '../models/chat.models.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Notification } from "../models/notification.models.js";
import {validateReport} from "../utils/reportValidatorAI.js"
import { BLOCK_THRESHOLD} from "../constants.js";
import { createAndEmitNotification, emitAdminNotificationCreated, emitNotificationCount } from "../utils/realtime.js";
import { buildAccountRestrictionEmail, sendMail } from "../utils/mailer.js";

const sendBlockedAccountEmail = async (user, days, reason, blockedUntil) => {
  const durationLabel = `${days} day${days > 1 ? "s" : ""}`;
  const untilLabel = blockedUntil.toLocaleString("en-IN", { timeZone: "Asia/Calcutta" });
  const { text, html } = buildAccountRestrictionEmail({
    title: "Your HYB account has been blocked",
    subtitle: "A super admin restricted your account temporarily. Review the details below.",
    reason,
    durationLabel,
    untilLabel,
  });

  await sendMail({
    to: user.email,
    subject: "HYB account temporarily blocked",
    text,
    html,
  });
};

const notifyAdmins = async (report, reporter, reportedUser) => {
  const admins = await User.find({ role: "admin" }).select("_id");

  if (!admins.length) return;

  const notifications = admins.map((admin) => ({
    user: admin._id,
    type: "report",
    title: "New User Report",
    message: `📋 ${reporter.userName} reported ${reportedUser.userName} for: ${report.reason}`,
    data: {
      reportId: report._id,
      reportedUserId: reportedUser._id,
    },
    isRead: false,
  }));

  const createdNotifications = await Notification.insertMany(notifications);

  for (const notification of createdNotifications) {
    const hydratedNotification = await Notification.findById(notification._id)
      .populate("request", "title status")
      .lean();

    emitAdminNotificationCreated(hydratedNotification);
    await emitNotificationCount(notification.user);
  }
};

const notifyReportedUser = async (userId, warningCount, isBlocked) => {
  await createAndEmitNotification({
    user: userId,
    type: isBlocked ? "account_blocked" : "warning",
    title: isBlocked ? "Account Blocked" : "Account Warning",
    message: isBlocked
      ? "🚫 Your account has been blocked due to repeated violations."
      : `⚠️ You have received a warning (${warningCount}/11). Continued violations may block your account.`,
    data: { warningCount, isBlocked },
    isRead: false,
  });
};

const createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reason, description, chatId } = req.body;

  if (!reportedUserId || !reason) {
    throw new ApiError(400, "Reported user and reason are required");
  }

  if (reportedUserId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Can't report yourself");
  }

  const reportedUser = await User.findById(reportedUserId);
  if (!reportedUser) {
    throw new ApiError(404, "User not found");
  }

  const reporter = await User.findById(req.user._id);
  if (!reporter) {
    throw new ApiError(401, "Reporter not found");
  }

  // Fetch last 15 chat messages for AI context (if chatId provided)
  let recentMessages = [];
  if (chatId) {
    try {
      // Verify the reporter is a participant of that chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user._id,
      });
      if (chat) {
        recentMessages = await Message.find({ chat: chatId, isDeleted: false })
          .populate('sender', 'fullName userName')
          .sort({ createdAt: -1 })
          .limit(15)
          .lean();
        // Reverse so oldest is first for readability in prompt
        recentMessages = recentMessages.reverse();
      }
    } catch (err) {
      console.error('[createReport] Failed to fetch chat messages for AI context:', err.message);
    }
  }

  let isValidReport = false;
  try {
    isValidReport = await validateReport({
      reason,
      description: description || "",
      recentMessages,
    });
  } catch (error) {
    console.error("AI validation failed:", error.message);
    isValidReport = false; // fallback to manual review
  }

  const normalizedReason = reason
  .toLowerCase()
  .trim()
  .replace(/\s+/g, "_");

    // map common phrases → valid enums
    const reasonMap = {
      "harassment_or_bullying": "harassment",
      "bullying": "harassment",
    };

  const finalReason = reasonMap[normalizedReason] || normalizedReason;
  const report = await Report.create({
    reportedUser: reportedUserId,
    reporter: req.user._id,
    reason: finalReason,
    description: description || "",
    status: "pending",
    isValidated: isValidReport,
    validatedAt: isValidReport ? new Date() : null,
  });

  // 🔔 Notify admins ALWAYS (regular admin notification)
  await notifyAdmins(report, reporter, reportedUser);

  let warningCount = reportedUser.warningCount;
  let isBlocked = reportedUser.isBlocked;

  if (isValidReport) {
    // ✅ AI validated — auto-apply warning / block
    const warnResult = await reportedUser.incrementWarning(report._id);
    warningCount = warnResult.warningCount;
    isBlocked = warnResult.isBlocked;
    await notifyReportedUser(reportedUserId, warningCount, isBlocked);
  } else {
    // ❌ AI could NOT validate — escalate to super-admins for manual review
    try {
      const superAdmins = await User.find({ role: "super_admin" }).select("_id");

      if (superAdmins.length > 0) {
        // Build a compact transcript for the notification
        const transcript = recentMessages.length > 0
          ? recentMessages.map((m, i) => {
              const sender = m.sender?.userName || m.sender?.fullName || 'User';
              const text   = m.isDeleted ? '[deleted]' : (m.content || '[image]');
              return `[${i + 1}] ${sender}: ${text}`;
            }).join('\n')
          : '(No chat messages available)';

        const reviewNotifications = superAdmins.map(sa => ({
          user: sa._id,
          type: "report_review",
          title: "⚠️ Manual Report Review Required",
          message: `${reporter.userName} reported ${reportedUser.userName} for "${finalReason}". AI could not verify — please review the last ${recentMessages.length} chat message(s) below and approve or reject.`,
          data: {
            reportId:         report._id,
            reportedUserId:   reportedUser._id,
            reportedUserName: reportedUser.userName,
            reporterName:     reporter.userName,
            reason:           finalReason,
            description:      description || '',
            chatId:           chatId || null,
            transcript,       // plain-text transcript for display
            recentMessages: recentMessages.map(m => ({
              senderName: m.sender?.userName || m.sender?.fullName || 'User',
              content:    m.isDeleted ? '[deleted]' : (m.content || '[image]'),
              createdAt:  m.createdAt,
            })),
          },
          isRead: false,
        }));

        const created = await Notification.insertMany(reviewNotifications);

        for (const n of created) {
          const hydrated = await Notification.findById(n._id)
            .populate("request", "title status")
            .lean();
          emitAdminNotificationCreated(hydrated);
          await emitNotificationCount(n.user);
        }
      }
    } catch (err) {
      // Non-fatal — log and continue
      console.error('[createReport] Failed to send super-admin review notification:', err.message);
    }
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        report: {
          _id: report._id,
          reason: report.reason,
          isValidated: isValidReport,
          createdAt: report.createdAt,
        },
        reportedUserStatus: {
          warningCount,
          isBlocked,
        },
      },
      isValidReport
        ? "Report validated — warning issued automatically"
        : "AI could not verify report — sent to super-admin for manual review"
    )
  );
});



const getAllReports = asyncHandler(async (req, res) => {
    const { status, page =1, limit = 20} = req.query;

    const query={};
    if(status){
        query.status = status;
    }

    const pageNum=parseInt(page);
    const limitNum=parseInt(limit);
    const skip = (pageNum-1)*limitNum;

    const reports=await Report.find(query)
    .populate("reportedUser", "fullName userName email warningCount isBlocked blockReason blockedUntil")
    .populate("reporter", "fullName userName")
    .populate("reviewedBy", "fullName userName")
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limitNum);

    const total= await Report.countDocuments(query);

    return res
    .status(200)
    .json(new ApiResponse(200, {
        reports, pagination:{
            total, page:pageNum, pages: Math.ceil(total/limitNum)
        }
    }, "Report retrived successfully"));
});

const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await Report.findById(id)
    .populate('reporter', 'username email avatar')
    .populate('reportedUser', 'username email avatar warningCount isBlocked');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  return res.status(200).json(
    new ApiResponse(200, report, 'Report fetched successfully')
  );
});

const getReportsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const reports = await Report.find({ reportedUser: userId })
    .populate('reporter', 'username avatar')
    .sort({ createdAt: -1 });

  const user = await User.findById(userId).select('username warningCount isBlocked');

  return res.status(200).json(
    new ApiResponse(200, {
      user,
      reports,
      totalReports: reports.length
    }, 'User reports fetched successfully')
  );
});

const updateReport = asyncHandler(async (req, res, next) =>{
    const { status, reviewNotes} = req.body;
    
    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid report status");
    }

    const report = await Report.findById(req.params.id);
    if(!report){
        return next(new ApiError(404, "Report not found"));
    }

    report.status=status;
    report.reviewNotes=reviewNotes;
    report.reviewedBy= req.user.id;
    report.reviewedAt=new Date();

    await report.save();

    return res
    .status(200)
    .json(new ApiResponse(200, {report}, "Report updated successfully"));
});

const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { resetWarnings } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.isBlocked) {
    throw new ApiError(400, 'User is not blocked');
  }

  // Unblock the user
  user.isBlocked = false;
  user.blockedAt = null;
  user.blockedUntil = null;
  user.blockReason = null;
  user.blockedBy = null;

  // Optionally reset warning count
  if (resetWarnings) {
    user.warningCount = 0;
  }

  await user.save();

  // Notify user about unblock
  await createAndEmitNotification({
    user: userId,
    type: 'account_unblocked',
    title: 'Account Restored',
    message: '✅ Your account has been unblocked. Please follow community guidelines to avoid future restrictions.',
    isRead: false
  });

  return res.status(200).json(
    new ApiResponse(200, {
      userId: user._id,
      username: user.username,
      isBlocked: user.isBlocked,
      warningCount: user.warningCount
    }, 'User unblocked successfully')
  );
});

const blockUserBySuperAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days, reason } = req.body;

  const blockDays = Number(days);
  const trimmedReason = reason?.trim();

  if (!blockDays || blockDays < 1 || blockDays > 365) {
    throw new ApiError(400, "Block days must be between 1 and 365");
  }

  if (!trimmedReason) {
    throw new ApiError(400, "Block reason is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const blockedUntil = new Date(Date.now() + blockDays * 24 * 60 * 60 * 1000);

  user.isBlocked = true;
  user.blockedAt = new Date();
  user.blockedUntil = blockedUntil;
  user.blockReason = trimmedReason;
  user.blockedBy = req.user._id;

  await user.save({ validateBeforeSave: false });

  await createAndEmitNotification({
    user: user._id,
    type: "account_blocked",
    title: "Account Blocked",
    message: `Your account was blocked for ${blockDays} day${blockDays > 1 ? "s" : ""}. Reason: ${trimmedReason}`,
    data: {
      days: blockDays,
      blockReason: trimmedReason,
      blockedUntil,
    },
    isRead: false,
  });

  try {
    await sendBlockedAccountEmail(user, blockDays, trimmedReason, blockedUntil);
  } catch (error) {
    console.error("Failed to send blocked account email", error);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: user._id,
        userName: user.userName,
        isBlocked: user.isBlocked,
        blockedUntil: user.blockedUntil,
        blockReason: user.blockReason,
      },
      "User blocked successfully"
    )
  );
});

/**
 * PATCH /api/v1/report/:reportId/review
 * Body: { action: "approve" | "reject", notificationId }
 * Super-admin manually approves or rejects a pending report_review.
 * - approve → warn/block reported user (same as AI-valid path)
 * - reject  → dismiss the report silently
 */
const reviewReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { action, notificationId } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    throw new ApiError(400, 'action must be "approve" or "reject"');
  }

  const report = await Report.findById(reportId);
  if (!report) throw new ApiError(404, 'Report not found');

  if (report.status !== 'pending') {
    throw new ApiError(400, 'Report has already been reviewed');
  }

  report.reviewedBy  = req.user._id;
  report.reviewedAt  = new Date();
  report.reviewNotes = `Manual review by super-admin: ${action}`;

  if (action === 'approve') {
    // Apply the same auto-action as the AI-valid path
    const reportedUser = await User.findById(report.reportedUser);
    if (!reportedUser) throw new ApiError(404, 'Reported user not found');

    const warnResult = await reportedUser.incrementWarning(report._id);
    const warningCount = warnResult.warningCount;
    const isBlocked = warnResult.isBlocked;

    report.status      = 'resolved';
    report.isValidated = true;
    report.validatedAt = new Date();

    await notifyReportedUser(report.reportedUser, warningCount, isBlocked);
    await report.save();

    // Delete the review notification so it no longer sits in the inbox
    if (notificationId) {
      await Notification.deleteOne({ _id: notificationId });
      await emitNotificationCount(req.user._id);
    }

    return res.status(200).json(
      new ApiResponse(200, { report, warningCount, isBlocked }, 'Report approved — warning issued to user')
    );
  }

  // action === 'reject'
  report.status = 'dismissed';
  await report.save();

  if (notificationId) {
    await Notification.deleteOne({ _id: notificationId });
    await emitNotificationCount(req.user._id);
  }

  return res.status(200).json(
    new ApiResponse(200, { report }, 'Report rejected — no action taken')
  );
});

export {
    createReport,
    getAllReports,
    updateReport,
    getReportById,
    getReportsByUser,
    unblockUser,
    blockUserBySuperAdmin,
    reviewReport
};
