// Buffer Line
import { Request, Response, Router } from "express";
import { TemporaryClaimSelection, ClaimItemsInfo, CheckReq } from "./helper";
import { knex } from "../../db";

export let itemDisplayRouter = Router();
let checkReqBody = new CheckReq();

let temporarySelections: TemporaryClaimSelection[] = [];
export function removeTempClaim(itemList: ClaimItemsInfo[]) {
  for (let item of itemList) {
    temporarySelections = temporarySelections.filter(function (elem) {
      return elem.itemStringID != item.item_id && elem.user_id != item.user_id;
    });
  }
}

itemDisplayRouter.get("/getUserID", async (req: Request, res: Response) => {
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
    let receiptRecipients = await knex("receipt")
      .where({ receipt_id: req.body.receiptID })
      .innerJoin(
        "receipt_recipient",
        "receipt_recipient.receipt_id",
        "=",
        "receipt.id"
      )
      .select("to_individual");
    let userFound = false;
    for (let recipient of receiptRecipients) {
      if (recipient.to_individual === req.session.user.userID) {
        userFound = !userFound;
        break;
      }
    }
    if (userFound) {
      res.json({
        userID: req.session.user.userID,
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
});

itemDisplayRouter.post("/getTempClaim", async (req: Request, res: Response) => {
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
});

itemDisplayRouter.post("/addTempClaim", async (req: Request, res: Response) => {
  if (
    req.session === undefined ||
    req.session.user === undefined ||
    req.session.user.isLogin === false
  ) {
    res.json({ error: "Please Login" });
    return;
  }

  let missingField = checkReqBody.checkReqBody(req, [
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

  temporarySelections.push(req.body);
  res.json({});
});

itemDisplayRouter.put(
  "/updateItemClaim",
  async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    let missingField = checkReqBody.checkReqBody(req, [
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
    if (!updated) {
      res.json({ error: "Claim Record Not Found" });
    }

    res.json({});
  }
);

itemDisplayRouter.delete(
  "/removeTempClaim",
  async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    let missingField = checkReqBody.checkReqBody(req, [
      "itemStringID",
      "user_id",
    ]);
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
  }
);

itemDisplayRouter.get(
  "getNotifications",
  async (req: Request, res: Response) => {
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
      let notificationResult = await knex("notification")
        .where({ from: userID })
        .orWhere({ to: userID })
        .innerJoin("receipt", { "notification.receipt_id": "receipt.id" })
        .select(
          "notification.from",
          "notification.to",
          "notification.payment",
          "receipt.id as receipt_id",
          "notification.information"
        )
        .limit(30)
        .offset(6)
        .orderBy("id", "desc");

      let secondParty: number[] = [];
      for (let notification of notificationResult) {
        if (secondParty.indexOf(notification.from) == -1) {
          secondParty.push(notification.from);
        } else if (secondParty.indexOf(notification.to) == -1) {
          secondParty.push(notification.to);
        }
      }
      let userNameResult = await knex("user")
        .select("id", "name")
        .where("id", secondParty);

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
  }
);
