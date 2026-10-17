import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import { sendControllerError } from "../utils/apiError.js";
import {
  createEvent,
  listEvents,
  removeEvent,
} from "../services/eventService.js";

export const listEventsController = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(
      await listEvents(req.userId, req.query.start, req.query.end),
    );
  } catch (error) {
    return sendControllerError(res, error, "Could not load events");
  }
};

export const createEventController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const event = await createEvent(req.userId, req.body);
    return res.status(201).json(event);
  } catch (error) {
    return sendControllerError(res, error, "Could not create event");
  }
};

export const deleteEventController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    await removeEvent(req.userId, String(req.params.id ?? ""));
    return res.status(204).end();
  } catch (error) {
    return sendControllerError(res, error, "Could not delete event");
  }
};
