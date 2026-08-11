import express from "express";
import {
  getNotifications,
  streamNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/stream", protect, streamNotifications);
router.put("/mark-all-read", protect, markAllAsRead);
router.delete("/clear-all", protect, clearAllNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
