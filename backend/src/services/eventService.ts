import { prisma } from "../prisma.js";
import { ApiError } from "../utils/apiError.js";
import {
  currentDateOnly,
  formatDateOnly,
  parseDateOnly,
} from "../utils/dateOnly.js";
import { normalizeRecurrenceRule } from "../utils/recurrenceRule.js";

const isValidTime = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export const listEvents = async (
  userId: string,
  rawStart: unknown,
  rawEnd: unknown,
) => {
  const startDate = rawStart === undefined ? null : parseDateOnly(rawStart);
  const endDate = rawEnd === undefined ? null : parseDateOnly(rawEnd);
  if ((rawStart !== undefined && !startDate) || (rawEnd !== undefined && !endDate)) {
    throw new ApiError("Invalid date range", 400);
  }
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
  } = (body ?? {}) as Record<string, unknown>;
  const startDate = parseDateOnly(rawStartDate);
  const endDate = parseDateOnly(rawEndDate);
  const hasValidTimes =
    isAllDay || (isValidTime(startTime) && isValidTime(endTime));
  const hasValidSameDayTimeRange =
    isAllDay ||
    rawStartDate !== rawEndDate ||
    (isValidTime(startTime) && isValidTime(endTime) && endTime > startTime);
  if (
    typeof title !== "string" ||
    !title.trim() ||
    !startDate ||
    !endDate ||
    typeof rawStartDate !== "string" ||
    typeof rawEndDate !== "string" ||
    rawStartDate < currentDateOnly() ||
    rawEndDate < rawStartDate ||
    typeof isAllDay !== "boolean" ||
    (description !== undefined && typeof description !== "string") ||
    !hasValidTimes ||
    !hasValidSameDayTimeRange
  ) {
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
  const result = await prisma.event.deleteMany({ where: { id: eventId, userId } });
  if (result.count === 0) throw new ApiError("Event not found", 404);
};
