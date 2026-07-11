import { Notification } from "../models/notification.model.js";

export const createNotification = async ({
  recipient,
  sender,
  type,
  video = null,
  comment = null,
}) => {
  if (!recipient || !sender) return null;

  // Never notify users about their own actions.
  if (recipient.toString() === sender.toString()) {
    return null;
  }

  return Notification.create({
    recipient,
    sender,
    type,
    video,
    comment,
  });
};

export const getUserNotifications = async ({
  userId,
  page = 1,
  limit = 20,
}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: userId })
      .populate("sender", "username avatar fullName")
      .populate("video", "title thumbnail")
      .populate("comment", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Notification.countDocuments({ recipient: userId }),
  ]);

  return {
    notifications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const markNotificationAsRead = async ({
  notificationId,
  userId,
}) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },
    {
      $set: { isRead: true },
    },
    {
      new: true,
    }
  );
};

export const getUnreadNotificationCount = async (userId) => {
  return Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};