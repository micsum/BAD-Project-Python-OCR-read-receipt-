import { Request, Response, Router } from "express";
import { Server as socketIO } from "socket.io";
import { ClaimReceiptItemService } from "../service/claimReceiptItemService";
import { ClaimItemsInfo } from "../../helper";
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
      res.json(
        await this.claimReceiptItemService.checkReceiptClaimStatus(receiptID)
      );
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

    let userID = req.session.user.userID;
    let userName = req.session.user.userName;
    let receiptID = req.params.receiptID;
    try {
      let itemInfoListResult =
        await this.claimReceiptItemService.getReceiptItems(receiptID);

      if (
        itemInfoListResult.error ||
        itemInfoListResult.receiptItems === undefined
      ) {
        res.json(itemInfoListResult);
        return;
      }

      let itemInfoList = itemInfoListResult.receiptItems;
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

    if (req.body === undefined || req.body.itemList === undefined) {
      res.status(401).json({ error: "ItemList Not Received" });
      return;
    }

    let userID = req.session.user.userID;
    let receiptID = req.params.receiptID;
    let claimItems = req.body.itemList;
    try {
      let result = await this.claimReceiptItemService.checkReceiptClaimStatus(
        receiptID
      );
      if (result.error) {
        res.json(result);
        return;
      }
      if (result.receiptStatus) {
        res.json({ error: "This Receipt is Closed for Selections" });
      }
      let receiptItemsResult =
        await this.claimReceiptItemService.getReceiptItems(receiptID);

      if (
        receiptItemsResult.error ||
        receiptItemsResult.receiptItems === undefined
      ) {
        res.json(receiptItemsResult);
        return;
      }
      console.log("running 1");
      let receiptItems = receiptItemsResult.receiptItems;
      const itemQuantityMap = new Map();
      for (let item of receiptItems) {
        let itemStringID = item.item_id;
        let claimedUsers = item.claimerList.split(",").length;
        claimedUsers = claimedUsers[0] === undefined ? 0 : 1;
        let claimableQuantity: number = item.quantity - claimedUsers;
        itemQuantityMap.set(itemStringID, {
          claimableQuantity: claimableQuantity,
          itemName: item.item_name,
        });
      }
      console.log(`receiptItems = ${receiptItems}`);
      for (let userClaim of claimItems) {
        if (itemQuantityMap.get(userClaim.item_id) === undefined) {
          res.json({ error: `This Item is not in this receipt` });
          return;
        } else if (userClaim.quantity <= 0) {
          res.json({
            error: `Please claim a positive number of ${
              itemQuantityMap.get(userClaim.item_id).itemName
            }`,
          });
          return;
        } else if (
          userClaim.quantity >
          itemQuantityMap.get(userClaim.item_id).claimableQuantity
        ) {
          res.json({
            error: `User may not claim more ${
              itemQuantityMap.get(userClaim.item_id).itemName
            } than there is remaining`,
          });
          return;
        }
      }
      console.log("passed claim checking");
      let newResult = await this.claimReceiptItemService.getReceiptSender(
        receiptID
      );
      if (newResult.error) {
        res.json(newResult);
        return;
      }
      let receiptHost = newResult.from;

      try {
        let result = await this.claimReceiptItemService.claimReceiptItems(
          claimItems,
          req.params.receiptID,
          receiptHost,
          req.session.user.userID,
          req.session.user.userName
        );

        if (result.error) {
          res.json(result);
          return;
        }
      } catch (error) {
        console.log(error);
        res.json(error);
      }

      removeTempClaim(claimItems);

      this.io.to(receiptHost.toString()).emit("claimNotification", {
        userName: req.session.user.userName,
      });
      this.io.to(receiptID).emit("claimItem");
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
      let result = await this.claimReceiptItemService.getReceiptSender(
        receiptID
      );
      if (result.error) {
        res.json(result);
        return;
      }

      if (result.from !== req.session.user.userID) {
        res.status(401).json({ error: "Not the sender of the receipt" });
      }

      await this.claimReceiptItemService.removeItemClaims(req.body.item);
      this.io.to(receiptID).emit("claimItem");
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
      let result = await this.claimReceiptItemService.getReceiptSender(
        receiptStringID
      );

      if (result.error) {
        res.json(result);
        return;
      }

      if (result.from !== req.session.user.userID) {
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
      let result = await this.claimReceiptItemService.getReceiptSender(
        receiptStringID
      );
      if (result.error) {
        res.json(result);
        return;
      }
      if (result.from !== userID) {
        res.status(401).json({ error: "Not the sender of the receipt" });
      }

      await this.claimReceiptItemService.hostAcceptAllPayment(receiptStringID);
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };
}
