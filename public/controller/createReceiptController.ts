import { Request, Response, Router, response } from "express";
import { ReceiptService } from "../service/createReceiptService";
import IncomingForm from "formidable/Formidable";
import path from "path";
import { CheckReq, uploadDir } from "../../helper";
import { ItemInfo } from "../../helper";
import { Server as socketIO } from "socket.io";

export class ReceiptController extends CheckReq {
  router = Router();
  receiptMap: Map<
    number /*userid*/,
    { receipt_id: number; data: [string[], string[]][] }
  >;
  constructor(private receiptService: ReceiptService, private io: socketIO) {
    super();
    this.receiptMap = new Map();
    this.router.post("/uploadReceipt", this.uploadReadReceipt);
    this.router.get("/loadReceiptItems", this.loadReceiptItems);
    this.router.post("/insertReceiptItems", this.insertReceiptItems);
    this.router.post("/searchUser", this.searchUser);
    this.router.post("/requestPayer", this.requestPayer);
  }

  uploadReadReceipt = async (req: Request, res: Response) => {
    //console.log("test upload");

    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }
    let userID = req.session.user.userID;

    this.uploadForm().parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
        return;
      }

      let transaction_date = String(fields.transaction_date);
      let receiptTypeText = String(fields.receiptTypeText);
      let imageMaybeArray = files.croppedImage;
      let image = Array.isArray(imageMaybeArray)
        ? imageMaybeArray[0]
        : imageMaybeArray;
      let filename = image?.newFilename;
      let filepath = path.join(uploadDir + "/" + filename);
      try {
        let toPython = await fetch("http://localhost:8100/readReceipt/", {
          method: "POST",
          credentials: "omit",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filepath: filepath }),
        });
        let response = await toPython.json();

        let receipt_id = await this.receiptService.createReceipt(
          filename,
          userID,
          transaction_date,
          receiptTypeText
        );
        this.receiptMap.set(userID, {
          receipt_id: receipt_id,
          data: response.data,
        });
        console.log(this.receiptMap);
        let responseData = response.data;
        console.log(response.data); //fetch data from python easyocr

        //console.log("filename", filename);
        if (responseData === "undefined") {
          res.json({ success: true, error: "receipt content fail to load" });
        } else if (response.error) {
          res.json({ error: "Server Error" });
        } else {
          res.json({ success: true, data: responseData, filepath: filepath });
        }
        //console.log(path.join(uploadDir + "/" + filename)); test path name and send to python server
        //this.receiptService.createReceipt(filename, req.session.user.userID); update DB immediately after scan?
      } catch (error) {
        console.log(error);
        res.json({ error: "Python Server Error" });
      }
    });
  };

  //viewReceipt = async (req: Request, res: Response) => {};

  loadReceiptItems = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }
    let userID = req.session.user.userID;

    let mapResult = this.receiptMap.get(userID);
    if (mapResult === undefined) {
      res.json({ error: "User did not Create Receipt" });
      return;
    }

    res.json({
      itemList: mapResult.data,
    });
  };

  insertReceiptItems = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }
    let userID = req.session.user.userID;
    if (req.body === undefined || req.body.itemInfoList === undefined) {
      res.status(401).json({ error: "Items Not Inserted" });
    }

    let newItemList: ItemInfo[] = [];
    for (let item of req.body.itemInfoList) {
      if (item.quantity <= 0) {
        res.json({ error: "quantity cannot be 0" });
      } else if (item.name === null || item.name === "") {
        res.json({ error: "item name cannot be empty" });
      }

      let mapResult = this.receiptMap.get(userID);
      if (mapResult === undefined) {
        res.json({ error: "User did not Create Receipt" });
        return;
      }

      let itemID = Math.random().toString(36).slice(2).substring(0, 6);
      item["receipt_id"] = mapResult.receipt_id;
      item["item_id"] = itemID;
      newItemList.push(item);
    }

    try {
      await this.receiptService.insertReceiptItems(newItemList);
      res.json({});
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };

  requestPayer = async (req: Request, res: Response) => {
    if (req.body.payerList === undefined) {
      res.json({ error: "No information submitted" });
    }
    let payerList = req.body.payerList;
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }
    let userID = req.session.user.userID;
    let hostName = req.session.user.userName;

    let mapResult = this.receiptMap.get(userID);
    if (mapResult === undefined) {
      res.json({ error: "You did not Create the Receipt" });
      return;
    }

    let receiptID = mapResult.receipt_id;
    let result = await this.receiptService.requestPayer(
      payerList,
      userID,
      receiptID,
      hostName
    );
    if (result.error || result.userIDList === undefined) {
      res.json(result);
      return;
    } else {
      for (let user of result.userIDList) {
        this.io
          .to(user.id.toString())
          .emit("notification", { userName: hostName });
      }
      res.json({});
      return;
    }
  };

  searchUser = async (req: Request, res: Response) => {
    let searchInput = req.body.searchInput;
    let result = await this.receiptService.searchUser(searchInput);

    if (result.length < 1) {
      res.json({ error: "Can not find the user" });
      return;
    }
    res.json({ userResult: result[0].name });
  };
}
