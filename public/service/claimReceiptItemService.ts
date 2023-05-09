import { Knex } from "knex";
import { ClaimItemsInfo, ObjectAny } from "../routes/helper";

export class ReceiptItemService {
  constructor(private knex: Knex) {}

  async checkReceiptClaimStatus(receiptStringID: string) {
    let receiptStatus = await this.knex("receipt")
      .select("confirm_selection")
      .where({
        receipt_id: receiptStringID,
      });

    return receiptStatus;
  }

  async getReceiptItems(receiptID: string) {
    let receiptItems = await this.knex
      .from("receipt_item")
      .select("id", "item_name", "price", "quantity", "item_id")
      .where({ receipt_id: receiptID });

    let receiptItemClaimers = await this.knex("receipt_item")
      .where({ receipt_id: receiptID })
      .innerJoin("item_payer", "receipt_item.id", "=", "item_payer.item_id")
      .innerJoin("user", "item_payer.user_id", "=", "user.id")
      .select("receipt_item.id as item_id", "user.name as user_name");

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
    return receiptItems;
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
      information: `Updated Claim : ${"\n"}${payerUsername} has claimed ${itemList} with a total of ${itemTotalPrice}.`,
    });
  }

  async getReceiptSender(receiptID: string) {
    return await this.knex("receipt")
      .select("from")
      .where({ receipt_id: receiptID });
  }

  async removeItemClaims(item: number) {
    await this.knex("item_payer").where({ item_id: item }).del();
  }
}
