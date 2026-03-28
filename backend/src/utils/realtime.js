import { Notification } from "../models/notification.models.js";
import { emitToAdmins, emitToChat, emitToUser, emitToUsers, emitRequestEvent } from "../socket/index.js";

export const getUnreadNotificationCount = async (userId) => (
  Notification.countDocuments({
    user: userId,
    isRead: false,
  })
);

export const hydrateNotification = async (notificationId) => (
  Notification.findById(notificationId)
    .populate("request", "title status")
    .lean()
);

export const emitNotificationCount = async (userId) => {
  if (!userId) return;
  const unreadCount = await getUnreadNotificationCount(userId);
  emitToUser(userId, "notification:count", { unreadCount });
};

export const createAndEmitNotification = async (payload) => {
  const notification = await Notification.create(payload);
  const hydratedNotification = await hydrateNotification(notification._id);

  emitToUser(payload.user, "notification:new", { notification: hydratedNotification });
  await emitNotificationCount(payload.user);

  return hydratedNotification;
};

export const emitNotificationUpdated = async (notificationId) => {
  const notification = await Notification.findById(notificationId).lean();
  if (!notification) return;

  const hydratedNotification = await hydrateNotification(notificationId);
  emitToUser(notification.user, "notification:updated", { notification: hydratedNotification });
  await emitNotificationCount(notification.user);
};

export const emitNotificationDeleted = async (userId, notificationId) => {
  emitToUser(userId, "notification:deleted", { notificationId });
  await emitNotificationCount(userId);
};

export const emitChatMessageCreated = (chatId, message) => {
  emitToChat(chatId, "chat:message:new", { chatId: chatId.toString(), message });
};

export const emitChatMessageDeleted = (chatId, messageId, deletedAt) => {
  emitToChat(chatId, "chat:message:deleted", {
    chatId: chatId.toString(),
    messageId: messageId.toString(),
    deletedAt,
  });
};

export const emitChatListRefresh = (userIds) => {
  emitToUsers(userIds, "chat:list:refresh", { at: new Date().toISOString() });
};

export const emitRequestChanged = (action, request) => {
  emitRequestEvent("request:changed", {
    action,
    request,
    requestId: request?._id?.toString?.() || request?._id || null,
    at: new Date().toISOString(),
  });
};

export const emitAdminNotificationCreated = (notification) => {
  emitToAdmins("notification:new", { notification });
};
