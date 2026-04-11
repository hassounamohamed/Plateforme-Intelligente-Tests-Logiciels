import axiosInstance from "@/lib/axios";
import {
  NotificationDemoResult,
  NotificationItem,
  NotificationMarkAllReadResult,
  NotificationUnreadCount,
} from "@/types";

const BASE_URL = "/notifications";

export const listMyNotifications = async (
  unreadOnly = false,
  limit = 20
): Promise<NotificationItem[]> => {
  const response = await axiosInstance.get<NotificationItem[]>(`${BASE_URL}/me`, {
    params: { unread_only: unreadOnly, limit },
  });
  return response.data;
};

export const getUnreadNotificationsCount = async (): Promise<NotificationUnreadCount> => {
  const response = await axiosInstance.get<NotificationUnreadCount>(`${BASE_URL}/me/unread-count`);
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: number
): Promise<NotificationItem> => {
  const response = await axiosInstance.patch<NotificationItem>(
    `${BASE_URL}/${notificationId}/read`
  );
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<NotificationMarkAllReadResult> => {
  const response = await axiosInstance.patch<NotificationMarkAllReadResult>(
    `${BASE_URL}/me/read-all`
  );
  return response.data;
};

export const createDemoNotifications = async (): Promise<NotificationDemoResult> => {
  const response = await axiosInstance.post<NotificationDemoResult>(`${BASE_URL}/me/demo`);
  return response.data;
};
