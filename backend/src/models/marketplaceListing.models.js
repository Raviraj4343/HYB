import mongoose from "mongoose";
import {
  MARKETPLACE_AVAILABILITY,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_LISTING_TYPES,
  MAX_IMAGE_IN_LISTING
} from "../constants.js";

const marketplaceListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [120, "Title cannot exceed 120 characters"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: [10, "Description must be at least 10 characters"],
    maxlength: [1500, "Description cannot exceed 1500 characters"]
  },
  category: {
    type: String,
    enum: MARKETPLACE_CATEGORIES,
    required: true
  },
  listingType: {
    type: String,
    enum: MARKETPLACE_LISTING_TYPES,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"]
  },
  condition: {
    type: String,
    enum: MARKETPLACE_CONDITIONS,
    required: true
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator(value) {
        return value.length <= MAX_IMAGE_IN_LISTING;
      },
      message: `A listing can have up to ${MAX_IMAGE_IN_LISTING} images`
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  availability: {
    type: String,
    enum: MARKETPLACE_AVAILABILITY,
    default: "available",
    index: true
  },
  contactPhone: {
    type: String,
    trim: true,
    default: null
  },
  securityDeposit: {
    type: Number,
    min: [0, "Security deposit cannot be negative"],
    default: null
  },
  maxBorrowDuration: {
    type: String,
    trim: true,
    maxlength: [80, "Borrow duration cannot exceed 80 characters"],
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

marketplaceListingSchema.index({
  title: "text",
  description: "text",
  category: "text"
});
marketplaceListingSchema.index({ availability: 1, createdAt: -1 });
marketplaceListingSchema.index({ listingType: 1, category: 1, price: 1 });
marketplaceListingSchema.index({ owner: 1, createdAt: -1 });

export const MarketplaceListing = mongoose.model("MarketplaceListing", marketplaceListingSchema);
