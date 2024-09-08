import express from "express";
import * as incident from "./incident.js";
import * as consumer from "./consumer.js";

const app = express();

const port = process.env.port || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://eagle-5i6w.onrender.com");
  // res.header("Access-Control-Allow-Origin", "https://graph.facebook.com");
  //res.header("Access-Control-Allow-Origin", "http://localhost:3001");

  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/incidents", async (req, res) => {
  try {
    const incidents = await incident.getRecentIncidents();
    for (let incident of incidents) {
      incident.desc = getIncidentName(incident.incident_type);
    }
    res.json(incidents);
  } catch (err) {
    console.log(err);
    res.status(501).json({ error: "Contact API owner." });
  }
});

function getIncidentName(incident_type) {
  let incident_name;
  switch (incident_type) {
    case 0:
      incident_name = "Power failure";
      break;
    case 1:
      incident_name = "Full supply";
      break;
    case 2:
      incident_name = "Dim supply";
      break;
  }
  return incident_name;
}

app.get("/subscribe", async (req, res) => {
  //console.log(`Subscribe was called....${req}`);
  sseStart(res);
  sseNewFeed(res);
});

// SSE head
function sseStart(res) {
  // res.writeHead(200, {
  //   "Content-Type": "text/event-stream",
  //   "X-Accel-Buffering": "no",
  //   "Cache-Control": "no-cache",
  //   "Content-Encoding": "none",
  //   "Connection": "keep-alive",
  //   "Access-Control-Allow-Origin": "*",
  // });
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Cache-Control", "none");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

let newIncident = { id: 0, new: false };
// SSE new feed
function sseNewFeed(res) {
  //if (newIncident.new) {
  res.write("retry: 60000\n");
  res.write("event: message\n");
  res.write("data: " + newIncident.new + "\n");
  res.write("id: " + new Date().getSeconds() + "\n\n");
  //console.log("Sent new incident notification....");
  newIncident.new = false;
  //}
  setTimeout(() => sseNewFeed(res), Math.random() * 3000);

 }

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

app.get("/newincident", async (req, res) => {
  newIncident = { id: new Date().getSeconds(), new: true };
  //sseNewFeed(res);
  res.sendStatus(200);
});

app.post("/notify-webhook", async (req, res) => {
  if (req.body.entry[0].changes[0].value.messages) {
    const msg = req.body.entry[0].changes[0].value.messages[0];
    console.log(JSON.stringify(msg));
    await consumer.sendReadReceipt(msg.id);

    const sender = req.body.entry[0].changes[0].value.contacts[0];

    const dbConsumer = await consumer.getConsumer(sender.wa_id);

    if (dbConsumer) {
      let incident_type;
      if (msg.type === "text") {
        // If meter location details doesn't exist, ask for it again..
        console.log(`DB consumer ${JSON.stringify(dbConsumer)}`);
        if (dbConsumer.namedloc === null) {
          await consumer.sendLocationReq(sender.wa_id);
        } else {
          await consumer.sendIncidentTypeSelection(sender.wa_id);
        }
      } else if (msg.type === "interactive") {
        incident_type = msg.interactive.button_reply.id;
        console.log(`Incident type ${incident_type} received via button click`);
        await incident.addIncident(incident_type, dbConsumer);
        newIncident = { id: new Date().getSeconds(), new: true };
        await consumer.sendAck(sender.wa_id);
      } else if (msg.type === "location") {
        const { latitude, longitude, address, name } = msg.location;
        await consumer.updateConsumer(sender.wa_id, latitude, longitude);
        await consumer.sendIncidentTypeSelection(sender.wa_id);
      }
    } else {
      if (msg.type === "text") {
        const content = msg.text.body;
        console.log(content);
        if (isConsumerId(content)) {
          console.log(`Got consumer number ${content}`);
          await consumer.addConsumer(
            content,
            sender.wa_id,
            sender.profile.name
          );
          await consumer.sendLocationReq(sender.wa_id);
        } else {
          await consumer.sendNoLinkedPhoneFoundMsg(sender.wa_id);
        }
      } else {
        await consumer.sendNoLinkedPhoneFoundMsg(sender.wa_id);
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
