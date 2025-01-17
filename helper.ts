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

export class CheckReq {
  constructor() {}
  checkReqBody(req: Request, fields: string[]) {
    if (req.body === undefined) {
      return "Information";
    }
    for (let entry of fields) {
      if (req.body[entry] === undefined || req.body[entry] === "") {
        return entry;
      }
    }
    return "";
  }
  uploadForm() {
    let form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      filter: (part) => part.mimetype?.startsWith("image/") || false,
    });
    return form;
  }
}

export interface ObjectAny {
  [key: string]: any;
}

export type ItemInfo = {
  item_name: string;
  price: number;
  quantity: number;
  receipt_id: number;
  item_id: string;
};

export type ClaimItemsInfo = {
  user_id: number;
  item_id: string;
};

export type TemporaryClaimSelection = {
  user_id: number;
  itemStringID: string;
  quantity: number;
};

export type Notification = {
  from: number;
  to: number;
  payment: Boolean;
  receipt_id: number;
  information: string;
};

/* type itemInfoList {
    id: integer,
    item_name: string, 
    price: decimal,
    quantity: number,
    item_id: string,
    claimerList: string
  } */

export function hasLogin(req: Request, res: Response, next: NextFunction) {
  if (req.session === undefined || req.session.user === undefined) {
    res.sendFile(path.resolve("login", "index.html"));
  } else {
    next();
  }
}
