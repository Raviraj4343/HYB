import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../constants.js";

const notificationSchema = new mongoose.Schema({
    user: {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type : String,
        enum : NOTIFICATION_TYPES,
        required: true
    },
    request: {
        type : mongoose.Schema.Types.ObjectId,
        ref: "Request"
    },
    title: {
    type: String,
    required: true,
    maxlength: 100
    },
    data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    },
    message: {
        type:String,
        required:true,
        trim : true
    },
    isRead: {
        type:Boolean,
        default:false
    },
    readAt: {
    type: Date,
    default: null
    }
}, {timestamps:true});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};
export const Notification = mongoose.model("Notification", notificationSchema);