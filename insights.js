import pg from "pg";

pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (value) => value);

pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (value) => value);

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

    return uniqueVillages;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getUptimeByVillage(villageName, start, end = new Date()) {
  console.log(`Start date: ${start}\n End date ${end}`);
  try {
    const allData = (
      await db.query(
        "select incidents.id, incident_type, reported_on, incidents.consumer_id as consumer_id from incidents inner join consumers on incidents.consumer_id=consumers.id where consumers.namedloc=$1 and cast($2 as Date) < reported_on and reported_on < cast($3 as Date) order by incidents.reported_on asc",
        [villageName, start, end]
      )
    ).rows;

    console.log(allData);

    let uniqueConsumers = [];
    for (let record of allData) {
      if (!uniqueConsumers.includes(record.consumer_id)) {
        uniqueConsumers.push(record.consumer_id);
      }
    }



    let consumerWiseIncidents = [];
    for (let consumer of uniqueConsumers) {
      consumerWiseIncidents.push(
        allData.filter((record) => {
          return record.consumer_id === consumer;
        })
      );
    }
 
    let mostActiveUser = [];
    let mostActiveUserCount = 0;

    for (let user of consumerWiseIncidents) {
      if (user.length > mostActiveUserCount) {
        mostActiveUser = user;
        mostActiveUserCount = user.length;
      }
    }

 

    let upTime = 0;
    let startTime = new Date(start);
    const endTime = new Date(end);
    const totalDuration = (endTime - startTime) / 1000 / 60;
    console.log(`Duration ${totalDuration}`);
    let i = 0;
    let previousIncidentType = await getPreviousDayLastIncident(
      mostActiveUser[0].consumer_id,
      mostActiveUser[0].reported_on
    );
    console.log(`Previous type ${previousIncidentType}`);
    for (let incident of mostActiveUser) {
      let reportedOn = new Date(incident.reported_on);
      if (previousIncidentType === 1) {
        upTime += (reportedOn - startTime) / 1000 / 60;
        startTime = reportedOn;
      }

      i++;
      if (i === mostActiveUser.length && incident.incident_type === 1) {
        upTime += (endTime - reportedOn) / 1000 / 60;
        console.log("went into second if statement");
      }
      previousIncidentType = incident.incident_type;
    }
    console.log(`Uptime ${upTime}` );
    upTime = (upTime * 100) / totalDuration;
    return { upTime_inPerc: upTime };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getIncidentCount(villageName, start, end) {
  start = new Date(`${start.getFullYear()}-${start.getMonth()+1}-${start.getDate()}`);
  end = new Date(`${end.getFullYear()}-${end.getMonth()+1}-${end.getDate()+1}`);

  try {
    const result = (
      await db.query(
        "select count(*) from incidents inner join consumers on incidents.consumer_id=consumers.id where consumers.namedloc=$1 and reported_on between cast($2 as Date) and cast($3 as Date) and incident_type != 1",
        [villageName, start, end]
      )
    ).rows[0];
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getPreviousDayLastIncident(consumer_id, currentDate) {
  try {
    let cDate = new Date(currentDate);
    //console.log(`Current date is ${cDate.toLocaleString()}`);
    const previousDate = new Date(cDate.setDate(cDate.getDate() - 1));
    //console.log(`Previous date is ${previousDate.toLocaleString()}`);
    const result = (
      await db.query(
        "select incident_type from incidents where consumer_id=$1 and cast(reported_on as date)=$2 order by reported_on desc",
        [consumer_id, previousDate]
      )
    ).rows[0];

    return result === undefined ? 1 : result.incident_type;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getResolutionTime(villageName, start, end = new Date()) {
  try {
    const allData = (
      await db.query(
        "select incidents.id, reported_on, incident_type, consumer_id as consumer_id from incidents inner join consumers on incidents.consumer_id=consumers.id where consumers.namedloc=$1 and cast($2 as Date) < reported_on and reported_on < cast($3 as Date) order by incidents.reported_on asc",
        [villageName, start, end]
      )
    ).rows;

    //console.log(allData);

    let uniqueConsumers = [];
    for (let record of allData) {
      if (!uniqueConsumers.includes(record.consumer_id)) {
        uniqueConsumers.push(record.consumer_id);
      }
    }

    //console.log(uniqueConsumers);

    let consumerWiseIncidents = [];
    for (let consumer of uniqueConsumers) {
      consumerWiseIncidents.push(
        allData.filter((record) => {
          return record.consumer_id === consumer;
        })
      );
    }

    let totalResolutionTime = 0;
    let numberOfIncidentsResolved = 0;
    let startTime = new Date(start);
    let incidentResolutionTime = 0;
    for (let consumerIncidents of consumerWiseIncidents) {
      // Fetch previous day's last incident type -lit
      let previousIncidentType = await getPreviousDayLastIncident(
        consumerIncidents[0].consumer_id,
        consumerIncidents[0].reported_on
      );
      console.log(`Previous day last incident type ${previousIncidentType}`);
      for (let consumerIncident of consumerIncidents) {
        console.log(consumerIncident);
        // if lit = 1 and currenttype != 1; set starttime = current reported time (new issue reported)
        if (
          previousIncidentType === 1 &&
          consumerIncident.incident_type !== 1
        ) {
          startTime = new Date(consumerIncident.reported_on);
        }
        // if lit != 1 and currenttype = 1; set starttime = ? (issue resolved)
        else if (
          previousIncidentType !== 1 &&
          consumerIncident.incident_type === 1
        ) {
          incidentResolutionTime =
            (new Date(consumerIncident.reported_on) - startTime) / 1000 / 60;
          console.log(
            `Incident resolution time ${incidentResolutionTime} mins.`
          );
          totalResolutionTime += incidentResolutionTime;
          numberOfIncidentsResolved++;
          startTime = new Date();
        }
        // if lit != 1 and currrentype != 1; don't change starttime (issue continues)
        else if (
          previousIncidentType !== 1 &&
          consumerIncident.incident_type !== 1
        ) {
        }
        // if lit = 1 and currenttype = 1; set starttime = ? (just a notificaitonn of continued supply)
        else if (
          previousIncidentType === 1 &&
          consumerIncident.incident_type === 1
        ) {
          startTime = new Date();
        }
        // in all cases, set lit = currenttype
        previousIncidentType = consumerIncident.incident_type;
        console.log(`Start time ${startTime}`);
      }
    }

    return {
      averageResolutionTime_inMins:
        numberOfIncidentsResolved !== 0 ? totalResolutionTime / numberOfIncidentsResolved : 0,
      incidentsResolvedCount: numberOfIncidentsResolved,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export {
  getUptimeByVillage,
  getUniqueVillages,
  getIncidentCount,
  getResolutionTime,
};

//console.log((await getUniqueVillages()));

// console.log(
//   await getUptimeByVillage(
//     "Harpud",
//     new Date("2024-09-1"),
//     new Date("2024-09-16")
//   )
// );
