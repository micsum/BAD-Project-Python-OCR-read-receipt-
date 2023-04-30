import { Request, Response, Router } from "express";
import { Server as socketIO } from "socket.io";
import { claimReceiptService } from "./claimReceiptservice";
import { wrapControllerMethod } from "./createAPI";

export class claimReceiptController {
  router = Router();
  constructor(
    private claimReceiptService: claimReceiptService,
    private io: socketIO
  ) {
    this.router.get("/", this.getReceiptItems);
  }

  getReceiptItems = async function (req: Request, res: Response) {};
}
