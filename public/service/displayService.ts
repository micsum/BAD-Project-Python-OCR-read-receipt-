import { Knex } from "knex";

export class DisplayService {
  constructor(private knex: Knex) {}
  async retrieveReceiptRecipient(receiptStringID: string, userID: number) {
    let receiptRecipientsResult = await this.knex("receipt")
      .innerJoin(
        "receipt_recipient",
        "receipt_recipient.receipt_id",
        "=",
        "receipt.id"
      )
      .select("receipt_recipient.to_individual")
      .where({ "receipt.receipt_id": receiptStringID });

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
    return await this.knex("user").select("id", "name").whereIn("id", idArray);
  }

  async getNotifications(userID: number) {
    return await this.knex("notification")
      .innerJoin("receipt", "notification.receipt_id", "receipt.id")
      .select(
        "notification.from as notificationSender",
        "notification.to",
        "notification.payment",
        "receipt.receipt_id as receiptStringID",
        "notification.information"
      )
      .where({ "notification.from": userID })
      .orWhere({ to: userID })
      .limit(30)
      .orderBy("notification.id", "desc");
  }
}
