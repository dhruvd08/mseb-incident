const imgs = ["1097290398666940"];

const noPhoneLinked = {
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: "",
  type: "text",
  text: {
    body: "",
  },
};

const readReceipt = {
  messaging_product: "whatsapp",
  status: "read",
  message_id: "",
};

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
                "id": imgs[Math.floor(Math.random() * imgs.length)]
            }
        },
        "body": {
            "text": "नमस्कार! सध्या वीज पुरवठ्याची स्थिती काय आहे? उत्तर देण्यासाठी बटणे वापरा. धन्यवाद!"
        },
        "footer": {
            "text": "मनोरंजक वन लाइनर्स!™"
        },
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

export { noPhoneLinked, readReceipt, incidentSelection };
