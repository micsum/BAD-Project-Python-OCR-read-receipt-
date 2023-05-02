import { Request, Response, NextFunction } from "express";

export class HttpController {
  wrapController(fn: (req: Request) => Object | Promise<Object>) {
    return async function (req: Request, res: Response, next: NextFunction) {
      try {
        let json = await fn(req);
        res.json(json);
      } catch (error) {
        next(error);
      }
    };
  }
}
