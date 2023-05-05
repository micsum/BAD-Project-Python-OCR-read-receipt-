// Buffer Line
import { Request, Response, Router } from "express";
import { io } from "../../server";
import { TemporaryClaimSelection, getUserID, CheckReqBody } from "./helper";

export let itemDisplayRouter = Router();
let checkReqBody = new CheckReqBody();

let temporarySelections: TemporaryClaimSelection[] = [];

itemDisplayRouter.get("/getUserID", getUserID);

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
    res.json({ error: "Wrong Data Type" });
    return;
  }

  temporarySelections.push(req.body);
});
