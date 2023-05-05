import { Knex } from "knex";
import { ItemInfo, ClaimItemsInfo } from "../routes/helper";

export class ReceiptItemService {
  constructor(private knex: Knex) {}

  async getReceiptItems(receiptID: string) {
    let receiptItems = await this.knex
      .from("receipt_item")
      .select("id", "item_name", "price", "quantity", "item_id")
      .where({ receipt_id: receiptID });

    let receiptItemClaimers = await this.knex("receipt_item")
      .where({ receipt_id: receiptID })
      .innerJoin("item_payer", "item.id", "=", "item_payer.item_id")
      .innerJoin("user", "item_payer.user_id", "=", "user.id")
      .select("item.id as item_id", "user.name as user_name");

    const itemClaimerMap = new Map();
    for (let claimer of receiptItemClaimers) {
      if (itemClaimerMap.get(claimer.item_id) === undefined) {
        itemClaimerMap.set(claimer.item_id, claimer.user_id.toString());
      } else {
        let claimerList = itemClaimerMap.get(claimer.item_id);
        claimerList += ", " + claimer.user_id.toString();
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

  async insertReceiptItems(itemList: ItemInfo[]) {
    await this.knex("receipt_item").insert(itemList);
  }

  async checkUserClaimHistory(userID: number, receiptStringID: string) {
    let receiptID = await this.knex("receipt").select({
      receipt_id: receiptStringID,
    });
    let receiptHistory = await this.knex("receipt_item")
      .where({ receipt_id: receiptID })
      .innerJoin("item_payer", "receipt_item.id", "=", "item_payer.item_id")
      .select("item_payer.user_id as userID");

    for (let payerUserID of receiptHistory) {
      if (payerUserID === userID) {
        return true;
      }
    }
    return false;
  }

  async claimReceiptItems(
    claimItemsInfo: ClaimItemsInfo[],
    receiptStringID: string,
    receiptHost: number,
    receiptPayer: number,
    payerUsername: string
  ) {
    let itemArray: number[] = [];
    for (let item of claimItemsInfo) {
      itemArray.push(item.item_id);
    }

    await this.knex("item_payer").insert(claimItemsInfo);
    let receiptItemList = await this.knex("receipt")
      .innerJoin("receipt_item", "receipt_id", "=", receiptStringID)
      .select(
        "receipt_item.receipt_id as receiptID",
        "receipt_item.item_name as itemName",
        "receipt_item.price as itemPrice"
      )
      .where("id", itemArray);

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
      information: `${payerUsername} has claimed ${itemList} with a total of ${itemTotalPrice}.`,
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
