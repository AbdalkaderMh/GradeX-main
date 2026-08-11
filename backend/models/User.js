import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { normalizeArabic } from "../utils/textUtils.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "approved" // Default to approved, but override in signup logic
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Number
    },
    requiresPasswordChange: {
      type: Boolean,
      default: true
    },
    normalizedName: {
      type: String,
      index: true
    },
    avatar: {
      type: String,
      default: ""
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    roleVersion: {
        type: Number,
        default: 0
    },
    resetToken: {
        type: String,
        index: true
    },
    resetTokenExpiry: {
        type: Date
    }
  },
  { timestamps: true }
);

// hash password & normalize name
userSchema.pre("save", async function (next) {
  if (this.isModified("name")) {
      this.normalizedName = normalizeArabic(this.name);
  }
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

const User = mongoose.model("User", userSchema);
export default User;
