import express from "express";
import * as incident from "./incident.js";
import * as consumer from "./consumer.js";
import names from "./names.js";
import pg from "pg";

const app = express();

const port = process.env.port || 4000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

function getRandomConsumerId() {
  return (
    Math.floor(Math.random() * (186999999999 - 186000000000)) + 186000000000
  );
}

function getRandomPhone() {
  return Math.floor(Math.random() * (8010999999 - 8010000000)) + 8010000000;
}

function getRandomLatLng() {
  let allCoorinates = [];
  for (let village of consumer.villages) {
    for (let coordiante of village.geometry.coordinates[0]) {
      allCoorinates.push(coordiante);
    }
  }
  return allCoorinates[Math.floor(Math.random() * allCoorinates.length)];
}

async function setupConsumers() {
  for (let i = 0; i < 10; i++) {
    const consumer_id = getRandomConsumerId();
    console.log(consumer_id);

    const phone = getRandomPhone();
    console.log(phone);

    const consumer_name = names[Math.floor(Math.random() * names.length)];
    const [lng, lat] = getRandomLatLng();
    console.log(`${lat} ${lng}`);

    consumer.addConsumer(consumer_id, phone, consumer_name);
    consumer.updateConsumer(phone, lat + 0.00000000001, lng);
  }
}

async function getUptimeByVillage() {
  const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "mseb",
    password: process.env.DB_PASSWORD,
    port: 5432,
  });

  db.connect();

  const allData = (
    await db.query(
      "select * from incidents inner join consumers on incidents.consumer_id=consumers.id order by incidents.reported_on desc"
    )
  ).rows;

  let uniqueVillages = [];
  let uniqueConsumers = [];
  for (let record of allData) {
    if (!uniqueVillages.includes(record.namedloc)) {
      uniqueVillages.push(record.namedloc);
    }

    if (!uniqueConsumers.includes(record.consumer_id)) {
      uniqueConsumers.push(record.consumer_id);
    }
  }

  let allConsumerIncidents = [];
  for (let consumer of uniqueConsumers) {
    allConsumerIncidents.push(
      allData.filter((record) => {
        return record.consumer_id === consumer;
      })
    );
  }

  let consumerWiseIncidents = [];
  let finalList = [];

  for (let individualConsumerIncidents of allConsumerIncidents) {
    consumerWiseIncidents.push(
      allData.filter((incident) => {
        return (
          incident.consumer_id === individualConsumerIncidents[0].consumer_id
        );
      })
    );
  }

  for (let villageName of uniqueVillages) {
    const newVillage = {
      [villageName]: consumerWiseIncidents.filter((consumer, index) => {
        return consumer[0].namedloc === villageName;
      }),
    };

    finalList.push(newVillage);
  }

  for (let [index, village] of uniqueVillages.entries()) {
    let mostActiveUser = [];
    let mostActiveUserCount = 0;

    for (let user of finalList[index][village]) {
      if (user.length > mostActiveUserCount) {
        mostActiveUser = user;
        mostActiveUserCount = user.length;
      }
    }
    let upTime = 0;
    let startTime = new Date("2024-09-07 12:00:00");
    const currentTime = new Date("2024-09-07 22:00:00");
    const totalDuration = currentTime - startTime;
    let i = 0;
    let previousType = 1;
    for (let incident of mostActiveUser.reverse()) {
      let reportedOn = new Date(incident.reported_on);
      if (previousType === 1) {
        upTime += Math.round((reportedOn - startTime) / 1000 / 60 / 60);
        startTime = reportedOn;
      }

      i++;
      if (i === (mostActiveUser.length) && incident.incident_type === 1) {
        upTime += Math.round((currentTime - reportedOn) / 1000 / 60 / 60);
      }
      previousType = incident.incident_type;
    }
    console.log("------------------------");
    console.log(`${village} has an power availabilty for ${Math.round(upTime)} hours in last ${totalDuration/1000/60/60} hours.\n\nUptime ${upTime*100/10}%.`);
    console.log("------------------------");
  }
}

async function setupIncidents() {
  const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "mseb",
    password: process.env.DB_PASSWORD,
    port: 5432,
  });

  db.connect();

  const consumers = (await db.query("select * from consumers")).rows;
  for (let i = 0; i < 3; i++) {
    incident.addIncident(Math.floor(Math.random() * (3 - 0)) + 0, consumers[0]);
  }
}

//setupConsumers();
//setupIncidents();
getUptimeByVillage();
