import { Request, Response, NextFunction } from "express";

export function wrapControllerMethod(
  fn: (req: Request) => Object | Promise<Object>
) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      let json = await fn(req);
      res.json(json);
    } catch (error) {
      next(error);
    }
  };
}
