import { Request, Response, Router } from "express";
import { ReceiptService } from "./receiptService";
import formidable from "formidable";
import { form } from "./helper";
import IncomingForm from "formidable/Formidable";

export class ReceiptController {
  router = Router(); 
  form = new formidable.IncomingForm()
  constructor(
    private receiptService: ReceiptService,
  ) {
    this.router.post("/uploadReceipt", this.uploadReceipt);
  }

  uploadReceipt = async (req: Request, res: Response) => {
    this.form.parse(req, async (err, fields, files) => {
      if(err){
        console.error(err);
        res.status(500).json({success:false,message:"Internal server error"});
        return;
      }
      let imageMaybeArray: formidable.File | formidable.File[] = files.image;
      if (Array.isArray(imageMaybeArray)) {
        for (let file of imageMaybeArray) {
          console.log("newFilename", file.newFilename);
        }
      }
    });
    res.json({ success: true });
  };
}
