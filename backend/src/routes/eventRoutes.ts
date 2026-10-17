import { Router } from "express";
import { verifyAuth } from "../middlewares/authMiddleware.js";
import {
  createEventController,
  deleteEventController,
  listEventsController,
} from "../controllers/eventController.js";

const eventRouter = Router();
eventRouter.use(verifyAuth);

eventRouter.get("/", listEventsController);
eventRouter.post("/", createEventController);
eventRouter.delete("/:id", deleteEventController);

export default eventRouter;
