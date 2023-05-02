import Knex from "knex";
const knexConfig = require("./knexfile");
let profile = knexConfig.development;
export let knex = Knex(profile);
