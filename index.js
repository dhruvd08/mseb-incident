import express from "express";
import * as incident from "./incident.js";
import * as consumer from "./consumer.js";
import * as insights from "./insights.js";

const app = express();

const port = process.env.port || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);

  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/villages", async (req, res) => {
  try {
    const villages = await insights.getUniqueVillages();
    res.json(villages);
  } catch (err) {
    console.log(err);
    res.status(501).json({ error: "Contact API owner." });
  }
});

function getFirstDateOfCurrentMonth() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 1);
}

function getLastDateOfCurrentMonth() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0);
}

app.get("/uptime", async (req, res) => {
  console.log(req.query.village);
  if (req.query.village) {
    try {
      const uptime = await insights.getUptimeByVillage(
        req.query.village,
        getFirstDateOfCurrentMonth(),
        getLastDateOfCurrentMonth()
      );
      console.log(uptime);
      res.json(uptime);
    } catch (err) {
      console.log(err);
      res.status(501).json({ error: "Contact API owner." });
    }
  } else {
    res.status(400).json({ error: "Invalid request." });
  }
});

app.get("/incidentcount", async (req, res) => {
  console.log(req.query.village);
  if (req.query.village) {
    try {
      const incidentCount = await insights.getIncidentCount(
        req.query.village,
        getFirstDateOfCurrentMonth(),
        getLastDateOfCurrentMonth()
      );
      res.json(incidentCount);
    } catch (err) {
      console.log(err);
      res.status(501).json({ error: "Contact API owner." });
    }
  } else {
    res.status(400).json({ error: "Invalid request." });
  }
});

app.get("/resolutiontime", async (req, res) => {
  if (req.query.village) {
    try {
      const resolutionTime = await insights.getResolutionTime(
        req.query.village,
        getFirstDateOfCurrentMonth(),
        getLastDateOfCurrentMonth()
      );
      console.log(resolutionTime);
      res.json(resolutionTime);
    } catch (err) {
      console.log(err);
      res.status(501).json({ error: "Contact API owner." });
    }
  } else {
    res.status(400).json({ error: "Invalid request." });
  }
});

app.get("/incidents", async (req, res) => {
  try {
    const incidents = await incident.getRecentIncidents();
    for (let inc of incidents) {
      inc.desc = incident.getIncidentName(inc.incident_type);
    }
    res.json(incidents);
  } catch (err) {
    console.log(err);
    res.status(501).json({ error: "Contact API owner." });
  }
});

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

let newIncident = {};
// SSE new feed
function sseNewFeed(res) {
  //if (newIncident.new) {
  res.write("retry: 60000\n");
  res.write("event: message\n");
  res.write("data: " + JSON.stringify(newIncident) + "\n");
  res.write("id: " + new Date().getSeconds() + "\n\n");
  if (newIncident.id) {
    console.log("Sent new incident notification....");
  }
  newIncident = {};
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
  newIncident = await incident.addIncident(
    1,
    await consumer.getConsumer("8010809158")
  );
  console.log(newIncident);
  //newIncident = {};
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
        newIncident = await incident.addIncident(incident_type, dbConsumer);
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
