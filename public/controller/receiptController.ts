import { Request, Response, Router } from "express";
import { ReceiptService } from "../service/receiptService";
import IncomingForm from "formidable/Formidable";
import path from "path";
import { uploadDir } from "../routes/helper";
import cors from "cors";

export class ReceiptController {
  router = Router();
  constructor(
    private receiptService: ReceiptService,
    private form: IncomingForm
  ) {
    this.router.post("/uploadReceipt", cors(), this.uploadReadReceipt);
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

      //console.log("filename", filename);
      res.json({
        filepath: path.join(uploadDir + "/" + filename),
        success: true,
      });
      //console.log(path.join(uploadDir + "/" + filename)); test path name and send to python server
      //this.receiptService.createReceipt(filename, req.session.user.userID); update DB immediately after scan?
    });
    //res.json({ success: true });
  };
}
