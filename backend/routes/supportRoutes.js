import express from "express";
import { sendMessage, getMessages, updateMessageStatus } from "../controllers/supportController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/all", protect, getMessages);
router.put("/:id", protect, adminOnly, updateMessageStatus);

export default router;
