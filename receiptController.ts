import { Request, Response, Router } from "express";
import { ReceiptService } from "./receiptService";
import formidable from "formidable";
import { form } from "./helper";
import IncomingForm from "formidable/Formidable";
import { error } from "console";

export class ReceiptController {
  router = Router();
  constructor(
    private receiptService: ReceiptService,
    private form: IncomingForm
  ) {
    this.router.post("/uploadReceipt", this.uploadReceipt);
  }

  uploadReceipt = async (req: Request, res: Response) => {
    //console.log("test upload");
    this.form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
        return;
      }
      let imageMaybeArray: formidable.File | formidable.File[] = files.image;
      console.log("test upload");

      if (Array.isArray(imageMaybeArray)) {
        for (let file of imageMaybeArray) {
          console.log("newFilename", file.newFilename);
        }
      }
    });
    res.json({ success: true });
  };
}
