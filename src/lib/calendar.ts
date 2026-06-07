import { google } from "googleapis";
import prisma from "@/lib/prisma";

export function getGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function createGoogleCalendarEvent(
  userId: string,
  eventData: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
  }
): Promise<string | null> {
  const integration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: "google", isActive: true },
  });

  if (!integration?.accessToken) return null;

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const event = await calendar.events.insert({
      calendarId: integration.calendarId || "primary",
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: "Africa/Accra",
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: "Africa/Accra",
        },
        attendees: eventData.attendees?.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });

    return event.data.id || null;
  } catch (error) {
    console.error("Google Calendar event creation failed:", error);
    return null;
  }
}

export async function updateGoogleCalendarEvent(
  userId: string,
  eventId: string,
  eventData: {
    summary?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
  }
): Promise<boolean> {
  const integration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: "google", isActive: true },
  });

  if (!integration?.accessToken) return false;

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    await calendar.events.patch({
      calendarId: integration.calendarId || "primary",
      eventId,
      requestBody: {
        ...(eventData.summary && { summary: eventData.summary }),
        ...(eventData.description && { description: eventData.description }),
        ...(eventData.startTime && {
          start: { dateTime: eventData.startTime.toISOString(), timeZone: "Africa/Accra" },
        }),
        ...(eventData.endTime && {
          end: { dateTime: eventData.endTime.toISOString(), timeZone: "Africa/Accra" },
        }),
      },
    });
    return true;
  } catch (error) {
    console.error("Google Calendar event update failed:", error);
    return false;
  }
}

export async function deleteGoogleCalendarEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  const integration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: "google", isActive: true },
  });

  if (!integration?.accessToken) return false;

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: integration.calendarId || "primary",
      eventId,
    });
    return true;
  } catch (error) {
    console.error("Google Calendar event deletion failed:", error);
    return false;
  }
}
