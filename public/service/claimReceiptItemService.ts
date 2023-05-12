import { Knex } from "knex";
import { ClaimItemsInfo, Notification, ObjectAny } from "../../helper";

export class ClaimReceiptItemService {
  constructor(private knex: Knex) {}

  async getReceiptSender(receiptID: string) {
    let result = await this.knex("receipt")
      .select("from")
      .where({ receipt_id: receiptID });

    if (result === undefined) {
      return { error: "Wrong Information Submitted" };
    } else if (result.length === 0) {
      return { error: "Receipt Not Found" };
    } else {
      return { from: result[0].from };
    }
  }

  async retrieveReceiptRecipient(receiptID: string | number, userID: number) {
    let receiptRecipients;
    if (typeof receiptID === "string") {
      receiptRecipients = await this.knex("receipt")
        .where({ receipt_id: receiptID })
        .innerJoin(
          "receipt_recipient",
          "receipt_recipient.receipt_id",
          "=",
          "receipt.id"
        )
        .select("to_individual");
    } else if (typeof receiptID === "number") {
      receiptRecipients = await this.knex("receipt_recipient")
        .select("to_individual")
        .where({ receipt_id: receiptID });
    } else {
      return false;
    }

    if (receiptRecipients === undefined) {
      return false;
    }

    let userFound = false;
    for (let recipient of receiptRecipients) {
      if (recipient.to_individual === userID) {
        userFound = !userFound;
        break;
      }
    }
    return userFound;
  }

  async checkReceiptClaimStatus(receiptID: string | number) {
    let result;
    if (typeof receiptID === "string") {
      result = await this.knex("receipt").select("confirm_selection").where({
        receipt_id: receiptID,
      });
    } else if (typeof receiptID === "number") {
      result = await this.knex("receipt").select("confirm_selection").where({
        id: receiptID,
      });
    }
    if (result === undefined) {
      return { error: "Wrong Information Submitted" };
    } else if (result.length === 0) {
      return { error: "Receipt Not Found" };
    } else {
      return { receiptStatus: result[0].confirm_selection };
    }
  }

  async getReceiptItems(receiptStringID: string) {
    let result = await this.knex("receipt")
      .select("id")
      .where({ receipt_id: receiptStringID });
    if (result === undefined) {
      return { error: "Wrong Information Submitted" };
    } else if (result.length === 0) {
      return { error: "Receipt Not Found" };
    }
    let receiptID = result[0].id;
    result = await this.knex
      .from("receipt_item")
      .select("id", "item_name", "price", "quantity", "item_id")
      .where({ receipt_id: receiptID });

    let receiptItems = result;
    let receiptItemClaimers = await this.knex("receipt_item")
      .innerJoin("item_payer", "receipt_item.id", "=", "item_payer.item_id")
      .innerJoin("user", "item_payer.user_id", "=", "user.id")
      .select("receipt_item.id as item_id", "user.name as user_name")
      .where({ receipt_id: receiptID });

    const itemClaimerMap = new Map();
    for (let claimer of receiptItemClaimers) {
      if (itemClaimerMap.get(claimer.item_id) === undefined) {
        itemClaimerMap.set(claimer.item_id, claimer.user_name);
      } else {
        let claimerList = itemClaimerMap.get(claimer.item_id);
        claimerList += ", " + claimer.user_name;
        itemClaimerMap.set(claimer.item_id, claimerList);
      }
    }

    for (let item of receiptItems) {
      let claimerList = "";
      if (itemClaimerMap.get(item.id) !== undefined) {
        claimerList = itemClaimerMap.get(item.id);
      }
      item["claimerList"] = claimerList;
    }
    return { receiptItems };
  }

