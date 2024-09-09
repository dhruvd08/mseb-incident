const imgs = ["1097290398666940", "831047165806215", "1026662142263883", "560189116344032"];

const textMsg = {
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: "",
  type: "text",
  text: {
    preview_url:"",
    body: "",
  },
};

const ackMsg = {
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",

    /* Header optional */
    // "header": {
    //   "type": "text",
    //   "text": "<HEADER_TEXT>"
    // },

    /* Body optional */
    "body": {
      "text": "तुमच्या वीज पुरवठ्याची स्थिती कळवल्याबद्दल धन्यवाद. ही माहिती तुमच्या वीज कंपनीला तुम्हाला अधिक चांगली सेवा देण्यासाठी मदत करेल."
    },

    /* Footer optional */
    // "footer": {
    //   "text": "<FOOTER_TEXT>"
    // },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "अधिक तपशील पहा!",
        "url": "https://eagle-5i6w.onrender.com/"
      }
    }
  }
}

const locationReq = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    type: "interactive",
    to: "",
    interactive: {
      type: "location_request_message",
      body: {
        "text": "तुमच्या वीज मीटरचे स्थान पाठवा."
      },
      action: {
        "name": "send_location"
      }
    }
  }

const readReceipt = {
  messaging_product: "whatsapp",
  status: "read",
  message_id: "",
};

function getImg(){
  return imgs[Math.floor(Math.random() * imgs.length)];
}

const incidentSelection = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "",
    "type": "interactive",
    "interactive": {
        "type": "button",
        "header": {
            "type": "image",
            "image": {
                "id": getImg()
            }
        },
        "body": {
            "text": "नमस्कार! सध्या वीज पुरवठ्याची स्थिती काय आहे? उत्तर देण्यासाठी बटणे वापरा. धन्यवाद!"
        },
        // "footer": {
        //     "text": "मनोरंजक वन लाइनर्स!™"
        // },
        "action": {
            "buttons": [
                {
                    "type": "reply",
                    "reply": {
                        "id": "0",
                        "title": "वीज पुरवठा नाही 😟"
                    }
                },
                {
                    "type": "reply",
                    "reply": {
                        "id": "1",
                        "title": "फूल व्होल्टेज 🙂"
                    }
                },
                {
                    "type": "reply",
                    "reply": {
                        "id": "2",
                        "title": "डीम पुरवठा 😐"
                    }
                }
            ]
        }
    }
}

export { textMsg, readReceipt, incidentSelection, locationReq, ackMsg };
