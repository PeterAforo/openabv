import { createEvent, EventAttributes } from "ics";

interface ICSEventData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  organizer?: { name: string; email: string };
  attendees?: Array<{ name: string; email: string }>;
}

export function generateICSFile(data: ICSEventData): Promise<string> {
  const start = data.startTime;
  const end = data.endTime;

  const event: EventAttributes = {
    start: [
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    ],
    end: [
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes(),
    ],
    title: data.title,
    description: data.description,
    location: data.location,
    organizer: data.organizer
      ? { name: data.organizer.name, email: data.organizer.email }
      : undefined,
    attendees: data.attendees?.map((a) => ({
      name: a.name,
      email: a.email,
      rsvp: true,
      partstat: "NEEDS-ACTION" as const,
      role: "REQ-PARTICIPANT" as const,
    })),
    status: "CONFIRMED",
    busyStatus: "BUSY",
    alarms: [
      {
        action: "display",
        description: "Reminder",
        trigger: { hours: 1, before: true },
      },
    ],
  };

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(value);
    });
  });
}
