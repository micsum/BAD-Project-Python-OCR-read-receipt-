// Buffer Line
import { Request, Response, Router } from "express";
import { DisplayService } from "../service/displayService";
import {
  TemporaryClaimSelection,
  ClaimItemsInfo,
  CheckReq,
} from "../routes/helper";

export let temporarySelections: TemporaryClaimSelection[] = [];
export function removeTempClaim(itemList: ClaimItemsInfo[]) {
  for (let item of itemList) {
    temporarySelections = temporarySelections.filter(function (elem) {
      return elem.itemStringID != item.item_id && elem.user_id != item.user_id;
    });
  }
}

export class DisplayController extends CheckReq {
  router = Router();
  constructor(private displayService: DisplayService) {
    super();
    this.router.get("/getUserID", this.getUserID);
    this.router.post("getTempClaim", this.getTempClaim);
    this.router.put("/updateItemQuantity", this.updateItemQuantity);
    this.router.delete("/removeTempClaim", this.removeTempClaim);

    this.router.get("/getNotifications", this.getNotifications);
  }

  getUserID = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined ||
      req.session.user.userName === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    if (req.body === undefined || req.body.receiptID === undefined) {
      res.json({ error: "Insufficient Information Submitted" });
    }

    try {
      let userID = req.session.user.userID;
      let receiptStringID = req.body.receiptID;

      let userFound = await this.displayService.retrieveReceiptRecipient(
        receiptStringID,
        userID
      );

      if (userFound) {
        res.json({
          userID: userID,
          userName: req.session.user.userName,
        });
      } else {
        res.json({
          error: "User was not Invited to Claim Items in this Receipt",
        });
      }
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  getTempClaim = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    if (req.body === undefined || req.body.itemList === undefined) {
      res.json({ error: "Missing ItemList" });
    }

    let userID = req.session.user.userID;
    let itemStringList = req.body.itemStringList;
    let userClaimRecord = temporarySelections.filter((elem) => {
      return (
        elem.user_id === userID &&
        itemStringList.indexOf(elem.itemStringID) !== -1
      );
    });
    return userClaimRecord;
  };

  addNewTempClaim = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    let missingField = super.checkReqBody(req, [
      "itemStringID",
      "quantity",
      "user_id",
    ]);

    if (missingField !== "") {
      res.json({ error: `Missing ${missingField}` });
    }

    let { itemStringID, quantity, user_id } = req.body;
    if (
      typeof itemStringID !== "string" ||
      typeof quantity !== "number" ||
      typeof user_id !== "number" ||
      quantity < 1 ||
      user_id < 0
    ) {
      res.json({ error: "Wrong Data Input for Claiming Item" });
    }

    let claimInfo = {
      user_id: user_id,
      itemStringID: itemStringID,
      quantity: quantity,
      addition: true,
    };

    temporarySelections.push(claimInfo);
    res.json({});
  };

  updateItemQuantity = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    let missingField = super.checkReqBody(req, [
      "itemStringID",
      "quantity",
      "user_id",
    ]);
    if (missingField !== "") {
      res.json({ error: `Missing ${missingField}` });
    }

    let { itemStringID, quantity, user_id } = req.body;

    let updated = false;
    for (let tempClaim of temporarySelections) {
      if (
        tempClaim.itemStringID === itemStringID &&
        tempClaim.user_id === user_id
      ) {
        tempClaim.quantity = quantity;
        updated = !updated;
        break;
      }
    }
    res.json(updated ? {} : { error: "Claim Record Not Found" });
  };

  removeTempClaim = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    let missingField = super.checkReqBody(req, ["itemStringID", "user_id"]);
    if (missingField !== "") {
      res.json({ error: `Missing ${missingField}` });
    }

    let { itemStringID, user_id } = req.body;

    let deleted = false;

    for (let tempClaim of temporarySelections) {
      if (
        tempClaim.itemStringID === itemStringID &&
        tempClaim.user_id === user_id
      ) {
        temporarySelections.splice(temporarySelections.indexOf(tempClaim), 1);
        deleted = !deleted;
        break;
      }
    }

    if (!deleted) {
      res.json({ error: "Claim Record Not Found" });
    }
    res.json({});
  };

  getNotifications = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    let userID = req.session.user.userID;
    try {
      let notificationResult = await this.displayService.getNotifications(
        userID
      );

      let secondParty: number[] = [];
      for (let notification of notificationResult) {
        if (secondParty.indexOf(notification.from) == -1) {
          secondParty.push(notification.from);
        } else if (secondParty.indexOf(notification.to) == -1) {
          secondParty.push(notification.to);
        }
      }

      let userNameResult = await this.displayService.getUserName(secondParty);
      const userIDNameMap = new Map();
      for (let userName of userNameResult) {
        userIDNameMap.set(userName.id, userName.name);
      }

      for (let notification of notificationResult) {
        notification.from = userIDNameMap.get(notification.from);
        notification.to = userIDNameMap.get(notification.to);
      }
      res.json({ notifications: notificationResult });
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  };
}
