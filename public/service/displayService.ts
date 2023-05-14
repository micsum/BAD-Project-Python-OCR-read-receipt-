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
      .select("receipt_recipient.to_individual", "receipt.from")
      .where({ "receipt.receipt_id": receiptStringID });

    if (receiptRecipientsResult === undefined) {
      return { error: "Receipt Not Found" };
    }

    let receiptRecipients = receiptRecipientsResult;
    let userFound = false;
    for (let recipient of receiptRecipients) {
      if (recipient.to_individual === userID) {
        userFound = !userFound;
        break;
      }
    }
    let receiptHost = receiptRecipients[0].from;
    if (receiptHost === userID) {
      userFound = true;
    }
    if (userFound) {
      return { receiptHost };
    } else {
      return {
        error: "User was not Invited to Claim Items in this Receipt",
      };
    }
  }
  async getUserName(idArray: number[]) {
    return await this.knex("user").select("id", "name").whereIn("id", idArray);
  }

  async getNotifications(userID: number, sentFromUser: Boolean) {
    let query = this.knex("notification")
      .innerJoin("receipt", "notification.receipt_id", "receipt.id")
      .select(
        "notification.from as notificationSender",
        "notification.to",
        "notification.payment",
        "receipt.receipt_id as receiptStringID",
        "receipt.confirm_selection",
        "notification.information"
      );

    query = sentFromUser
      ? query.where({ "notification.from": userID })
      : query.where({ "notification.to": userID });
    query = query.limit(30).orderBy("notification.id", "desc");
    return await query;
  }
}
