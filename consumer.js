import pg from "pg";
import * as waba from "./waba.js";
import { kml } from "@tmcw/togeojson";
import { DOMParser } from "xmldom";
import fs from "fs";
import inside from "point-in-polygon-hao";

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: "mseb",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

db.connect();

const kmlData = new DOMParser().parseFromString(
  fs.readFileSync(`${process.cwd()}/public/kml/18gm2.kml`, "utf8")
);
const villages = kml(kmlData).features;

function getVillageName(latitude, longitude) {
  let villageName;
  for (let village of villages) {
    let boundary = village.geometry.coordinates;
    if (inside([longitude, latitude], boundary)) {
      villageName = village.properties.name;
      console.log(`point in ${village.properties.name}`);
      break;
    }
  }
  return villageName;
}

async function sendReadReceipt(msgId) {
  await waba.sendReadReceipt(msgId);
}

async function addConsumer(consumerId, phone, name) {
  try {
    await db.query(
      "insert into consumers (id, phone, name) values ($1, $2, $3)",
      [consumerId, phone, name]
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updateConsumer(phone, latitude, longitude) {
  try {
    let address = getVillageName(latitude, longitude);
    if (address == undefined) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_APIKEY}`
      );
      const locationName = await response.json();
      address = locationName.results[0].address_components[1].long_name;
    }
    await db.query(
      "update consumers set meter_lat = $1, meter_lng = $2, namedloc=$3 where phone=$4",
      [latitude, longitude, address, phone]
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getConsumer(phone) {
  try {
    let result = (
      await db.query("select id, name from consumers where phone=$1", [phone])
    ).rows;
    if (result.length === 0) {
      return undefined;
    } else {
      return result[0];
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function sendNoLinkedPhoneFoundMsg(phone) {
  await waba.sendNoLinkedPhoneFoundMsg(phone);
}

async function sendIncidentTypeSelection(phone) {
  await waba.sendIncidentTypeSelection(phone);
}

async function sendLocationReq(phone) {
  await waba.sendLocationReq(phone);
}

async function sendAck(phone) {
  await waba.sendAck(phone);
}

export {
  sendReadReceipt,
  addConsumer,
  updateConsumer,
  getConsumer,
  sendNoLinkedPhoneFoundMsg,
  sendIncidentTypeSelection,
  sendLocationReq,
  sendAck,
  villages,
};