  async claimReceiptItems(
    claimItemsInfo: ClaimItemsInfo[],
    receiptStringID: string,
    receiptHost: number,
    receiptPayer: number,
    payerUsername: string
  ) {
    let itemArray: string[] = [];
    for (let item of claimItemsInfo) {
      itemArray.push(item.item_id);
    }

    let itemIDList = await this.knex("receipt_item")
      .select("id")
      .where("item_id", itemArray);

    if (itemIDList === undefined || itemArray.length !== itemIDList.length) {
      return { error: "Claim Item(s) Not Found" };
    }

    let newItemsInfo: ObjectAny[] = [];
    for (let i = 0; i < claimItemsInfo.length; i++) {
      let userID = receiptPayer;
      let itemID = itemIDList[i].id;
      newItemsInfo.push({ user_id: userID, item_id: itemID });
    }

    await this.knex("item_payer")
      .where({ user_id: receiptPayer })
      .where("item_id", itemIDList)
      .del();

    await this.knex("item_payer").insert(newItemsInfo);

    let receiptItemList = await this.knex("receipt")
      .innerJoin("receipt_item", "receipt_id", "=", receiptStringID)
      .select(
        "receipt_item.receipt_id as receiptID",
        "receipt_item.item_name as itemName",
        "receipt_item.price as itemPrice"
      )
      .where("receipt_item.item_id", itemArray);

    let receiptID: number = -1;
    let itemList: string = "";
    let itemTotalPrice: number = 0;
    for (let item of receiptItemList) {
      itemList =
        itemList.length === 0 ? item.itemName : itemList + ", " + item.itemName;
      itemTotalPrice += item.itemPrice;
      receiptID = item.receiptID;
    }

    await this.knex("notification").insert({
      from: receiptPayer,
      to: receiptHost,
      receipt_id: receiptID,
      payment: false,
      information: `Updated Claim : ${"\n"}${payerUsername} has claimed ${itemList} with a total of ${itemTotalPrice}`,
    });
    return {};
  }

  async removeItemClaims(item: number) {
    await this.knex("item_payer").where({ item_id: item }).del();
  }

  async broadcastConfirmClaim(
    userID: number,
    information: string,
    receiptStringID: string
  ) {
    let receiptIDResult = await this.knex("receipt")
      .select("id")
      .where({ receipt_id: receiptStringID });

    if (receiptIDResult === undefined) {
      return { error: "Receipt Not Found" };
    }

    let receiptID = receiptIDResult[0].id;
    let receiptRecipients = await this.knex("receipt_recipient")
      .select("to_individual")
      .where({ receipt_id: receiptID });

    let [paymentMethod] = await this.knex("user")
      .select("payme_link", "fps_id")
      .where({ id: userID });

    if (paymentMethod.payme_link !== "") {
      information += `${"\n"}PayMeLink : ${paymentMethod.payme_link}`;
    } else if (paymentMethod.fps_id !== "") {
      information += `${"\n"}FPS-id : ${paymentMethod.fps_id}`;
    }

    let notifications: Notification[] = [];
    for (let receiptRecipient of receiptRecipients) {
      notifications.push({
        from: userID,
        to: receiptRecipient,
        payment: false,
        receipt_id: receiptID,
        information: information,
      });
    }
    await this.knex("receipt")
      .update({ confirm_selection: true })
      .where({ id: receiptID });
    await this.knex("notification").insert(notifications);
  }

  async respondPayMessage(
    userID: number,
    receiptID: number,
    creditMode: Boolean
  ) {
    if (creditMode) {
      let [{ credit }] = await this.knex("user")
        .select("credit")
        .where({ id: userID });

      let informationResult = await this.knex("notification")
        .select("information")
        .where({ receipt_id: receiptID, from: userID, payment: false });

      if (informationResult === undefined) {
        return { error: "Total Price of Claim Not Found" };
      }

      let information = informationResult[0].information;
      information = information.split(",");
      let claimPrice: number = information.slice(-1)[0];

      if (credit <= claimPrice) {
        return { error: "Insufficient Credit" };
      } else {
        await this.knex("user")
          .update({ credit: credit - claimPrice })
          .where({ id: userID });
      }
    }
    return {};
  }

  async hostAcceptAllPayment(receiptStringID: string) {
    await this.knex("receipt")
      .update({ confirm_paid: true })
      .where({ receipt_id: receiptStringID });
  }
}
