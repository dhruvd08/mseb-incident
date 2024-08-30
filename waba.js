const FROM_PHONE_NUMBER_ID = process.env.FROM_PHONE_NUMBER_ID;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

async function notifyConsumer(msg) {
    const endpoint = `https://graph.facebook.com/v17.0/${FROM_PHONE_NUMBER_ID}/messages`;
    const header = {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      "Content-Type": "application/json",
    };
  
    const result = await fetch(endpoint, {
      method: "POST",
      headers: header,
      body: JSON.stringify(msg),
    });
  
    const response = await result.json();
    console.log(response);
  }

  export {notifyConsumer}