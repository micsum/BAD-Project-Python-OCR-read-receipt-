import { Knex } from "knex";
import { ObjectAny, ItemInfo } from "./helper";

export class receiptItemService implements ObjectAny {
  constructor(private knex: Knex) {}

  async getReceiptItems(receiptID: string) {
    let receiptItems = await this.knex
      .from("receipt_item")
      .select("id", "item_name", "price", "quantity", "item_id")
      .where({ receipt_id: receiptID });

    let receiptItemClaimers = await this.knex("receipt_item")
      .where({ receipt_id: receiptID })
      .join("item_payer", function () {
        this.on("item.id", "=", "item_payer.item_id").onExists(function () {
          this.join("user", function () {
            this.on("item_payer.user_id", "=", "user.id").onExists(function () {
              this.select("item.id as item_id", "user.name as user_name");
            });
          });
        });
      });

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
    this.knex("receipt_item").insert(itemList);
  }

  async claimReceiptItems(claimItemInfo: { user_id: number; item_id: string }) {
    this.knex("item_payer").insert(claimItemInfo);
  }
}
