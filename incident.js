import pg from "pg";

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

async function getRecentIncidents() {
    try {
        const result = (
          await db.query(
            "select t1.incident_type, t1.reported_on, consumers.id, consumers.meter_lat, consumers.meter_lng from incidents t1 join consumers on t1.consumer_id = consumers.id where reported_on = (select max(reported_on) from incidents where t1.consumer_id = incidents.consumer_id) order by reported_on desc"
          )
        ).rows;
        return result;
      } catch (err) {
        console.log(err);
        throw err;
      }
}

async function addIncident(params) {
    
}

export { getRecentIncidents, addIncident };