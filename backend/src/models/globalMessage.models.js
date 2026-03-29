import mongoose from "mongoose";

const globalMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: function () {
        return !this.isDeleted;
      },
      maxlength: 1000,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GlobalMessage",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

globalMessageSchema.index({ createdAt: -1 });
globalMessageSchema.index({ sender: 1, createdAt: -1 });
globalMessageSchema.index({ replyTo: 1 });

export const GlobalMessage = mongoose.model("GlobalMessage", globalMessageSchema);
