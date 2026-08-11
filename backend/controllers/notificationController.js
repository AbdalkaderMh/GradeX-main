import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import { notificationEvents } from "../utils/events.js";

export const streamNotifications = async (req, res) => {
    try {
        let recipientId = req.user.id;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const handler = (notification) => {
            res.write(`data: ${JSON.stringify(notification)}\n\n`);
        };

        notificationEvents.on(`new-notification-${recipientId}`, handler);

        req.on("close", () => {
            notificationEvents.removeListener(`new-notification-${recipientId}`, handler);
        });

    } catch (error) {
        res.end();
    }
};

export const getNotifications = async (req, res) => {
  try {
    let recipientId = req.user.id;

    const notifications = await Notification.find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    let recipientId = req.user.id;
    await Notification.findOneAndUpdate(
      { _id: id, recipient: recipientId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    let recipientId = req.user.id;
    await Notification.updateMany(
      { recipient: recipientId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        let recipientId = req.user.id;
        await Notification.findOneAndDelete({ _id: id, recipient: recipientId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

export const clearAllNotifications = async (req, res) => {
  try {
    let recipientId = req.user.id;
    await Notification.deleteMany({ recipient: recipientId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
