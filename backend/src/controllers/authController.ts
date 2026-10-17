import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/authService.js";
import { sendControllerError } from "../utils/apiError.js";

export const registerController = async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof name !== "string" ||
    !email.trim() ||
    !password ||
    !name.trim()
  ) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  try {
    return res.status(201).json(await registerUser(email, password, name));
  } catch (error) {
    return sendControllerError(res, error, "Registration failed");
  }
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    return res.json(await loginUser(email, password));
  } catch (error) {
    return sendControllerError(res, error, "Login failed");
  }
};
