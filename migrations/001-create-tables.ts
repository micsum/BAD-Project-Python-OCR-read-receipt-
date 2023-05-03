import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable("user"))) {
    await knex.schema.createTable("user", (table) => {
      table.increments("id");
      table.string("password", 255).notNullable();
      table.string("name", 255).notNullable().unique();
      table.string("phone_number", 255).notNullable().unique();
      table.string("email", 255).notNullable().unique();
      table.string("fps_id", 255).unique();
      table.string("payme_link", 255).unique();
      table.decimal("credit").notNullable();
      table.timestamps(false, true);
    });
  }

  if (!(await knex.schema.hasTable("receipt"))) {
    await knex.schema.createTable("receipt", (table) => {
      table.increments("id");
      table.string("receipt_id", 255).notNullable().unique();
      table.string("file_name", 255).notNullable();
      table.integer("from").unsigned().notNullable().references("user.id");
      table.string("to_group", 255).nullable();
      table.boolean("confirm_selection").notNullable();
      table.boolean("confirm_paid").notNullable();
      table.string("receipt_type", 255).notNullable();
      table.date("transaction_date").nullable();
      table.timestamps(false, true);
    });
  }

  if (!(await knex.schema.hasTable("notification"))) {
    await knex.schema.createTable("notification", (table) => {
      table.increments("id");
      table.integer("from").unsigned().notNullable().references("user.id");
      table.integer("to").unsigned().notNullable().references("user.id");
      table.boolean("payment").notNullable();
      table.string("information", 255).nullable();
      table.timestamps(false, true);
      table
        .integer("receipt_id")
        .unsigned()
        .notNullable()
        .references("receipt.id");
    });
  }

  if (!(await knex.schema.hasTable("group_member"))) {
    await knex.schema.createTable("group_member", (table) => {
      table.increments("id");
      table
        .integer("member_userid")
        .unsigned()
        .notNullable()
        .unique()
        .references("user.id");
      table.string("ingroup_credit", 255).notNullable();
      table.string("group_name", 255).notNullable();
      table.timestamps(false, true);
    });
  }

  if (!(await knex.schema.hasTable("receipt_recipient"))) {
    await knex.schema.createTable("receipt_recipient", (table) => {
      table.increments("id");
      table
        .integer("receipt_id")
        .unsigned()
        .notNullable()
        .references("receipt.id");
      table
        .integer("to_individual")
        .unsigned()
        .notNullable()
        .references("user.id");
      table.timestamps(false, true);
    });
  }

  if (!(await knex.schema.hasTable("receipt_item"))) {
    await knex.schema.createTable("receipt_item", (table) => {
      table.increments("id");
      table.string("item_name", 255).notNullable();
      table.decimal("price").notNullable();
      table.string("quantity", 255).notNullable();
      table
        .integer("receipt_id")
        .unsigned()
        .notNullable()
        .references("receipt.id");
      table.date("payment_date").nullable();
      table.string("item_id", 255).notNullable();
      table.timestamps(false, true);
    });
  }

  if (!(await knex.schema.hasTable("item_payer"))) {
    await knex.schema.createTable("item_payer", (table) => {
      table.increments("id");
      table.integer("user_id").unsigned().notNullable().references("user.id");
      table
        .integer("item_id")
        .unsigned()
        .notNullable()
        .references("receipt_item.id");
      table.timestamps(false, true);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("item_payer");
  await knex.schema.dropTableIfExists("receipt_item");
  await knex.schema.dropTableIfExists("receipt_recipient");
  await knex.schema.dropTableIfExists("group_member");
  await knex.schema.dropTableIfExists("notification");
  await knex.schema.dropTableIfExists("receipt");
  await knex.schema.dropTableIfExists("user");
}
