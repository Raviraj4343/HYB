import mongoose from "mongoose";
import { CAMPUS_RESOURCE_CATEGORIES } from "../constants.js";

const campusResourceSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: CAMPUS_RESOURCE_CATEGORIES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [140, "Title cannot exceed 140 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    contactName: {
      type: String,
      trim: true,
      maxlength: [120, "Contact name cannot exceed 120 characters"],
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: [40, "Phone number cannot exceed 40 characters"],
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [160, "Location cannot exceed 160 characters"],
      default: "",
    },
    externalLink: {
      type: String,
      trim: true,
      maxlength: [500, "External link cannot exceed 500 characters"],
      default: "",
    },
    effectiveDate: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

campusResourceSchema.index({ category: 1, sortOrder: 1, createdAt: -1 });

export const CampusResource = mongoose.model("CampusResource", campusResourceSchema);
