import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect middleware
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Token Revocation check
    const tokenVersion = decoded.version !== undefined ? decoded.version : 0;
    if (tokenVersion !== (user.tokenVersion || 0)) {
        return res.status(401).json({ success: false, message: "Token expired or invalidated" });
    }

    // Role Version check
    const roleVersion = decoded.roleVersion !== undefined ? decoded.roleVersion : 0;
    if (roleVersion !== (user.roleVersion || 0)) {
        return res.status(401).json({ success: false, message: "Role updated. Please login again." });
    }

    if (user.status !== "approved") {
        return res.status(403).json({ message: "Account not approved" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/**
 * Grant access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

export const adminOnly = authorize("admin");
export const teacherOnly = authorize("teacher");
export const staffOnly = authorize("admin", "teacher");
