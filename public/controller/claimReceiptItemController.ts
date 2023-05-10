import { Request, Response, Router } from "express";
import { Server as socketIO } from "socket.io";
import { ClaimReceiptItemService } from "../service/claimReceiptItemService";
import { ClaimItemsInfo } from "../routes/helper";
import { temporarySelections, removeTempClaim } from "./displayController";

export class ClaimReceiptItemController {
  router = Router();
  constructor(
    private claimReceiptItemService: ClaimReceiptItemService,
    private io: socketIO
  ) {
    this.router.get(
      "/getReceiptClaimConfirmStatus/:receiptID",
      this.getReceiptClaimConfirmStatus
    );
    this.router.get("/getReceiptItems/:receiptID", this.getReceiptItems);
    this.router.post("/claimReceiptItems/:receiptID", this.claimReceiptItem);
    this.router.delete(
      "/resetReceiptItemClaim/:receiptID",
      this.resetReceiptItemClaim
    );
    this.router.put("/hostConfirmClaim/:receiptID", this.hostConfirmClaim);
    this.router.post("/respondPayMessage", this.respondPayMessage);
  }

  getReceiptClaimConfirmStatus = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined ||
      req.session.user.userName === undefined
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    try {
      let receiptID = req.params.receiptID;
      res.json({
        receiptStatus:
          await this.claimReceiptItemService.checkReceiptClaimStatus(receiptID),
      });
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  getReceiptItems = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined ||
      req.session.user.userName === undefined
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    if (req.body === undefined || req.body !== req.params.receiptID) {
      res.status(401).json({ error: "Receipt Not Found" });
    }

    let userID = req.session.user.userID;
    let userName = req.session.user.userName;
    let receiptID = req.params.receiptID;
    try {
      let itemInfoList = await this.claimReceiptItemService.getReceiptItems(
        receiptID
      );

      const tempClaimMap = new Map();
      for (let tempClaim of temporarySelections) {
        if (tempClaim.user_id === userID) {
          tempClaimMap.set(tempClaim.itemStringID, tempClaim.quantity);
        }
      }

      for (let item of itemInfoList) {
        let itemClaimerList = item.claimerList.split(",");
        itemClaimerList = itemClaimerList.map((elem: string) => {
          return elem.trim();
        });
        if (itemClaimerList.indexOf(userName) !== -1) {
          let originalLength = itemClaimerList.length;
          let filteredList = itemClaimerList.filter((elem: string) => {
            return elem !== userName;
          });

          let itemQuantity = originalLength - filteredList.length;
          temporarySelections.push({
            user_id: userID,
            itemStringID: item.item_id,
            quantity: itemQuantity,
          });
        }
      }
      res.json({ itemInfoList });
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

    if (req.body === undefined || req.body.itemInfoList === undefined) {
      res.status(401).json({ error: "ItemList Not Received" });
    }

    let userID = req.session.user.userID;
    let receiptID = req.params.receiptID;
    let claimItems = req.body.itemList;
    try {
      if (
        await this.claimReceiptItemService.checkReceiptClaimStatus(receiptID)
      ) {
        res.json({ error: "This Receipt is Closed for Selections" });
      }
      let receiptItems = await this.claimReceiptItemService.getReceiptItems(
        receiptID
      );
      const itemQuantityMap = new Map();
      for (let item of receiptItems) {
        let itemStringID = item.item_id;
        let claimableQuantity: number =
          item.quantity - item.claimerList.split(",").length;
        itemQuantityMap.set(item.item_name, {
          claimableQuantity,
          itemStringID,
        });
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

      let receiptHostResult =
        await this.claimReceiptItemService.getReceiptSender(receiptID);
      let receiptHost = receiptHostResult[0];
      let claimItemsInfo: ClaimItemsInfo[] = [];
      for (let item of claimItems) {
        let itemStringID: string = itemQuantityMap.get(item.itemName);
        for (let i = 0; i < item.quantity; i++) {
          claimItemsInfo.push({
            user_id: userID,
            item_id: itemStringID,
          });
        }
      }
      try {
        await this.claimReceiptItemService.claimReceiptItems(
          claimItemsInfo,
          req.params.receiptID,
          receiptHost,
          req.session.user.userID,
          req.session.user.userName
        );
      } catch (error) {
        console.log(error);
        res.json(error);
      }

      removeTempClaim(claimItemsInfo);

      this.io.to(receiptHost.toString()).emit("claimNotification", {
        userName: req.session.user.userName,
      });
      this.io.to(receiptID).emit("claimItem", {
        claimItemInfo: req.body.itemList,
        claimUserName: req.session.user.userName,
      });
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

    if (req.body === undefined || req.body.item === undefined) {
      res.status(401).json({ error: "Receipt Items Not Found" });
      return;
    }
    try {
      let receiptID = req.params.receiptID;
      let [{ from }] = await this.claimReceiptItemService.getReceiptSender(
        receiptID
      );

      if (from !== req.session.user.userID) {
        res.status(401).json({ error: "Not the sender of the receipt" });
      }

      await this.claimReceiptItemService.removeItemClaims(req.body.item);
      res.json({});
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  hostConfirmClaim = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    try {
      let receiptStringID = req.params.receiptID;
      let [{ from }] = await this.claimReceiptItemService.getReceiptSender(
        receiptStringID
      );

      if (from !== req.session.user.userID) {
        res.status(401).json({ error: "Not the sender of the receipt" });
      }

      let information = `${req.session.user.userName}(host) has confirmed the claims, please pay !`;
      await this.claimReceiptItemService.broadcastConfirmClaim(
        req.session.user.userID,
        information,
        receiptStringID
      );
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  respondPayMessage = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    if (req.body === undefined || req.body.creditMode === undefined) {
      res.json({ error: "Pay Method Not Specified" });
    }

    try {
      let userID = req.session.user.userID;
      let receiptID = req.body.receiptID;
      let creditMode: Boolean = req.body.creditMode;

      let userFound =
        await this.claimReceiptItemService.retrieveReceiptRecipient(
          receiptID,
          userID
        );

      if (!userFound) {
        res.json({
          error: "User was not Invited to Claim Items in this Receipt",
        });
      }

      let result = await this.claimReceiptItemService.respondPayMessage(
        userID,
        receiptID,
        creditMode
      );
      res.json(result);
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  hostAcceptAllPayment = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    try {
      let userID = req.session.user.userID;
      let receiptStringID = req.params.receiptID;

      let [{ from }] = await this.claimReceiptItemService.getReceiptSender(
        receiptStringID
      );
      if (from !== userID) {
        res.status(401).json({ error: "Not the sender of the receipt" });
      }

      await this.claimReceiptItemService.hostAcceptAllPayment(receiptStringID);
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };
}
