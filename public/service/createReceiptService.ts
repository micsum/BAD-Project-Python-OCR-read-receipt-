import { Knex } from "knex";
import { ItemInfo, ObjectAny } from "../../helper";

export class ReceiptService {
  constructor(private knex: Knex) {}

  async createReceipt(
    fileName: string,
    userID: number,
    transaction_date: string,
    receiptTypeText: string
  ) {
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
        transaction_date: this.knex.raw(
          `to_date('${transaction_date}', 'YYYY-MM-DD')`
        ),
        receipt_type: receiptTypeText,
        confirm_selection: 0,
        confirm_paid: 0,
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
      .where("email", inputValue)
      .orWhere("name", inputValue)
      .orWhere("phone_number", inputValue);
  }

  async requestPayer(
    payerList: string[],
    userID: number,
    receiptID: number,
    hostName: string
  ) {
    let information = `${hostName} had sent you a receipt. Please claim your item asap`;
    const comparedDB = await this.knex
      .select("id")
      .from("user")
      .whereIn("name", payerList);
    if (comparedDB.length != payerList.length) {
      return { error: "DB record not match" };
    }
    let insertNotification = [];
    let insertRecipient = [];
    for (let indivID of comparedDB) {
      insertNotification.push({
        from: userID,
        to: indivID.id,
        receipt_id: receiptID,
        information: information,
        payment: false,
      });
      insertRecipient.push({
        receipt_id: receiptID,
        to_individual: indivID.id,
      });
    }
    await this.knex("notification").insert(insertNotification);
    await this.knex("receipt_recipient").insert(insertRecipient);
    return { userIDList: comparedDB };
  }
}
