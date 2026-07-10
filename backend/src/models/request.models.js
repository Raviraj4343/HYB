import mongoose from "mongoose";
import {
  REQUEST_CATEGORIES,
  URGENCY_LEVELS,
  REQUEST_STATUS,
  CONTACT_OPTION
} from "../constants.js";

const requestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [5, "Title must be at least 5 characters"],
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: [10, "Description must be at least 10 characters"]
  },
  category: {
    type: String,
    enum: REQUEST_CATEGORIES,
    default: "General"
  },
  urgency: {
    type: String,
    enum: URGENCY_LEVELS,
    default: "normal"
  },
  image: {
    type: String,
    default: null
  },
  images: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: REQUEST_STATUS,
    default: "open"
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  locationHint: {
    type: String,
    trim: true
  },
  contact: {
    type: String,
    enum: CONTACT_OPTION,
    default: "chat"
  },
  expiresAt: {
    type: Date,
    required : true,
    default: function() {
      // Auto expire after 2 days
      return new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    }
  },
  acceptedHelper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fulfilledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ requestedBy: 1 });
requestSchema.index({ category: 1 });
requestSchema.index({expiresAt: 1});


export const Request = mongoose.model("Request", requestSchema);