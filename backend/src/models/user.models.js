import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BLOCK_THRESHOLD, USER_ROLE } from "../constants.js";

// const UserSchemaAddition

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  userName: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false 
  },
  branch: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1,
    max: 5
  },
  hostel: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  helpCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },



  warningCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Block status - set to true when warningCount >= 11
  isBlocked: {
    type: Boolean,
    default: false
  },

  blockedAt: {
    type: Date,
    default: null
  },

  blockedUntil: {
    type: Date,
    default: null
  },
  
  blockReason: {
    type: String,
    default: null
  },

  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  
  // Optional: Array of report IDs that contributed to warnings
  reportHistory: [{
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],


  refreshToken: {
  type: String,
  select: false
 },
 emailVerificationCode: {
   type: String,
   select: false,
   default: null
 },
 emailVerificationExpires: {
   type: Date,
   select: false,
   default: null
 },
 isEmailVerified: {
   type: Boolean,
   default: false
 },
 resetPasswordCode: {
   type: String,
   select: false,
   default: null
 },
 resetPasswordExpires: {
   type: Date,
   select: false,
   default: null
 },
 role:{
  type:String,
  enum : USER_ROLE
 }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementWarning = async function(reportId = null) {
  this.warningCount += 1;
  
  // Add to report history if reportId provided
  if (reportId) {
    this.reportHistory.push({
      reportId,
      reportedAt: new Date()
    });
  }
  
  // Check if user should be blocked (threshold: 11 warnings)
  if (this.warningCount >= BLOCK_THRESHOLD && !this.isBlocked) {
    this.isBlocked = true;
    this.blockedAt = new Date();
    this.blockedUntil = null;
    this.blockReason = 'Automatically blocked due to excessive reports';
  }
  
  await this.save();
  
  return {
    warningCount: this.warningCount,
    isBlocked: this.isBlocked
  };
};

userSchema.methods.unblockUser = async function() {
  this.isBlocked = false;
  this.blockedAt = null;
  this.blockedUntil = null;
  this.blockReason = null;
  this.blockedBy = null;
  // Optionally reset warning count or keep history
  // this.warningCount = 0;
  
  await this.save();
  
  return {
    isBlocked: this.isBlocked,
    warningCount: this.warningCount
  };
};

userSchema.statics.findBlockedUsers = function() {
  return this.find({ isBlocked: true }).select('-password -refreshToken');
};

userSchema.statics.findAtRiskUsers = function(threshold = 8) {
  return this.find({ 
    warningCount: { $gte: threshold },
    isBlocked: false 
  }).select('-password -refreshToken');
};

// generate access token
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { _id: this._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// Remove sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

export const User = mongoose.model("User", userSchema);
