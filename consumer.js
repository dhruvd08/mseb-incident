import pg from "pg";
import * as waba from "./waba.js"

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

async function sendReadReceipt(msgId) {
  await waba.sendReadReceipt(msgId);
}


export { sendReadReceipt };
