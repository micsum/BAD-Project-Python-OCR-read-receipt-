import { Request, Response, Router } from "express";
import { Server as socketIO } from "socket.io";
import { ReceiptItemService } from "../service/receiptItemService";
import { ItemInfo, ClaimItemsInfo } from "../routes/helper";

export class ReceiptItemController {
  router = Router();
  constructor(
    private receiptItemService: ReceiptItemService,
    private io: socketIO
  ) {
    this.router.get("/getReceiptItems/:receiptID", this.getReceiptItems);
    this.router.post("/insertReceiptItems/:receiptID", this.insertReceiptItems);
    this.router.post("/claimReceiptItems/:receiptID", this.claimReceiptItem);
    this.router.delete(
      "/resetReceiptItemClaim/:receiptID",
      this.resetReceiptItemClaim
    );
  }

  getReceiptItems = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
    }
    if (req.body === undefined || req.body !== req.params.receiptID) {
      res.status(401).json({ error: "Receipt Not Found" });
    }

    let receiptID = req.params.receiptID;
    try {
      let itemInfoList = await this.receiptItemService.getReceiptItems(
        receiptID
      );
      res.json({ itemInfoList });
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  // Redirected from create receipt route
  insertReceiptItems = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
    }
    if (
      req.body === undefined ||
      req.body.receiptID === undefined ||
      req.body.itemInfoList === undefined
    ) {
      res.status(401).json({ error: "Items Not Inserted" });
    }

    let newItemList: ItemInfo[] = [];
    for (let item of req.body.itemList) {
      let itemID = Math.random().toString(36).slice(2).substring(0, 5);
      item["receipt_id"] = req.body.receiptID;
      item["item_ID"] = itemID;
      newItemList.push(item);
    }

    try {
      await this.receiptItemService.insertReceiptItems(newItemList);
      res.json({});
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  claimReceiptItem = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    if (
      req.body === undefined ||
      req.body.receiptID === undefined ||
      req.body.itemInfoList === undefined
    ) {
      res.status(401).json({ error: "Items Not Claimed" });
    }

    let userID = req.session.user.userID;
    let receiptID = req.params.receiptID;
    let claimItems = req.body.itemList;
    try {
      let receiptItems = await this.receiptItemService.getReceiptItems(
        receiptID
      );
      const itemQuantityMap = new Map();
      for (let item of receiptItems) {
        let itemID = item.item_id;
        let claimableQuantity: number =
          item.quantity - item.claimerList.split(",").length;
        itemQuantityMap.set(item.item_name, { claimableQuantity, itemID });
      }
      for (let userClaim of claimItems) {
        if (itemQuantityMap.get(userClaim.item_name) === undefined) {
          res.json({ error: `${userClaim.item_name} is not in this receipt` });
        } else if (userClaim.quantity <= 0) {
          res.json({
            error: `Please claim a positive number of ${userClaim.item_name}`,
          });
        } else if (
          userClaim.quantity >
          itemQuantityMap.get(userClaim.item_name).claimableQuantity
        ) {
          res.json({
            error: `User may not claim more ${userClaim.item_name} than there is remaining`,
          });
        }
      }

      let receiptHostResult = await this.receiptItemService.getReceiptSender(
        receiptID
      );
      let receiptHost = receiptHostResult[0];
      let claimItemsInfo: ClaimItemsInfo[] = [];
      for (let item of claimItems) {
        let itemID: number = itemQuantityMap.get(item.itemName);
        claimItemsInfo.push({
          user_id: userID,
          item_id: itemID,
        });
      }
      await this.receiptItemService.claimReceiptItems(
        claimItemsInfo,
        req.params.receiptID,
        receiptHost,
        req.session.user.userID,
        req.session.user.userName
      );

      this.io.to(receiptHost.toString()).emit("claimNotification", {
        userName: req.session.user.userName,
      });
      this.io.to(receiptID).emit("claimItem", claimItemsInfo);
      res.json({});
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  resetReceiptItemClaim = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    if (
      req.body === undefined ||
      req.body.receiptID === undefined ||
      req.body.item === undefined
    ) {
      res.status(401).json({ error: "Receipt Items Not Found" });
      return;
    }
    try {
      let receiptID = req.params.receiptID;
      let [{ from }] = await this.receiptItemService.getReceiptSender(
        receiptID
      );

      if (from !== req.session.user.userID) {
        res.status(401).json({ error: "Not the sender of the receipt" });
      }

      await this.receiptItemService.removeItemClaims(req.body.item);
      res.json({});
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };
}
