import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  knex.schema.alterTable("user", function (table) {
    table.string("fps_id").nullable();
    table.string("payme_link").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.alterTable("user", function (table) {
    table.string("fps_id").notNullable();
    table.string("payme_link").notNullable();
  });
}
