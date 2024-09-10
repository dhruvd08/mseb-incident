import pg from "pg";

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

/*
1. Get Unique villages
2. Get Uptime by village for a given duration
3. Get non-one incidents by village for a given duration
4. Get average resolution time by village for a given duration
*/

async function getUniqueVillages() {
  try {
    const allData = (
      await db.query(
        "select * from incidents inner join consumers on incidents.consumer_id=consumers.id order by incidents.reported_on asc"
      )
    ).rows;

    let uniqueVillages = [];
    for (let record of allData) {
      if (!uniqueVillages.includes(record.namedloc)) {
        uniqueVillages.push(record.namedloc);
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }

  return uniqueVillages;
}

async function getUptimeByVillage(villageName, start, end = new Date()) {
  try {
    const allData = (
      await db.query(
        "select * from incidents inner join consumers on incidents.consumer_id=consumers.id where consumers.namedloc=$1 and cast($2 as Date) < reported_on and reported_on < cast($3 as Date) order by incidents.reported_on asc",
        [villageName, start, end]
      )
    ).rows;

    let uniqueConsumers = [];
    for (let record of allData) {
      if (!uniqueConsumers.includes(record.consumer_id)) {
        uniqueConsumers.push(record.consumer_id);
      }
    }

    console.log(uniqueConsumers);

    let consumerWiseIncidents = [];
    for (let consumer of uniqueConsumers) {
      consumerWiseIncidents.push(
        allData.filter((record) => {
          return record.consumer_id === consumer;
        })
      );
    }
    // console.log(consumerWiseIncidents);
    let mostActiveUser = [];
    let mostActiveUserCount = 0;

    for (let user of consumerWiseIncidents) {
      if (user.length > mostActiveUserCount) {
        mostActiveUser = user;
        mostActiveUserCount = user.length;
      }
    }

    //console.log(mostActiveUser);

    let upTime = 0;
    let startTime = start;
    const endTime = end;
    const totalDuration = (endTime - startTime) / 1000 / 60 / 60;
    console.log(`Duration ${totalDuration}`);
    let i = 0;
    let previousType = 1;
    for (let incident of mostActiveUser) {
      let reportedOn = new Date(incident.reported_on);
      if (previousType === 1) {
        upTime += Math.round((reportedOn - startTime) / 1000 / 60 / 60);
        startTime = reportedOn;
      }

      i++;
      if (i === mostActiveUser.length && incident.incident_type === 1) {
        upTime += Math.round((endTime - reportedOn) / 1000 / 60 / 60);
        console.log("went into second if statement");
      }
      previousType = incident.incident_type;
    }
    upTime = (upTime * 100) / totalDuration;
    return { upTime: upTime };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getIncidentCount(villageName, start, end = new Date()) {
  try {
    const result = (
      await db.query(
        "select count(*) from incidents inner join consumers on incidents.consumer_id=consumers.id where consumers.namedloc=$1 and cast($2 as Date) < reported_on and reported_on < cast($3 as Date) and incident_type != 1",
        [villageName, start, end]
      )
    ).rows[0];
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getResolutionTime(villageName, start, end = new Date()) {}

export { getUptimeByVillage, getUniqueVillages, getIncidentCount, getResolutionTime };

//console.log((await getUniqueVillages()));

console.log(
  await getIncidentCount("Varoti Kh.", new Date("2024-09-08"), new Date())
);
