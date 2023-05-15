import { Knex } from "knex";

export class TopUpService {
  constructor(private knex: Knex) {}

  async updateCredit(userID: number, amount: number) {
    let result = await this.knex("user")
      .where("id", userID)
      .increment("credit", amount);
    return result;
  }
}
