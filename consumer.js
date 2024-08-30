import pg from "pg";

const FROM_PHONE_NUMBER_ID = process.env.FROM_PHONE_NUMBER_ID;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

async function sendReadReceipt(msgId) {
  msgBody = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: msgId,
  };
  await notifyConsumer(msgBody);
}

async function notifyConsumer(msgBody) {
  const endpoint = `https://graph.facebook.com/v17.0/${FROM_PHONE_NUMBER_ID}/messages`;
  const header = {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    "Content-Type": "application/json",
  };

  const msgBody = msgBody;

  const result = await fetch(endpoint, {
    method: "POST",
    headers: header,
    body: JSON.stringify(msgBody),
  });

  const response = await result.json();
  console.log(response);
}

export { sendReadReceipt };
