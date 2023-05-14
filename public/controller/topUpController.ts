import Stripe from "stripe";
import { Request, Response, Router, response } from "express";
import { TopUpService } from "../service/topUpService";

export const stripe = new Stripe(
  "sk_test_51N7XVOJtmaIoojFvEOT4CB6RyKs1DBnF8bh037Sw1j0bHecQORH5NdMRaunIGIf2OoWybWfQq2LgPkIuxGVK9ABW00tkkzwOON",
  {
    apiVersion: "2022-11-15",
  }
);

export class TopUpController {
  router = Router();
  constructor(private stripe: Stripe, private topUpService: TopUpService) {
    this.router.post("/top-up", this.topUpCredit);
    this.router.post("/top-up/success", this.updateDbCredit);
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
      const amount = req.body.amount;
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "hkd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  };

  updateDbCredit = async (req: Request, res: Response) => {
    try {
      const paymentIntentId = req.body.paymentIntentId;
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      if (
        req.session === undefined ||
        req.session.user === undefined ||
        req.session.user.userID === undefined
      ) {
        res.status(401).json({ error: "User Not Found" });
        return;
      }
      let userID = req.session.user.userID;
      if ((paymentIntent.status = "succeeded")) {
        const amount = paymentIntent.amount / 100;
        await this.topUpService.updateCredit(userID, amount);
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  };
}
