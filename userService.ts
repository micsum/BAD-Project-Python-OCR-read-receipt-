import * as bcrypt from "bcryptjs";
import { Knex } from "knex";
import { ObjectAny } from "./helper";

export class UserService implements ObjectAny {
  constructor(private knex: Knex) {}

  private async hashPassword(plainPassword: string) {
    const hash: string = await bcrypt.hash(plainPassword, 10);
    return hash;
  }
  private async checkPassword(plainPassword: string, hashedPassword: string) {
    const isMatched: boolean = await bcrypt.compare(
      plainPassword,
      hashedPassword
    );
    return isMatched;
  }
  async checkUnique(fields: ObjectAny) {
    let fieldNames = ["name", "phone_number", "email"];
    let uniqueResult = await this.knex("user")
      .select("*")
      .where(function () {
        this.where({ name: fields.name })
          .orWhere({ phone_number: fields.phone_number })
          .orWhere({ email: fields.email });
      });
    let unique = uniqueResult.rows[0];
    for (let field of fieldNames) {
      if (unique[field] !== undefined) {
        if (unique[field] === fields[field]) {
          return { error: `${field} is already in used` };
        }
      }
    }
    return {};
  }

  async checkLogin(email: string, password: string) {
    let userInfoResult = await this.knex("user")
      .select("id", "name", "password")
      .where({ email: email });
    let userInfo = userInfoResult.rows[0];
    return {
      valid: await this.checkPassword(password, userInfo.password),
      userID: userInfo.id,
      userName: userInfo.name,
    };
  }
}
