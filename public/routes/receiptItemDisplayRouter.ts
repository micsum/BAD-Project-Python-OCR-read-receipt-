// Buffer Line
import { Request, Response, Router } from "express";
import { io } from "../../server";
import { TemporaryClaimSelection, CheckReq } from "./helper";

export let itemDisplayRouter = Router();
let checkReqBody = new CheckReq();

let temporarySelections: TemporaryClaimSelection[] = [];

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
  return {
    userID: req.session.user.userID,
    userName: req.session.user.userName,
  };
});

itemDisplayRouter.get("/getTempClaim", async (req: Request, res: Response) => {
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
  io.to(req.session.user.userID.toString()).emit("addClaim", {
    itemStringID,
    quantity,
    user_id,
  });
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

    io.to(req.session.user.userID.toString()).emit("updateClaim", {
      itemStringID,
      quantity,
      user_id,
    });
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
      "quantity",
      "user_id",
    ]);
    if (missingField !== "") {
      res.json({ error: `Missing ${missingField}` });
    }

    let { itemStringID, quantity, user_id } = req.body;

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

    io.to(req.session.user.userID.toString()).emit("removeClaim", {
      itemStringID,
      quantity,
      user_id,
    });
    res.json({});
  }
);
