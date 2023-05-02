import { Request, Response, Router } from "express";
import { Server as socketIO } from "socket.io";
import { claimReceiptService } from "./claimReceiptService";
import { HttpController } from "./createAPI";
import { io } from "./main";
import { Server } from "http";

export class claimReceiptController extends HttpController {
  router = Router();
  constructor(
    private claimReceiptService: claimReceiptService,
    private io: socketIO
  ) {
    super();
    this.router.get(
      "/getReceipt/:receiptID",
      this.wrapController(this.getReceiptItems)
    );
  }

  // route : /getReceipt/:receiptID
  getReceiptItems = async (req: Request) => {
    /*
    if (
      req.session === undefined ||
      req.session.userName === undefined ||
      req.session.receiptID === undefined
    ) {
      res.status(401).json({ error: "Not found" });
      return;
    }
    */
    let userName = req.session.userName;
    let receiptID = req.params.receiptID;
  };
}
