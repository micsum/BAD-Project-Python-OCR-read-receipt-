import { Knex } from "knex";

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
    return receipt;
  }
}
