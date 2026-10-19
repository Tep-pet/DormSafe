import * as notificationService from '../services/notification.service.js';
import { success } from '../utils/apiResponse.js';

export async function list(req, res, next) {
  try {
    const notifications = await notificationService.getUserNotifications(req.profile.id);
    return success(res, notifications);
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.profile.id);
    return success(res, { count });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markNotificationRead(
      req.params.id,
      req.profile.id
    );
    return success(res, notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllNotificationsRead(req.profile.id);
    return success(res, { ok: true });
  } catch (err) {
    next(err);
  }
}
