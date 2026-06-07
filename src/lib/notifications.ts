import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { NotificationType } from "@prisma/client";

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(options: CreateNotificationOptions) {
  const notification = await prisma.notification.create({
    data: {
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
    },
  });

  return notification;
}

export async function createInAppNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  return createNotification({
    userId,
    type: "IN_APP",
    title,
    message,
    link,
  });
}

export async function sendNotificationEmail(
  userId: string,
  subject: string,
  html: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return false;

  const sent = await sendEmail({ to: user.email, subject, html });

  await createNotification({
    userId,
    type: "EMAIL",
    title: subject,
    message: `Email sent to ${user.email}`,
  });

  return sent;
}

export async function sendNotificationSMS(userId: string, message: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.phone) return false;

  const sent = await sendSMS({ to: user.phone, message });

  await createNotification({
    userId,
    type: "SMS",
    title: "SMS Notification",
    message,
  });

  return sent;
}

export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, status: { not: "READ" } },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, status: { not: "READ" } },
  });
}
