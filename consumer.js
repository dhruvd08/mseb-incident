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

async function getConsumer(phone) {
  try {
    let result = (
      await db.query("select id, name from consumers where phone=$1", [phone])
    ).rows;
    if (result.length === 0) {
      return undefined;
    } else {
      return result[0];
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function sendNoLinkedPhoneFoundMsg(phone) {
    await waba.sendNoLinkedPhoneFoundMsg(phone);
}

async function sendIncidentTypeSelection(phone) {
    await waba.sendIncidentTypeSelection(phone);
}

export { sendReadReceipt, getConsumer, sendNoLinkedPhoneFoundMsg, sendIncidentTypeSelection };
