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

    //console.log(mostActiveUser[0].namedloc);
    let upTime = 0;
    const startTime = new Date('7/9/2024').getMilliseconds();
    const totalDuration = new Date().getMilliseconds() - startTime;
    //console.log(totalDuration);
    let timeDiff;
    for (let incident of mostActiveUser){
        timeDiff = Math.abs(new Date().getMilliseconds() - incident.reported_on.getMilliseconds());
        //console.log(incident.incident_type);  
        if (incident.incident_type !== 0){
            timeDiff = 0-timeDiff;
        }

        upTime += timeDiff;
    }
    console.log(`${village} -> ${upTime * 100 / totalDuration}%`);
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
  for (let i = 0; i < 5; i++) {
    incident.addIncident(
      Math.floor(Math.random() * (3 - 0)) + 0,
      consumers[Math.floor(Math.random() * consumers.length)]
    );
  }
}

//setupConsumers();
//setupIncidents();
getUptimeByVillage();
