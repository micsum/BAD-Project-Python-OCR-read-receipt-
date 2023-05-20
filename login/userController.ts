import { Request, Response, Router } from "express";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserService } from "./userService";
import { CheckReq, ObjectAny } from "../helper";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";

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

    if (req.body.fpsLink !== undefined || req.body.fpsLink !== "") {
      formObject["fps_id"] = req.body.fpsLink;
      fields.push("fps_id");
    }
    if (req.body.payMeLink !== undefined || req.body.payMeLink !== "") {
      formObject["payme_link"] = req.body.payMeLink;
      fields.push("payme_link");
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
      if (userID === undefined) {
        res.json({ error: "This User was not Registered" });
        return;
      }
      const payload = {
        email: requestedEmail,
        userID: userID,
      };
      const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: "15m" });
      const link = `http://localhost:8105/forgotpw/${userID}/${token}`;
      //TODO

      let senderEmail = "cpky216@gmail.com";

      let transporter = nodemailer.createTransport({
        service: "gmail",
        secure: false,
        auth: {
          user: "cpky216@gmail.com",
          pass: "qlefhklcekgupfif",
        },
      });

      async function forgotPwEmail(
        email: string,
        userName: string,
        link: string
      ) {
        //send forgot password email to update
        let mailGenerator = new Mailgen({
          theme: "default",
          product: {
            name: "KEUNG TWO INC.",
            link: "https://mailgen.js/",
            copyright: "Copyright © 2023 KEUNG TWO INC. All rights reserved.",
          },
        });
        let emailMessage = {
          body: {
            name: `${userName}`,
            signature: "Sincerely",
            intro:
              "You have received this email because a password reset request for your account was received.",
            action: {
              instructions: "Click the button below to reset your password:",
              button: {
                color: "#DC4D2F",
                text: "Reset Your Password",
                link: link,
              },
            },
            outro:
              "If you did not request a password reset, please contact the admin.",
          },
        };
        let mail = mailGenerator.generate(emailMessage);
        let message = await transporter.sendMail({
          from: senderEmail, //from here set the main sender email
          to: email, //receiver email from body - body email
          subject: "Password Reset",
          //text: "testingemail",
          html: mail, //mail message need refer to formdata info
        });
        console.log("reset password message sent:", message.messageId);
      }
      res.json({});
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
}
