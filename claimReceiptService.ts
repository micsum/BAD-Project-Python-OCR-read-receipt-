import { knex } from "./main";

export class claimReceiptService {
  constructor(private knex: Knex) {}

  async getReceiptItems(receiptID: string) {
    let result = await this.knex
      .from("receipt_item")
      .select("id", "item_name", "price", "quantity");

    let itemClaimerList = {};
    for (let item of result) {
      let payers = item.payer;
    }
  }
}
