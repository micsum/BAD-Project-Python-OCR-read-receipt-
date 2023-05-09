import { Request, Response, Router } from "express";
import { ReceiptService } from "../service/createReceiptService";
import IncomingForm from "formidable/Formidable";
import path from "path";
import { uploadDir } from "../routes/helper";
import { ItemInfo } from "../routes/helper";

export class ReceiptController {
  router = Router();
  receiptMap: Map<
    number /*userid*/,
    { receipt_id: number; data: [string[], string[]][] }
  >;
  constructor(
    private receiptService: ReceiptService,
    private form: IncomingForm
  ) {
    this.receiptMap = new Map();
    this.router.post("/uploadReceipt", this.uploadReadReceipt);
    this.router.get("/loadReceiptItems", this.loadReceiptItems);
    this.router.post("/insertReceiptItems", this.insertReceiptItems);
    this.router.get("/searchUser", this.searchUser);
  }

  uploadReadReceipt = async (req: Request, res: Response) => {
    //console.log("test upload");

    //if (
    //  req.session === undefined ||
    //  req.session.user === undefined ||
    //  req.session.user.userID === undefined
    //) {
    //  res.status(401).json({ error: "User Not Found" });
    //  return;
    //}
    //let userID = req.session.user.userID;

    this.form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
        return;
      }
      let imageMaybeArray = files.croppedImage;
      let image = Array.isArray(imageMaybeArray)
        ? imageMaybeArray[0]
        : imageMaybeArray;
      let filename = image?.newFilename;
      let filepath = path.join(uploadDir + "/" + filename);
      let toPython = await fetch("http://127.0.0.1:8100/readReceipt/", {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filepath: filepath }),
      });
      let response = await toPython.json();

      //let receipt_id = await this.receiptService.createReceipt(
      //  filename,
      //  userID
      //);
      //
      //this.receiptMap.set(userID, {
      //  receipt_id: receipt_id,
      //  data: response.data,
      //});
      //console.log(this.receiptMap);
      let responseData = response.data;
      console.log(response.data); //fetch data from python easyocr

      //console.log("filename", filename);
      if (responseData === "undefined") {
        res.json({ success: true, error: "receipt content fail to load" });
      } else {
        res.json({ success: true, data: responseData, filepath: filepath });
      }
      //console.log(path.join(uploadDir + "/" + filename)); test path name and send to python server
      //this.receiptService.createReceipt(filename, req.session.user.userID); update DB immediately after scan?
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

    res.json({
      itemList: this.receiptMap.get(userID)?.data,
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
      let itemID = Math.random().toString(36).slice(2).substring(0, 6);
      item["receipt_id"] = this.receiptMap.get(userID)?.receipt_id;
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

  searchUser = async (req: Request, res: Response) => {
    let searchInput = req.body.searchInput;
    let [{ name }] = await this.receiptService.searchUser(searchInput);
    if (name === "" || name === "undefined") {
      res.json({ error: "Can not find the user" });
    }
    res.json({ userResult: name });
  };
}
