import pg from "pg";

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

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

async function getRecentIncidents() {
  try {
    let result = (
      await db.query(
        "select t1.id, t1.incident_type, t1.reported_on, consumers.id as consumer_id, consumers.name, consumers.meter_lat, consumers.meter_lng, consumers.namedloc from incidents t1 join consumers on t1.consumer_id = consumers.id where reported_on = (select max(reported_on) from incidents where t1.consumer_id = incidents.consumer_id) order by t1.reported_on desc"
      )
    ).rows;

    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getFeed() {
  try {
    let result = (
      await db.query(
        "select t1.id, t1.incident_type, t1.reported_on, consumers.id as consumer_id, consumers.name, consumers.meter_lat, consumers.meter_lng, consumers.namedloc from incidents t1 join consumers on t1.consumer_id = consumers.id where reported_on >= current_date - interval '3 days' order by reported_on desc"
      )
    ).rows;

    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function addIncident(incident_type, consumer) {
  console.log(`${incident_type} for ${JSON.stringify(consumer)}`);

  try {
    let newIncident = (await db.query(
      "insert into incidents (incident_type, reported_on, consumer_id) values ($1, $2, $3) returning *",
      [incident_type, new Date(), consumer.id]
    )).rows[0];
    newIncident.meter_lat = consumer.meter_lat;
    newIncident.meter_lng = consumer.meter_lng;
    newIncident.namedloc= consumer.namedloc;
    newIncident.desc= getIncidentName(newIncident.incident_type);
    newIncident.name=consumer.name;
    console.log(`In addIncident function ${JSON.stringify(newIncident)}`);
    return newIncident;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export { getRecentIncidents, getFeed, addIncident, getIncidentName };
