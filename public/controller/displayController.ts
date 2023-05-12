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
    this.router.post("/getUserID", this.getUserID);
    this.router.get("/getUserName", this.getUserName);
    this.router.post("/getTempClaim", this.getTempClaim);
    this.router.put("/updateItemQuantity", this.updateItemQuantity);
    this.router.delete("/removeTempClaim", this.removeTempClaim);
    this.router.post("/addTempClaim", this.addNewTempClaim);
    this.router.get("/getNotifications", this.getNotifications);
  }

  getUserName = async (req: Request, res: Response) => {
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

    res.json({
      userID: req.session.user.userID,
      userName: req.session.user.userName,
    });
  };

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

    try {
      let userID = req.session.user.userID;
      let receiptStringID = req.body.receiptID;

      let userFoundResult = await this.displayService.retrieveReceiptRecipient(
        receiptStringID,
        userID
      );

      if (userFoundResult.error) {
        res.json(userFoundResult);
      } else {
        res.json({
          userID: userID,
          userName: req.session.user.userName,
          receiptHost: userFoundResult.receiptHost,
        });
      }
    } catch (error) {
      console.log(error);
      res.json(error);
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

    if (req.body === undefined || req.body.itemStringIDList === undefined) {
      res.json({ error: "Missing ItemList" });
    }

    let userID = req.session.user.userID;
    let itemStringIDList = req.body.itemStringIDList;
    let userClaimRecord = temporarySelections.filter((elem) => {
      return (
        elem.user_id === userID &&
        itemStringIDList.indexOf(elem.itemStringID) !== -1
      );
    });
    res.json({ userClaimRecord });
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
      return;
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
      return;
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
      return;
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
      return;
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
        if (secondParty.indexOf(notification.notificationSender) == -1) {
          secondParty.push(notification.notificationSender);
        } else if (secondParty.indexOf(notification.to) == -1) {
          secondParty.push(notification.to);
        }
      }
      let userNameResult = await this.displayService.getUserName(secondParty);
      const userIDNameMap = new Map();
      for (let userName of userNameResult) {
        userIDNameMap.set(userName.id, userName.name);
      }

      let receiptIDList: string[] = [];
      let newNotificationResult = [];
      for (let notification of notificationResult) {
        if (receiptIDList.indexOf(notification.receiptStringID) !== -1) {
          continue;
        }
        notification.notificationSender = userIDNameMap.get(
          notification.notificationSender
        );
        notification.to = userIDNameMap.get(notification.to);
        receiptIDList.push(notification.receiptStringID);
        newNotificationResult.push(notification);
      }

      res.json({ notifications: newNotificationResult });
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  };
}
