import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import {
  createTask,
  listTasks,
  removeTask,
  setTaskCompletion,
} from "../services/taskService.js";
import { sendControllerError } from "../utils/apiError.js";

export const listTasksController = async (req: AuthRequest, res: Response) => {
  try {   
    return res.json(await listTasks(req.userId));
  } catch (error) {
    return sendControllerError(res, error, "Could not load tasks");
  }
};

export const createTaskController = async (req: AuthRequest, res: Response) => {
  try {
    return res.status(201).json(await createTask(req.userId, req.body));
  } catch (error) {
    return sendControllerError(res, error, "Could not create task");
  }
};

export const updateTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as {
      isCompleted?: unknown;
      occurrenceDate?: unknown;
    } | undefined;
    return res.json(
      await setTaskCompletion(
        req.userId,
        String(req.params.id ?? ""),
        body?.isCompleted,
        body?.occurrenceDate,
      ),
    );
  } catch (error) {
    return sendControllerError(res, error, "Could not update task");
  }
};

export const deleteTaskController = async (req: AuthRequest, res: Response) => {
  try {
    await removeTask(req.userId, String(req.params.id ?? ""));
    return res.status(204).end();
  } catch (error) {
    return sendControllerError(res, error, "Could not delete task");
  }
};
