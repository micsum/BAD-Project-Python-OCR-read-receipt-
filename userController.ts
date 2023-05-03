import { Request, Response, Router } from "express";
import { UserService } from "./userService";
import { ObjectAny } from "./helper";

export class UserController implements ObjectAny {
  router = Router();
  constructor(private userService: UserService) {
    this.router.post("/login", this.userLogin);
    this.router.post("/register", this.userRegister);
  }

  private checkReqBody(req: Request, fields: string[]) {
    for (let entry in fields) {
      if (req.body[entry] === undefined) {
        return entry;
      }
    }
    return "";
  }

  userLogin = async (req: Request, res: Response) => {
    let fields = ["email", "password"];
    if (req.body === undefined) {
      res.json({ error: "Missing Information" });
    } else {
      let field = this.checkReqBody(req, fields);
      if (field !== "") {
        res.json({ error: `Missing ${field}` });
      }
    }
    let { email, password } = req.body;
    let userInfo = await this.userService.checkLogin(email, password);
    if (userInfo.valid) {
      req.session.user = {
        userName: userInfo.userName,
        userID: userInfo.userID,
        isLogin: true,
      };
      res.json({});
    } else {
      res.json({ error: "Wrong Email or Password" });
    }
  };

  userRegister = async (req: Request, res: Response) => {
    let fields = ["username", "password", "phoneNumber", "email"];
    if (req.body === undefined) {
      res.json({ error: "No Information Submitted" });
    } else {
      let field = this.checkReqBody(req, fields);
      if (field !== "") {
        res.json({ error: `Missing ${field}` });
      }
    }
    let userName = req.body.username;
    let userPassword = req.body.password;
    let userPhoneNumber = req.body.phoneNumber;
    let userEmail = req.body.email;
    let userBasicInfo = [userName, userPassword, userPhoneNumber, userEmail];

    for (let basicField of userBasicInfo) {
      if (basicField.length === 0) {
        res.json({ error: `Empty ${basicField} Submitted` });
      }
      if (typeof basicField !== "string") {
        res.json({ error: `Non-string ${basicField} Submitted` });
      }
    }
    if (userPassword.length < 8 || userPassword.length > 15) {
      res.json({ error: "Password must have 8 ~ 15 characters" });
    }
    if (userPhoneNumber.length !== 8) {
      res.json({ error: "Inappropriate Phone Number Submitted" });
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userEmail)) {
      res.json({ error: "Please Input an Appropriate Email" });
    }

    let formObject: ObjectAny = {};
    formObject["name"] = userName;
    formObject["phone_number"] = userPhoneNumber;
    formObject["email"] = userEmail;
    let checkUnique = await this.userService.checkUnique(formObject);
    if (checkUnique.error) {
      res.json(checkUnique.error);
    }

    formObject["password"] = userPassword;
    formObject["fps_id"] =
      req.body.fpsLink === undefined ? "" : req.body.fpsLink;
    formObject["payme_link"] =
      req.body.payMeLink === undefined ? "" : req.body.payMeLink;
  };
}
