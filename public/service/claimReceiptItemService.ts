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
        .where({ "receipt.receipt_id": receiptID })
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

  async checkReceiptClaimStatus(receiptID: string) {
    let result;
    result = await this.knex("receipt").select("confirm_selection").where({
      receipt_id: receiptID,
    });

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
      .select("receipt_item.item_id as item_id", "user.name as user_name")
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
      if (itemClaimerMap.get(item.item_id) !== undefined) {
        claimerList = itemClaimerMap.get(item.item_id);
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
    let receiptItems = await this.knex("receipt")
      .innerJoin("receipt_item", "receipt.id", "receipt_item.receipt_id")
      .select("item_id")
      .where({ "receipt.receipt_id": receiptStringID });

    itemArray = receiptItems.map((elem) => {
      return elem.item_id;
    });
    let itemListResult = await this.knex("receipt_item")
      .select("id", "item_id")
      .whereIn("item_id", itemArray);

    if (
      itemListResult === undefined ||
      itemArray.length !== itemListResult.length
    ) {
      return { error: "Claim Item(s) Not Found" };
    }

    let itemIDList: number[] = [];
    let itemStringIDList: string[] = [];

    for (let item of itemListResult) {
      itemIDList.push(item.id);
      itemStringIDList.push(item.item_id);
    }

    let newItemsInfo: ObjectAny[] = [];
    for (let item of claimItemsInfo) {
      let userID = receiptPayer;
      let itemID = itemIDList[itemStringIDList.indexOf(item.item_id)];
      newItemsInfo.push({ user_id: userID, item_id: itemID });
    }

    await this.knex("item_payer")
      .where({ user_id: receiptPayer })
      .whereIn("item_id", itemIDList)
      .del();

    if (newItemsInfo.length === 0) {
      return {};
    }
    await this.knex("item_payer").insert(newItemsInfo);

    let receiptItemList = await this.knex("receipt")
      .innerJoin("receipt_item", "receipt_item.receipt_id", "=", "receipt.id")
      .select(
        "receipt_item.receipt_id as receiptID",
        "receipt_item.item_name as itemName",
        "receipt_item.price as itemPrice"
      )
      .where({ "receipt.receipt_id": receiptStringID })
      .whereIn("receipt_item.item_id", itemStringIDList);

    let receiptID: number = -1;
    let itemList: string = "";
    let itemTotalPrice: number = 0;
    for (let item of receiptItemList) {
      itemList =
        itemList.length === 0 ? item.itemName : itemList + ", " + item.itemName;
      itemTotalPrice += parseInt(item.itemPrice);
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
    messageInformation: string,
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
      messageInformation += `${"\n"}PayMeLink : ${paymentMethod.payme_link}`;
    } else if (paymentMethod.fps_id !== "") {
      messageInformation += `${"\n"}FPS-id : ${paymentMethod.fps_id}`;
    }

    let notifications: Notification[] = [];
    let recipientList: number[] = [];
    for (let receiptRecipient of receiptRecipients) {
      let message = messageInformation;
      let [{ information }] = await this.knex("notification")
        .select("information")
        .where({ receipt_id: receiptID, from: userID, payment: false });

      information = information.split(",");
      information = information[information.length - 1].split(" ");
      let claimPrice: number = information.slice(-1)[0];

      message += `${"\n"} Price : ${claimPrice}`;

      notifications.push({
        from: userID,
        to: receiptRecipient.to_individual,
        payment: false,
        receipt_id: receiptID,
        information: message,
      });
      recipientList.push(receiptRecipient.to_individual);
    }
    await this.knex("receipt")
      .update({ confirm_selection: true })
      .where({ id: receiptID });
    await this.knex("notification").insert(notifications);
    return { recipientList };
  }

  async respondPayMessage(
    userID: number,
    userName: string,
    receiptStringID: string,
    creditMode: Boolean
  ) {
    let receiptIDResult = await this.knex("receipt")
      .select("id")
      .where({ receipt_id: receiptStringID });

    if (receiptIDResult[0] === undefined) {
      return { error: "Receipt Not Found" };
    }

    let receiptID = receiptIDResult[0].id;

    let { from, error } = await this.getReceiptSender(receiptStringID);

    let informationResult = await this.knex("notification")
      .select("information")
      .where({ receipt_id: receiptID, from: userID, payment: false });

    if (informationResult === undefined) {
      return { error: "Total Price of Claim Not Found" };
    }

    let information = informationResult[0].information;
    information = information.split(",");
    information = information[information.length - 1].split(" ");
    let claimPrice: number = information.slice(-1)[0];

    if (creditMode) {
      let creditResult = await this.knex("user")
        .select("credit")
        .whereIn(" id", [userID, from]);

      console.log(
        `${userID}'s credit = ${creditResult[0].credit}, 
        ${from}'s credit = ${creditResult[1].credit}`
      );

      let payerCredit = creditResult[0].credit;
      let hostCredit = creditResult[1].credit;

      if (payerCredit <= claimPrice) {
        return { error: "Insufficient Credit" };
      } else {
        await this.knex("user")
          .update({ credit: payerCredit - claimPrice })
          .where({ id: userID });
        await this.knex("user")
          .update({ credit: hostCredit + claimPrice })
          .where({ id: from });
      }
      return {};
    }

    await this.knex("notification").insert({
      from: userID,
      to: from,
      payment: true,
      receipt_id: receiptID,
      information: `${userName} has paid you $${claimPrice} for a receipt`,
    });
    return {};
  }

  async hostAcceptAllPayment(receiptStringID: string) {
    await this.knex("receipt")
      .update({ confirm_paid: true })
      .where({ receipt_id: receiptStringID });
  }
}
