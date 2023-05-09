import { Knex } from "knex";
import { ItemInfo } from "../routes/helper";

export class ReceiptService {
  constructor(private knex: Knex) {}

  async createReceipt(fileName: string, userID: number) {
    let generatedReceiptID = Math.random()
      .toString(36)
      .slice(2)
      .substring(0, 5);
    let receipt = await this.knex
      .insert({
        file_name: fileName,
        receipt_id: generatedReceiptID,
        from: userID,
        created_at: this.knex.fn.now(),
      })
      .into("receipt")
      .returning("id");
    return receipt[0].id;
  }

  async insertReceiptItems(itemList: ItemInfo[]) {
    await this.knex("receipt_item").insert(itemList);
  }

  async searchUser(inputValue: string) {
    return await this.knex("user")
      .select("name")
      .where("email", `${inputValue}`)
      .orWhere("name", `${inputValue}`)
      .orWhere("phone_number", `${inputValue}`);
  }
}
