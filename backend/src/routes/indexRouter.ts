import { Router } from "express";
import authRouter from "./authRoutes.js";
import eventRouter from "./eventRoutes.js";
import taskRouter from "./taskRoutes.js";
import birthdayRouter from "./birthdayRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/birthdays", birthdayRouter);

export default apiRouter;
