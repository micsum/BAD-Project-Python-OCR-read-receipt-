import { Request, Response, Router } from "express";
import { ReceiptService } from "../service/receiptService";
import IncomingForm from "formidable/Formidable";
import path from "path";
import { uploadDir } from "../routes/helper";

export class ReceiptController {
  router = Router();
  constructor(
    private receiptService: ReceiptService,
    private form: IncomingForm
  ) {
    this.router.post("/uploadReceipt", this.uploadReadReceipt);
  }

  uploadReadReceipt = async (req: Request, res: Response) => {
    //console.log("test upload");

    this.form.parse(req, async (err, fields, files) => {
      // if (
      //   req.session === undefined ||
      //   req.session.user === undefined ||
      //   req.session.user.userID === undefined
      // ) {
      //   res.status(401).json({ error: "User Not Found" });
      //   return;
      // }
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
      //console.log(response.data); fetch data from python easyocr

      //console.log("filename", filename);

      //console.log(path.join(uploadDir + "/" + filename)); test path name and send to python server
      //this.receiptService.createReceipt(filename, req.session.user.userID); update DB immediately after scan?
    });
    res.json({ success: true });
  };
}
