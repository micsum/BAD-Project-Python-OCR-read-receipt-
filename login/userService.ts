import * as bcrypt from "bcryptjs";
import { Knex } from "knex";
import { ObjectAny } from "../helper";

export class UserService implements ObjectAny {
  constructor(private knex: Knex) {}

  private async checkPassword(plainPassword: string, hashedPassword: string) {
    const isMatched: boolean = await bcrypt.compare(
      plainPassword,
      hashedPassword
    );
    return isMatched;
  }
  async checkUserInfoUniqueness(fieldNames: string[], fields: ObjectAny) {
    let query = this.knex("user").select("*").where({ id: -1 });
    for (let field of fieldNames) {
      let fieldObject: ObjectAny = {};
      fieldObject[field] = fields[field];
      query = query.orWhere(fieldObject);
    }
    let uniqueResult = await query;
    if (uniqueResult.length === 0) {
      return {};
    }
    let unique = uniqueResult[0];

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
    let userInfo = userInfoResult[0];
    if (userInfoResult.length === 0) {
      return {
        valid: false,
        userID: "",
        userName: "",
      };
    }

    return {
      valid: await this.checkPassword(password, userInfo.password),
      userID: userInfo.id,
      userName: userInfo.name,
    };
  }

  async registerNewUser(formObject: ObjectAny) {
    await this.knex("user").insert(formObject);
  }

  async checkEmailExistence(email: string) {
    return await this.knex("user").select("id", "name").where({ email: email });
  }

  async updateUserInfo(userID: number, updatedInfo: ObjectAny) {
    await this.knex("user").update(updatedInfo).where({ id: userID });
  }

  async updateUserPw(newHashPassword: string, email: string) {
    await this.knex("user")
      .where("email", email)
      .update("password", newHashPassword);
  }
}
