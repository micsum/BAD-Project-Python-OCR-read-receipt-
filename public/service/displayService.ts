import { Knex } from "knex";

export class DisplayService {
  constructor(private knex: Knex) {}
  async retrieveReceiptRecipient(receiptStringID: string, userID: number) {
    let receiptRecipientsResult = await this.knex("receipt")
      .where({ receipt_id: receiptStringID })
      .innerJoin(
        "receipt_recipient",
        "receipt_recipient.receipt_id",
        "=",
        "receipt.id"
      )
      .select("to_individual");

    if (receiptRecipientsResult === undefined) {
      return false;
    }

    let receiptRecipients = receiptRecipientsResult;
    let userFound = false;
    for (let recipient of receiptRecipients) {
      if (recipient.to_individual === userID) {
        userFound = !userFound;
        break;
      }
    }
    return userFound;
  }
  async getUserName(idArray: number[]) {
    return await this.knex("user").select("id", "name").where("id", idArray);
  }

  async getNotifications(userID: number) {
    return await this.knex("notification")
      .where({ from: userID })
      .orWhere({ from: userID })
      .innerJoin("receipt", { "notification.receipt_id": "receipt.id" })
      .select(
        "notification.from",
        "notification.to",
        "notification.payment",
        "receipt.id as receipt_id",
        "notification.information"
      )
      .limit(30)
      .offset(6)
      .orderBy("id", "desc");
  }
}
