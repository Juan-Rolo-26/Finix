import { Request, Response } from 'express';
export declare const getKPIs: (req: Request, res: Response) => Promise<void>;
export declare const getUsers: (req: Request, res: Response) => Promise<void>;
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
export declare const getPosts: (req: Request, res: Response) => Promise<void>;
export declare const updatePost: (req: Request, res: Response) => Promise<void>;
export declare const getReports: (req: Request, res: Response) => Promise<void>;
export declare const resolveReport: (req: Request, res: Response) => Promise<void>;
export declare const getAuditLogs: (req: Request, res: Response) => Promise<void>;
