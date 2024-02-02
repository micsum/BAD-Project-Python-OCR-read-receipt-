import { Request, Response, Router, NextFunction } from "express";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserService } from "./userService";
import { CheckReq, ObjectAny } from "../helper";
import { forgotPwEmail } from "../sendEmail";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export class UserController extends CheckReq implements ObjectAny {
  router = Router();
  JWT_SECRET: string;
  constructor(private userService: UserService) {
    super();
    this.JWT_SECRET = "fullStackMicIsAmazing";
    this.router.post("/login", this.userLogin);
    this.router.post("/register", this.userRegister);
    this.router.put("/updateProfile", this.updateProfileInformation);
    this.router.post("/logout", this.logout);
    this.router.post("/forgotPw", this.forgotPassword);
    this.router.get("/forgotpw/:id/:token", this.authenticate);
    this.router.post("/resetpw", this.resetPw);
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
      return;
    } else {
      res.json({ error: "Wrong Email or Password" });
      return;
    }
  };

  userRegister = async (req: Request, res: Response) => {
    let fields = ["username", "password", "phoneNumber", "email"];
    if (req.body === undefined) {
      res.json({ error: "No Information Submitted" });
      return;
    } else {
      let field = this.checkReqBody(req, fields);
      if (field !== "") {
        res.json({ error: `Missing ${field}` });
        return;
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
        return;
      }
      if (typeof basicField !== "string") {
        res.json({ error: `Non-string ${basicField} Submitted` });
        return;
      }
    }

    let dummyPasswordString = userPassword;
    userPassword = "";
    for (let char of dummyPasswordString) {
      if (char !== " ") {
        userPassword += char;
      }
    }

    if (userPassword.length < 8 || userPassword.length > 15) {
      res.json({ error: "Password must have 8 ~ 15 characters" });
      return;
    }
    if (userPhoneNumber.length !== 8) {
      res.json({ error: "Inappropriate Phone Number Submitted" });
      return;
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userEmail)) {
      res.json({ error: "Please Input an Appropriate Email" });
      return;
    }
    fields = ["name", "phone_number", "email"];
    let formObject: ObjectAny = {};
    formObject["name"] = userName;
    formObject["phone_number"] = userPhoneNumber;
    formObject["email"] = userEmail;

    if (req.body.fpsLink !== "") {
      formObject["fps_id"] = req.body.fpsLink;
      fields.push("fps_id");
    } else {
      formObject["fps_id"] = null;
    }
    if (req.body.payMeLink !== "") {
      formObject["payme_link"] = req.body.payMeLink;
      fields.push("payme_link");
    } else {
      formObject["payme_link"] = null;
    }

    try {
      let checkUnique = await this.userService.checkUserInfoUniqueness(
        fields,
        formObject
      );
      if (checkUnique.error) {
        res.json(checkUnique);
        return;
      }
      userPassword = await this.hashPassword(userPassword);
      formObject["password"] = userPassword;
      formObject["credit"] = 0;
      await this.userService.registerNewUser(formObject);
      res.json({});
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
      return;
    }
  };

  updateProfileInformation = async (req: Request, res: Response) => {
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.isLogin === false
    ) {
      res.json({ error: "Please Login" });
      return;
    }

    if (req.body === undefined) {
      res.json({ error: "Insufficient Information Submitted" });
      return;
    }

    let fields = ["password", "name", "phone_number", "payme_link", "fps_id"];

    let missingString = "information";
    while (missingString !== "") {
      missingString = this.checkReqBody(req, fields);
      if (missingString !== "") {
        fields.splice(fields.indexOf(missingString), 1);
      }
    }

    let userID = req.session.user.userID;
    let updatedInfo: ObjectAny = {};
    for (let field of fields) {
      if (typeof req.body[field] !== "string") {
        res.json({ error: `Non-string ${field} Submitted` });
        return;
      }
      if (field === "password") {
        if (req.body.password.length < 8 || req.body.password.length > 15) {
          res.json({ error: "Password must have 8 ~ 15 characters" });
          return;
        }
      }
      if (field === "phone_number") {
        if (req.body.phone_number.length !== 8) {
          res.json({ error: "Inappropriate Phone Number Submitted" });
          return;
        }
      }
      updatedInfo[field] = req.body[field];
    }

    try {
      let uniquenessResult = await this.userService.checkUserInfoUniqueness(
        fields,
        updatedInfo
      );
      if (uniquenessResult.error) {
        res.json(uniquenessResult);
        return;
      }

      if (updatedInfo.password !== undefined) {
        updatedInfo.password = await this.hashPassword(updatedInfo.password);
      }

      await this.userService.updateUserInfo(userID, updatedInfo);
      res.json({});
      return;
    } catch (error) {
      console.log(error);
      res.json(error);
      return;
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    console.log(req.body.email);
    if (
      req.body === undefined ||
      req.body.email === undefined ||
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email) ===
        false
    ) {
      res.json({
        error: "Invalid Email Submitted, Please Enter a Valid Email",
      });
      return;
    }
    let requestedEmail = req.body.email;

    try {
      let result = await this.userService.checkEmailExistence(requestedEmail);
      let userID = result[0].id;
      let userName = result[0].name;
      if (userID === undefined) {
        res.json({ error: "This User was not Registered" });
        return;
      }
      const payload = {
        email: requestedEmail,
        id: userID,
      };
      const domain = process.env.Domain;
      console.log("domain", domain);

      const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: "15m" });
      const link = `${domain}/forgotpw/${userID}/${token}`;
      //TODO

      await forgotPwEmail(requestedEmail, userName, link);
      res.json({ success: "true" });
      return;
    } catch (error) {
      console.log(error);
      res.json({ error });
      return;
    }
  };

  logout = async (req: Request, res: Response) => {
    console.log("logout");
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
    });
    res.json({ success: "logout" });
    console.log("destroy:", req.session);
  };

  authenticate = (req: Request, res: Response) => {
    try {
      const { id, token } = req.params;
      //console.log("token", token);
      //console.log("id", id);
      let decoded = jwt.verify(token, this.JWT_SECRET) as {
        id: string;
        email: string;
      };

      console.log("decodedId", decoded.id);
      console.log("decodedEmail", decoded.email);

      if (id != decoded.id) {
        res.json({ error: "Invalid id" });
        return;
      }

      // console.log("middleware next ed");

      //@ts-ignore
      // const payload = jwt.verify(token, secret);
      res.sendFile(path.resolve("resetpw", "resetpw.html"));
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  };

  resetPw = async (req: Request, res: Response) => {
    let { email, password, password2, jwtUrl } = req.body;
    let decoded = jwt.verify(jwtUrl, this.JWT_SECRET) as {
      id: string;
      email: string;
    };

    if (decoded.email != email) {
      res.json({ error: "Invalid Email" });
      return;
    }
    if (password != password2) {
      res.json({
        error: "Both passwords are not identical. Please correct.",
      });
      return;
    }

    let dummyPasswordString = password;
    password = "";
    for (let char of dummyPasswordString) {
      if (char !== " ") {
        password += char;
      }
    }

    if (password.length < 8) {
      res.json({
        error: "Please input the password with 8 characters",
      });
      return;
    }
    try {
      if (password === password2) {
        let newHashPassword = await this.hashPassword(password2);
        await this.userService.updateUserPw(newHashPassword, email);
      }
      res.json({});
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "server error" });
      return;
    }
  };
}
