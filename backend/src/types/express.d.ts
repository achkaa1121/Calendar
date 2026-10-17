import "express";

declare global {
  namespace Express {
    interface Request {
      userId: string; // Guaranteed string after auth middleware
      requestId?: string; // Useful for log tracing across requests
    }
  }
}

// Optional: If you want to declare global app config or custom types
export {};
