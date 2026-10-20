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
import { idSchema, parseInput, taskCompletionSchema, taskSchema } from "../utils/validation.js";

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
  } = parseInput(taskSchema, body);
  const parsedDueDate = dueDate === null || dueDate === undefined
    ? null
    : parseDateOnly(dueDate);

  if ((typeof dueDate === "string" && !parsedDueDate) || (typeof dueDate === "string" && dueDate < currentDateOnly())) {
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
  taskId = parseInput(idSchema, taskId);
  const input = parseInput(taskCompletionSchema, { isCompleted: value, occurrenceDate });
  const isCompleted = input.isCompleted;
  occurrenceDate = input.occurrenceDate;
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
    if (isCompleted) completedDates.add(occurrenceDate);
    else completedDates.delete(occurrenceDate);
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { completedDates: [...completedDates].sort() },
    });
    return serializeTask(updatedTask);
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted },
  });
  return serializeTask(updatedTask);
};

export const removeTask = async (userId: string, taskId: string) => {
  taskId = parseInput(idSchema, taskId);
  const result = await prisma.task.deleteMany({ where: { id: taskId, userId } });
  if (result.count === 0) throw new ApiError("Task not found", 404);
};
