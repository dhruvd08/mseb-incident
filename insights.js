import pg from "pg";

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

async function getUptimeByVillage(villageName) {
  const allData = (
    await db.query(
      "select * from incidents inner join consumers on incidents.consumer_id=consumers.id where consumers.namedloc=$1 order by incidents.reported_on asc",
      [villageName]
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
  let startTime = new Date("2024-09-07 00:00:00");
  const currentTime = new Date();
  const totalDuration = (currentTime - startTime) / 1000 / 60 /60;
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
      upTime += Math.round((currentTime - reportedOn) / 1000 / 60 / 60);
      console.log("went into second if statement")
    }
    previousType = incident.incident_type;
  }
  upTime = upTime * 100 / totalDuration;

  return upTime;
}

export { getUptimeByVillage };

console.log(Math.round(await getUptimeByVillage("Varoti Kh.")) + " %");
