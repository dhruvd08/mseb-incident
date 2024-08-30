import express from "express";
import * as incident from "./incident.js"

const app = express();

const port = process.env.port || 3000;
const apiKey = process.env.GOOGLE_MAPS_APIKEY;
const verifyToken = process.env.META_WH_TOKEN;

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
  console.log(req.query);
  if (req.query["hub.mode"] == 'subscribe' &&  req.query["hub.verify_token"] == verifyToken){
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(401);
  }
});

app.post("/notify-webhook", (req, res) => {
  console.log(req.body);
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
