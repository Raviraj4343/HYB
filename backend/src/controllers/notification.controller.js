import {Notification} from '../models/notification.models.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  emitNotificationCount,
  emitNotificationDeleted,
  emitNotificationUpdated,
} from '../utils/realtime.js';

const getMyNotifications = asyncHandler(async (req, res) => {
    const {page = 1, limit = 20} = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip= (pageNum-1)*limitNum;
    
    const query = {
    $or: [
        { user: req.user.id },
        ...(req.user.role === "admin" || req.user.role === "moderator"
        ? [{ forRole: "admin" }]
        : [])
    ]
    };

    const notifications = await Notification.find(query)
    .populate("request", "title status")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
    ...query,
    isRead: false
    });

    return res
    .status(200)
    .json(new ApiResponse(200,{ notifications, unreadCount,
        pagination: {
            total,
            page: pageNum,
            pages:Math.ceil(total/limitNum)
        }
      }, "Notification retrieved successfully"
    )
    );
});

const markAsRead = asyncHandler(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if(!notification){
        return next(new ApiError(404,"Notification not found"));
    }

    if(notification.user.toString() !==req.user.id){
        return next(new ApiError(403,"Not authorized"));
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    await emitNotificationUpdated(notification._id);

    return res
    .status(200)
    .json(new ApiResponse(200,
        {notification}, "Notification marked as read"
    ));
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {user:req.user.id, isRead:false},
        {isRead:true, readAt: new Date()}
    );
    await emitNotificationCount(req.user.id);

    return res
    .status(200)
    .json(new ApiResponse(200, null, "All notificaion marked as read"));
});

const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ApiError('Notification not found',404));
  }

  if (notification.user.toString() !==req.user.id) {
    return next(new ApiError('Not authorized', 403));
  }

  await notification.deleteOne();
  await emitNotificationDeleted(req.user.id, req.params.id);

  return res
  .status(200)
  .json(new ApiResponse(200, null, 'Notification deleted successfully')
  );
});

export {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
