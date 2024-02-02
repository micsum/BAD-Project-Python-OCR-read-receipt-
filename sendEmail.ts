import nodemailer from "nodemailer";
import Mailgen from "mailgen";

let senderEmail = "cpky216@gmail.com";

export let transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false,
  auth: {
    user: "cpky216@gmail.com",
    pass: "zwbl ghbp dgcf wssd",
  },
});

export async function forgotPwEmail(
  email: string,
  userName: string,
  link: string
) {
  //send forgot password email to update
  let mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "fast-D-pay.",
      link: "https://mailgen.js/",
      copyright: "Copyright © 2023 fast-D-pay. All rights reserved.",
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
