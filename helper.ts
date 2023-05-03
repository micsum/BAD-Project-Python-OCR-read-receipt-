// Buffer Line
import session from "express-session";
import { Response, Request, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    user: {
      userName: string;
      userID: number;
    };
    receiptID: string;
  }
}

export let sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret:
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
});

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

export type ClaimItemsInfo = {
  user_id: number;
  item_id: number;
};

/* type itemInfoList {
    id: integer,
    item_name: string, 
    price: decimal,
    quantity: number,
    item_id: string,
    claimerList?: string
  } */
