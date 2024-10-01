import * as msgTemplate from "./messages.js";

const FROM_PHONE_NUMBER_ID = process.env.FROM_PHONE_NUMBER_ID;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

async function sendReadReceipt(msgId) {
  let msg = msgTemplate.readReceipt;
  msg.message_id = msgId;
  await notifyConsumer(msg);
}

async function sendLocationReq(phone) 
{
  let msg = msgTemplate.locationReq;
  msg.to = phone;
  await notifyConsumer(msg);
}

async function sendNoLinkedPhoneFoundMsg(phone) {
  let msg = msgTemplate.textMsg;
  msg.to = phone;
  msg.text.body =
    "ही सेवा वापरण्यासाठी, तुमचा १२ अंकी ग्राहक क्रमांक पाठवा.";

  await notifyConsumer(msg);
}

async function sendIncidentTypeSelection(phone) {
  let msg = msgTemplate.incidentSelection;
  msg.interactive.header.image.id = msgTemplate.getImg();
  msg.to = phone;
  console.log(`Sending incident type selection to ${msg.to}`);
  await notifyConsumer(msg);
}

async function sendAck(phone) {
  let msg = msgTemplate.ackMsg;
  msg.to = phone;
  // msg.text.preview_url=true;
  // msg.text.body =
  //   "तुमच्या वीज पुरवठ्याची स्थिती कळवल्याबद्दल धन्यवाद. ही माहिती तुमच्या वीज कंपनीला तुम्हाला अधिक चांगली सेवा देण्यासाठी मदत करेल..\n\nअधिक तपशीलांसाठी https://eagle-5i6w.onrender.com/ ला भेट द्या.";

  await notifyConsumer(msg);
}

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
}

export {
  sendReadReceipt,
  sendNoLinkedPhoneFoundMsg,
  sendIncidentTypeSelection,
  sendLocationReq,
  sendAck,
};

