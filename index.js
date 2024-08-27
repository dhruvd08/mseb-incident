import express from "express";
import pg from "pg";

const app = express();

const port = process.env.port || 3000;
const apiKey = process.env.GOOGLE_MAPS_APIKEY;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

app.get("/", async (req, res) => {
  try {
    const result = (
      await db.query(
        "select t1.incident_type, t1.reported_on, consumers.id, consumers.meter_lat, consumers.meter_lng from incidents t1 join consumers on t1.consumer_id = consumers.id where reported_on = (select max(reported_on) from incidents where t1.consumer_id = incidents.consumer_id) order by reported_on desc"
      )
    ).rows;
    console.log(result);
    res.render("status.ejs", { apiKey: apiKey, result: result });
  } catch (err) {
    console.log(err);
    res.redirect("/error");
  }
});

app.get("/error", (req, res) => {
  res.send("ERROR");
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
