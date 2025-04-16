import { Request, Response, NextFunction } from 'express';

export type RouteHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void | Response> | void | Response;
