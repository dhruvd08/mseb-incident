import express from "express";
import * as incident from "./incident.js";
import * as consumer from "./consumer.js";

const app = express();

const port = process.env.port || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await incident.getRecentIncidents();
    res.render("status.ejs", {
      apiKey: process.env.GOOGLE_MAPS_APIKEY,
      result: result,
    });
  } catch (err) {
    res.redirect("/error");
  }
});

app.get("/error", (req, res) => {
  res.send("ERROR");
});

app.get("/notify-webhook", (req, res) => {
  console.log(req.query);
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == process.env.META_WH_TOKEN
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(401);
  }
});

app.post("/notify-webhook", async (req, res) => {
  if (req.body.entry[0].changes[0].value.messages) {
    const msg = req.body.entry[0].changes[0].value.messages[0];
    console.log(JSON.stringify(msg));
    await consumer.sendReadReceipt(msg.id);

    const sender = req.body.entry[0].changes[0].value.contacts[0];
    console.log(JSON.stringify(sender));

    const dbConsumer = await consumer.getConsumer(sender.wa_id);
    console.log(dbConsumer);
    if (dbConsumer) {
      let incident_type;
      if (msg.type === "text") {
        const content = msg.text.body;
        if (["😟", "🙂", "😐"].includes(content)) {
          switch (content) {
            case "😐":
              incident_type = 2;
              break;
            case "🙂":
              incident_type = 1;
              break;
            case "😟":
              incident_type = 0;
              break;
          }
        } else {
          await consumer.sendIncidentTypeSelection(sender.wa_id);
        }
      } else if (msg.type === "interactive") {
        incident_type = msg.interactive.button_reply.id;
        console.log(`Incident type ${incident_type}`);
      }
      await incident.addIncident(incident_type, dbConsumer);
      await consumer.sendAck(sender.wa_id);
    } else {
      if (msg.type === "text") {
        const content = msg.text.body;
        console.log(content);
        if (isConsumerId(content)) {
          console.log(`Got consumer number ${content}`);
          await consumer.addConsumer(content, sender.wa_id, sender.profile.name);
          await consumer.sendLocationReq(sender.wa_id);
        } else {
          await consumer.sendNoLinkedPhoneFoundMsg(sender.wa_id);
        }
      }
    }
    res.sendStatus(200);
  }
});

function isConsumerId(inputtxt) {
  let regexConsumerId = /^186\d{9}$/;

  if (regexConsumerId.test(inputtxt)) {
    return true;
  } else {
    return false;
  }
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
