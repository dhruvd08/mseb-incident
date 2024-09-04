let map;

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  const myLatlng = { lat: 18.23574, lng: 73.58042 };
  map = new Map(document.getElementById("map"), {
    center: myLatlng,
    zoom: 13,
    mapId: "MSEB_LAYOUT_MAP_ID",
  });

  let incidents = document.getElementById("incidents");
  incidents = JSON.parse(incidents.textContent);

  for (let incident of incidents){
    console.log(incident.meter_lat);
    placeMarkerAndPanTo({lat: incident.meter_lat, lng: incident.meter_lng}, map, `Reported ${incident.incident_type} on ${incident.reported_on} by ${incident.id}`);
  }
  
  // map.addListener("click", (e) => {
  //   placeMarkerAndPanTo(e.latLng, map);
  // });
}

function placeMarkerAndPanTo(latLng, map, title) {
  new google.maps.marker.AdvancedMarkerElement({
    position: latLng,
    map: map,
    title: title,
  });
  map.panTo(latLng);
}

initMap();


