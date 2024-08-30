import express from "express";
import * as incident from "./incident.js"

const app = express();

const port = process.env.port || 3000;
const apiKey = process.env.GOOGLE_MAPS_APIKEY;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());


app.get("/", async (req, res) => {
  try {
    const result = await incident.getRecentIncidents();
    res.render("status.ejs", { apiKey: apiKey, result: result });
  } catch (err) {
    res.redirect("/error");
  }
});

app.get("/error", (req, res) => {
  res.send("ERROR");
});

app.get("/notify-webhook", (req, res) => {
  console.log(`GET REQUEST ${req.params}`);
  if (req.params.hub.mode == 'subscribe' &&  req.params.hub.verify_token == VERIFY_TOKEN){
    res.send(req.params.hub.challenge);
  } else {
    res.sendStatus(401);
  }
});

app.post("/notify-webhook", (req, res) => {
  console.log(`POST REQUEST ${req.json}`);
  res.sendStatus(200);
});

app.post("/report", async (req, res) => {
  if (req.headers.authorization.split()[1] === process.env.APP_TOKEN) {
    console.log(req.body);
    try {
      let result = (
        await db.query("select id from consumers where phone=$1", [
          req.body.consumer_phone,
        ])
      ).rows;
      if (result.length != 0) {
        const consumerId = result[0].id;
        await db.query(
          "insert into incidents (incident_type, reported_on, consumer_id) values ($1, $2, $3)",
          [req.body.incident_type, new Date(), consumerId]
        );
        res.status(200).json({ success: "Message received" });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Technical Error" });
    }
  } else {
    res.status(401).json({ error: "Not Authorized" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
