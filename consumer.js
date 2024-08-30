import pg from "pg";
import * as waba from "./waba.js";

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

async function isPhoneLinked(phone) {
    console.log(phone);
  try {
    let result = (
      await db.query("select id from consumers where phone=$1", [
        phone
      ])
    ).rows;
    console.log(result[0]);
    if (result[0]) {
        return true
    } else{
        return false;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export { sendReadReceipt, isPhoneLinked };
