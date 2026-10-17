import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/authConfig.js";

export interface AuthRequest extends Request {
  query: any;
  body(userId: string, body: any): unknown;
  params: any;
  userId: string;
}

export const verifyAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!token) {
      throw Error("Unauthorized!");
    }
    const decoded = jwt.verify(token, jwtSecret) as unknown as {
      userId: string;
    };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
