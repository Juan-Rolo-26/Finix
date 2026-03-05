import { Request, Response, NextFunction } from 'express';
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
