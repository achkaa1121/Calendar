import { prisma } from "../prisma.js";
import { ApiError } from "../utils/apiError.js";
import {
  currentDateOnly,
  formatDateOnly,
  parseDateOnly,
} from "../utils/dateOnly.js";
import { normalizeRecurrenceRule } from "../utils/recurrenceRule.js";
import { eventRangeSchema, eventSchema, idSchema, parseInput } from "../utils/validation.js";

export const listEvents = async (
  userId: string,
  rawStart: unknown,
  rawEnd: unknown,
) => {
  const range = parseInput(eventRangeSchema, { start: rawStart, end: rawEnd });
  const startDate = range.start ? parseDateOnly(range.start) : null;
  const endDate = range.end ? parseDateOnly(range.end) : null;
  if (startDate && endDate && startDate > endDate) {
    throw new ApiError("Range start must be before range end", 400);
  }

  const events = await prisma.event.findMany({
    where: {
      userId,
      ...(endDate ? { startDate: { lte: endDate } } : {}),
      ...(startDate
        ? {
            OR: [
              { endDate: { gte: startDate } },
              { recurrenceRule: { not: null } },
            ],
          }
        : {}),
    },
    orderBy: [{ startDate: "asc" }, { startTime: "asc" }],
  });

  return events.map((event) => ({
    ...event,
    startDate: formatDateOnly(event.startDate),
    endDate: formatDateOnly(event.endDate),
  }));
};

export const createEvent = async (userId: string, body: unknown) => {
  const {
    title,
    description,
    startDate: rawStartDate,
    endDate: rawEndDate,
    startTime,
    endTime,
    isAllDay = false,
    recurrenceRule: rawRecurrenceRule,
  } = parseInput(eventSchema, body);
  const startDate = parseDateOnly(rawStartDate);
  const endDate = parseDateOnly(rawEndDate);
  if (!startDate || !endDate) {
    throw new ApiError("Events need valid future dates and a valid time range", 400);
  }
  if (rawStartDate < currentDateOnly()) {
    throw new ApiError("Events need valid future dates and a valid time range", 400);
  }

  const recurrenceRule = normalizeRecurrenceRule(rawRecurrenceRule, rawStartDate);
  const event = await prisma.event.create({
    data: {
      userId,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      startDate,
      endDate,
      startTime: isAllDay ? null : (startTime as string),
      endTime: isAllDay ? null : (endTime as string),
      isAllDay,
      recurrenceRule,
    },
  });
  return {
    ...event,
    startDate: formatDateOnly(event.startDate),
    endDate: formatDateOnly(event.endDate),
  };
};

export const removeEvent = async (userId: string, eventId: string) => {
  eventId = parseInput(idSchema, eventId);
  const result = await prisma.event.deleteMany({ where: { id: eventId, userId } });
  if (result.count === 0) throw new ApiError("Event not found", 404);
};
