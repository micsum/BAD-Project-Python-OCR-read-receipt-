import Stripe from "stripe";
import EndpointSecret from "stripe";
import express, { Request, Response, Router } from "express";
import { TopUpService } from "../service/topUpService";
import dotenv from "dotenv";

export const stripe = new Stripe(
  "sk_test_51N7XVOJtmaIoojFvEOT4CB6RyKs1DBnF8bh037Sw1j0bHecQORH5NdMRaunIGIf2OoWybWfQq2LgPkIuxGVK9ABW00tkkzwOON",
  {
    apiVersion: "2022-11-15",
  }
);

dotenv.config();
const domain = process.env.Domain;
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
    this.router.post("/webhook", this.updateDbCredit);
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
        success_url: `${domain}/wallet.html`,
        cancel_url: `${domain}/wallet.html`,
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
    if (
      req.session === undefined ||
      req.session.user === undefined ||
      req.session.user.userID === undefined
    ) {
      res.status(401).json({ error: "User Not Found" });
      return;
    }

    let userID = req.session.user.userID;
    let event: Stripe.Event | undefined;
    const endpointSecret = "whsec_kLep7ta2cH7gRzfClZcURzFWuzcLUXh2";
    const signature: any = req.headers["stripe-signature"];
    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
      console.log("event test");
    } catch (err: any) {
      console.log(`webhook signature verification failed`, err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event?.type) {
      case "payment_intent.succeeded":
        console.log("event loaded");
        const paymentIntent = event.data.object;
        //@ts-ignore
        const amount = paymentIntent.amount / 100;
        await this.topUpService.updateCredit(userID, amount);
        res.json({ success: true });
        break;
      case "payment_intent.payment_failed":
        res.json({ error: "error of top-up in db credit" });
        break;
      default:
        console.log(`unhandled event type ${event?.type}`);
    }
    res.status(200).json({ received: true });
  };
}
