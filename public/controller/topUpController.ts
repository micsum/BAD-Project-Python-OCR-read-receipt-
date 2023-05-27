import Stripe from "stripe";
import bodyParser from "body-parser";
import { Request, Response, Router, response } from "express";
import express from "express";
import { TopUpService } from "../service/topUpService";

export const stripe = new Stripe(
  "sk_test_51N7XVOJtmaIoojFvEOT4CB6RyKs1DBnF8bh037Sw1j0bHecQORH5NdMRaunIGIf2OoWybWfQq2LgPkIuxGVK9ABW00tkkzwOON",
  {
    apiVersion: "2022-11-15",
  }
);

//type line_items=[{
//name:String,
//amount:number,
//currency:String,
//quantity:number
//}]

export class TopUpController {
  router = Router();
  constructor(private stripe: Stripe, private topUpService: TopUpService) {
    this.router.post("/create-checkout-session", this.topUpCredit);
    this.router.post(
      "/webhook",
      bodyParser.raw({ type: "application/json" }),
      this.updateDbCredit
    );
  }

  topUpCredit = async (req: Request, res: Response) => {
    try {
      if (
        req.session === undefined ||
        req.session.user === undefined ||
        req.session.user.userID === undefined
      ) {
        res.status(401).json({ error: "User Not Found" });
        return;
      }
      let userID = req.session.user.userID;
      const amount = parseFloat(req.body.amount);
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "hkd",
              product_data: {
                name: "Top-Up Balance",
              },
              unit_amount_decimal: Math.round(amount * 100).toString(),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: "http://localhost:8105/top-up-success/:sessionId",
        cancel_url: "http://localhost:8105/wallet.html",
      });
      //const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`
      //@ts-ignore
      res.redirect(session.url);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  };

  updateDbCredit = async (req: Request, res: Response) => {
    let event: Stripe.Event | undefined;
    const sig = req.headers["stripe-signature"];
    const endpointSecret =
      "whsec_2a1a0881f42e6b2d6cf346cc74287921a484e075753bb37220139839a45bffbe";
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    let userID = req.session.user.userID;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        //@ts-ignore
        sig,
        endpointSecret
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }

    switch (event?.type) {
      case "payment_intent.succeeded":
        console.log("event loaded");
        const paymentIntent = event.data.object;
        //@ts-ignore
        const amount = paymentIntent.amount_total / 100;
        await this.topUpService.updateCredit(userID, amount);
        res.json({ success: true });

      case "payment_intent.payment_failed":
        res.json({ error: "error of top-up in db credit" });
    }
  };
}
