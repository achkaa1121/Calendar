import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import apiRouter from "./routes/indexRouter.js";
import { frontendOrigin } from "./config/serverConfig.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api", apiRouter);
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Server is running successfully!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
console.log();
