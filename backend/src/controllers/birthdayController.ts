import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import { createBirthday, listBirthdays, removeBirthday } from "../services/birthdayService.js";
import { sendControllerError } from "../utils/apiError.js";

export const listBirthdaysController = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await listBirthdays(req.userId));
  } catch (error) {
    return sendControllerError(res, error, "Could not load birthdays");
  }
};

export const createBirthdayController = async (req: AuthRequest, res: Response) => {
  try {
    return res.status(201).json(await createBirthday(req.userId, req.body));
  } catch (error) {
    return sendControllerError(res, error, "Could not create birthday");
  }
};

export const deleteBirthdayController = async (req: AuthRequest, res: Response) => {
  try {
    await removeBirthday(req.userId, String(req.params.id ?? ""));
    return res.status(204).end();
  } catch (error) {
    return sendControllerError(res, error, "Could not delete birthday");
  }
};
