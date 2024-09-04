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

  let incident_name;
  for (let incident of incidents) {
    switch (incident.incident_type) {
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

    let timeStamp = new Date(incident.reported_on);
    timeStamp = timeStamp.toLocaleDateString() + ", " + timeStamp.toLocaleTimeString();
    placeMarkerAndPanTo(
      { lat: incident.meter_lat, lng: incident.meter_lng },
      map,
      `${incident_name} reported at ${timeStamp} by ${incident.id} in ${incident.namedloc}`
    );
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
