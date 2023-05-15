import { Knex } from "knex";
import { ObjectAny } from "../../helper";

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
      .innerJoin(
        "receipt_item",
        "notification.receipt_id",
        "receipt_item.receipt_id"
      )
      .select(
        "notification.from as notificationSender",
        "notification.to",
        "notification.payment",
        "receipt.receipt_id as receiptStringID",
        "receipt.confirm_selection",
        "receipt.created_at",
        "notification.information",
        "receipt.id as receiptID"
      );

    query = sentFromUser
      ? query.where({ "notification.from": userID })
      : query.where({ "notification.to": userID });
    query = query.limit(30).orderBy("notification.id", "desc");

    let queryResult: ObjectAny[] = await query;
    let receiptIDList: number[] = [];
    for (let notification of queryResult) {
      receiptIDList.push(notification.receiptID);
    }

    let receiptItemList = await this.knex("receipt")
      .innerJoin("receipt_item", "receipt_item.receipt_id", "receipt.id")
      .select("receipt.id", "receipt_item.price", "receipt_item.quantity")
      .whereIn("receipt.id", receiptIDList);

    let receiptTotalPriceMap: Map<number, number> = new Map();
    for (let item of receiptItemList) {
      let receiptTotalPrice = receiptTotalPriceMap.get(item.id);
      let itemTotalPrice = item.price * item.quantity;
      if (receiptTotalPrice === undefined) {
        receiptTotalPriceMap.set(item.id, itemTotalPrice);
      } else {
        let newTotalPrice = receiptTotalPrice + itemTotalPrice;
        receiptTotalPriceMap.set(item.id, newTotalPrice);
      }
    }

    for (let notification of queryResult) {
      let totalPrice = receiptTotalPriceMap.get(notification.receiptID);
      notification["total"] = totalPrice;
    }

    return queryResult;
  }
}
