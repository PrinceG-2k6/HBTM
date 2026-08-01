import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hbtm_agentic_ai_curator_secret_key_2026_super_secure";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // If no token is provided, proceed optionally with default mock user ID
    req.userId = "usr-default-aspirant";
    req.userEmail = "aspirant@pacer.ai";
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      req.userId = "usr-default-aspirant";
      req.userEmail = "aspirant@pacer.ai";
      next();
      return;
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  });
};
