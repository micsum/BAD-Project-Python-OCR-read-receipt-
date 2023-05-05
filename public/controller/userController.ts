import { Request, Response, Router } from "express";
import * as bcrypt from "bcryptjs";
import { UserService } from "../service/userService";
import { CheckReq, ObjectAny } from "../routes/helper";

export class UserController extends CheckReq implements ObjectAny {
  router = Router();
  constructor(private userService: UserService) {
    super();
    this.router.post("/login", this.userLogin);
    this.router.post("/register", this.userRegister);
  }

  private async hashPassword(plainPassword: string) {
    const hash: string = await bcrypt.hash(plainPassword, 10);
    return hash;
  }

  userLogin = async (req: Request, res: Response) => {
    let fields = ["email", "password"];

    let field = this.checkReqBody(req, fields);
    if (field !== "") {
      res.json({ error: `Missing ${field}` });
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
    fields = ["name", "phone_number", "email"];
    let formObject: ObjectAny = {};
    formObject["name"] = userName;
    formObject["phone_number"] = userPhoneNumber;
    formObject["email"] = userEmail;

    if (req.body.fpsLink !== undefined) {
      formObject["fps_id"] = req.body.fpsLink;
      fields.push("fps_id");
    } else {
      formObject["fps_id"] = "";
    }

    if (req.body.payMeLink !== undefined) {
      formObject["payme_link"] = req.body.payMeLink;
      fields.push("payme_link");
    } else {
      formObject["payme_link"] = "";
    }
    try {
      let checkUnique = await this.userService.checkUserInfoUniqueness(
        fields,
        formObject
      );
      if (checkUnique.error) {
        res.json(checkUnique.error);
      }
      userPassword = await this.hashPassword(userPassword);
      formObject["password"] = userPassword;
      await this.userService.registerNewUser(formObject);
    } catch (error) {
      console.log(error);
      res.json({ error });
    }
  };
}
