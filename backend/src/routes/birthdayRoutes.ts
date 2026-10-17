import { Router } from "express";
import { verifyAuth } from "../middlewares/authMiddleware.js";
import {
  createBirthdayController,
  deleteBirthdayController,
  listBirthdaysController,
} from "../controllers/birthdayController.js";

const birthdayRouter = Router();
birthdayRouter.use(verifyAuth);

birthdayRouter.get("/", listBirthdaysController);
birthdayRouter.post("/", createBirthdayController);
birthdayRouter.delete("/:id", deleteBirthdayController);

export default birthdayRouter;
