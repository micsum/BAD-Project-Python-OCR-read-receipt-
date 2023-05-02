import { Request, Response, Router } from "express";
import { Server as socketIO } from "socket.io";
import { receiptItemService } from "./receiptItemService";
import { ObjectAny, ItemInfo } from "./helper";

export class receiptItemController implements ObjectAny {
  router = Router();
  constructor(
    private receiptItemService: receiptItemService,
    private io: socketIO
  ) {
    this.router.get("/getReceiptItems/:receiptID", this.getReceiptItems);
    this.router.get("/insertReceiptItems/:receiptID", this.insertReceiptItems);
  }

  /* type itemInfoList {
    id: integer,
    item_name: string, 
    price: decimal,
    quantity: number,
    item_id: string,
    claimerList?: string
  } */

  getReceiptItems = async (req: Request, res: Response) => {
    if (req.session === undefined || req.session.userID === undefined) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }
    if (req.body === undefined || req.body !== req.params.receiptID) {
      res.status(401).json({ error: "Receipt Not Found" });
      return;
    }

    let receiptID = req.params.receiptID;
    try {
      let itemInfoList = await this.receiptItemService.getReceiptItems(
        receiptID
      );
      res.json({ itemInfoList });
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  // Redirected from create receipt route
  insertReceiptItems = async (req: Request, res: Response) => {
    if (req.session === undefined || req.session.userID === undefined) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }
    if (
      req.body === undefined ||
      req.body.receiptID === undefined ||
      req.body.itemList === undefined
    ) {
      res.status(401).json({ error: "Items Not Inserted" });
      return;
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
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  claimReceiptItem = async (req: Request, res: Response) => {
    if (req.session === undefined || req.session.userID === undefined) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    if (
      req.body === undefined ||
      req.body.receiptID === undefined ||
      req.body.itemList === undefined
    ) {
      res.status(401).json({ error: "Items Not Claimed" });
      return;
    }

    let userID = req.session.userID;
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
          return;
        } else if (userClaim.quantity <= 0) {
          res.json({
            error: `Please claim a positive number of ${userClaim.item_name}`,
          });
          return;
        } else if (
          userClaim.quantity >
          itemQuantityMap.get(userClaim.item_name).claimableQuantity
        ) {
          res.json({
            error: `User may not claim more ${userClaim.item_name} than there is remaining`,
          });
          return;
        }
      }
      for (let item of claimItems) {
        let itemID = itemQuantityMap.get(item.itemName);
        await this.receiptItemService.claimReceiptItems({
          user_id: userID,
          item_id: itemID,
        });
        this.io.to(receiptID).emit("claimItem", { itemID, userID });
      }
      res.json({});
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };
}
