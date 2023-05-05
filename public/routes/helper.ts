// Buffer Line
import session from "express-session";
import { Response, Request, NextFunction } from "express";
import fs from "fs";
import path from "path";
import formidable from "formidable";

declare module "express-session" {
  interface SessionData {
    user: {
      userName: string;
      userID: number;
      isLogin: Boolean;
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

export let uploadDir = path.join("uploads", "attachment");
fs.mkdirSync(path.join(__dirname, uploadDir), { recursive: true });
export let form = formidable({
  uploadDir,
  keepExtensions: true,
  maxFileSize: 5 * 1024 * 1024,
  filter: (part) => part.mimetype?.startsWith("image/") || false,
});

export let getUserID = async (req: Request, res: Response) => {
  if (
    req.session === undefined ||
    req.session.user === undefined ||
    req.session.user.userID ||
    req.session.user.isLogin === false
  ) {
    res.json({ error: "Please Login" });
    return;
  }
  return req.session.user.userID;
};

export class CheckReqBody {
  constructor() {}
  checkReqBody(req: Request, fields: string[]) {
    if (req.body === undefined) {
      return "Information";
    }
    for (let entry in fields) {
      if (req.body[entry] === undefined) {
        return entry;
      }
    }
    return "";
  }
}

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

export type TemporaryClaimSelection = {
  user_id: number;
  itemStringID: string;
  quantity: number;
};

/* type itemInfoList {
    id: integer,
    item_name: string, 
    price: decimal,
    quantity: number,
    item_id: string,
    claimerList?: string
  } */
