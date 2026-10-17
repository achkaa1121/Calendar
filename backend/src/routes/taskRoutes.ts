import { Router } from "express";
import { verifyAuth } from "../middlewares/authMiddleware.js";
import {
  createTaskController,
  deleteTaskController,
  listTasksController,
  updateTaskController,
} from "../controllers/taskController.js";

const taskRouter = Router();
taskRouter.use(verifyAuth);

taskRouter.get("/", listTasksController);
taskRouter.post("/", createTaskController);
taskRouter.patch("/:id", updateTaskController);
taskRouter.delete("/:id", deleteTaskController);

export default taskRouter;
