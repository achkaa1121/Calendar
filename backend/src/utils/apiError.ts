import type { Response } from "express";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode = 500,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const sendControllerError = (
  res: Response,
  error: unknown,
  fallback: string,
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  return res.status(500).json({ error: fallback });
};
