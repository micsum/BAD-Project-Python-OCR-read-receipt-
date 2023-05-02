// Buffer Line
import session from "express-session";
import { Response, Request, NextFunction } from "express";

export interface ObjectAny {
  [key: string]: any;
}

export type ItemInfo = {
  item_name: string;
  price: number;
  quantity: number;
  receipt_id: string;
  item_id: string;
};

declare module "express-session" {
  interface SessionData {
    userID: number;
    receiptID: string;
  }
}

export let sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret:
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
});
