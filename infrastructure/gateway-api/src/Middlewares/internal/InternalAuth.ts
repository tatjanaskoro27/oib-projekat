import { Request, Response, NextFunction } from "express";

export function internalAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-internal-key");
  if (!process.env.INTERNAL_API_KEY || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized internal request" });
    return;
  }
  next();
}
