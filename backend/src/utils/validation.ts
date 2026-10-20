import { z } from "zod";
import { ApiError } from "./apiError.js";
import { parseDateOnly } from "./dateOnly.js";

const dateOnly = z.string().refine((value) => parseDateOnly(value) !== null, {
  message: "Expected a valid date in YYYY-MM-DD format",
});
const timeOnly = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Expected a time in HH:mm format");
const optionalRecurrence = z.string().max(100).nullable().optional();

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  startDate: dateOnly,
  endDate: dateOnly,
  startTime: timeOnly.optional(),
  endTime: timeOnly.optional(),
  isAllDay: z.boolean().optional().default(false),
  recurrenceRule: optionalRecurrence,
}).superRefine((event, context) => {
  if (event.endDate < event.startDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after start date" });
  }
  if (event.isAllDay) return;
  if (!event.startTime) {
    context.addIssue({ code: "custom", path: ["startTime"], message: "Start time is required" });
  }
  if (!event.endTime) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "End time is required" });
  }
  if (event.startDate === event.endDate && event.startTime && event.endTime && event.endTime <= event.startTime) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time" });
  }
});

export const eventRangeSchema = z.object({
  start: dateOnly.optional(),
  end: dateOnly.optional(),
}).superRefine((range, context) => {
  if (range.start && range.end && range.start > range.end) {
    context.addIssue({ code: "custom", path: ["end"], message: "Range end must be on or after range start" });
  }
});

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueDate: dateOnly.nullable().optional(),
  startTime: timeOnly.nullable().optional(),
  dueTime: timeOnly.nullable().optional(),
  recurrenceRule: optionalRecurrence,
}).superRefine((task, context) => {
  if (task.startTime && task.dueTime && task.dueTime <= task.startTime) {
    context.addIssue({ code: "custom", path: ["dueTime"], message: "Due time must be after start time" });
  }
});

export const taskCompletionSchema = z.object({
  isCompleted: z.boolean(),
  occurrenceDate: dateOnly.optional(),
});

export const birthdaySchema = z.object({
  name: z.string().trim().min(1).max(100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  birthYear: z.number().int().min(1).max(new Date().getFullYear()).nullable().optional(),
}).superRefine((birthday, context) => {
  const daysInMonth = new Date(Date.UTC(2000, birthday.month, 0)).getUTCDate();
  if (birthday.day > daysInMonth) {
    context.addIssue({ code: "custom", path: ["day"], message: "Day is not valid for the selected month" });
  }
});

export const idSchema = z.string().uuid();

export const parseInput = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`);
    throw new ApiError(`Invalid request (${details.join("; ")})`, 400);
  }
  return result.data;
};
