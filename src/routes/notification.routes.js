import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  readNotification,
} from "../controllers/notification.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", readNotification);

export default router;