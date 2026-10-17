import { prisma } from "../prisma.js";
import { ApiError } from "../utils/apiError.js";
import {
  currentDateOnly,
  formatDateOnly,
  parseDateOnly,
} from "../utils/dateOnly.js";
import {
  normalizeRecurrenceRule,
  recurrenceOccursOnDate,
} from "../utils/recurrenceRule.js";

const isValidTime = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value));

const serializeTask = <T extends { dueDate: Date | null }>(task: T) => ({
  ...task,
  dueDate: task.dueDate ? formatDateOnly(task.dueDate) : null,
});

export const listTasks = async (userId: string) => {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { title: "asc" }],
  });
  return tasks.map(serializeTask);
};

export const createTask = async (userId: string, body: unknown) => {
  const {
    title,
    dueDate,
    startTime,
    dueTime,
    recurrenceRule: rawRecurrenceRule,
  } = (body ?? {}) as Record<string, unknown>;
  const parsedDueDate = dueDate === null || dueDate === undefined
    ? null
    : parseDateOnly(dueDate);

  if (
    typeof title !== "string" ||
    !title.trim() ||
    (dueDate !== undefined && dueDate !== null && !parsedDueDate) ||
    (typeof dueDate === "string" && dueDate < currentDateOnly()) ||
    !isValidTime(startTime) ||
    !isValidTime(dueTime) ||
    (typeof startTime === "string" &&
      typeof dueTime === "string" &&
      dueTime <= startTime)
  ) {
    throw new ApiError("Invalid task details", 400);
  }
  const recurrenceRule = normalizeRecurrenceRule(
    rawRecurrenceRule,
    parsedDueDate ? formatDateOnly(parsedDueDate) : "",
  );
  if (recurrenceRule && !parsedDueDate) {
    throw new ApiError("Recurring tasks need a due date", 400);
  }
  const task = await prisma.task.create({
    data: {
      userId,
      title: title.trim(),
      dueDate: parsedDueDate,
      startTime: typeof startTime === "string" ? startTime : null,
      dueTime: typeof dueTime === "string" ? dueTime : null,
      recurrenceRule,
    },
  });
  return serializeTask(task);
};

export const setTaskCompletion = async (
  userId: string,
  taskId: string,
  value: unknown,
  occurrenceDate: unknown,
) => {
  if (typeof value !== "boolean") {
    throw new ApiError("isCompleted must be a boolean", 400);
  }
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new ApiError("Task not found", 404);

  if (task.recurrenceRule) {
    const parsedOccurrenceDate = parseDateOnly(occurrenceDate);
    if (
      typeof occurrenceDate !== "string" ||
      !parsedOccurrenceDate ||
      !task.dueDate ||
      !recurrenceOccursOnDate(
        formatDateOnly(task.dueDate),
        occurrenceDate,
        task.recurrenceRule,
      )
    ) {
      throw new ApiError("Invalid task occurrence date", 400);
    }
    const completedDates = new Set(task.completedDates);
    if (value) completedDates.add(occurrenceDate);
    else completedDates.delete(occurrenceDate);
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { completedDates: [...completedDates].sort() },
    });
    return serializeTask(updatedTask);
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: value },
  });
  return serializeTask(updatedTask);
};

export const removeTask = async (userId: string, taskId: string) => {
  const result = await prisma.task.deleteMany({ where: { id: taskId, userId } });
  if (result.count === 0) throw new ApiError("Task not found", 404);
};
