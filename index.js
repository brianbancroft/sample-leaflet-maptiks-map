const accessToken = '<YOUR TOKEN HERE>'
const map = L.map("map").setView([48.3062302, -123.3942418], 10);
L.tileLayer(
  `https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${accessToken}`,
  {
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: "mapbox.light"
  }
).addTo(map);

// control that shows state info on hover
const info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info");
  this.update();
  return this._div;
};

info.update = function (props) {
  this._div.innerHTML =
    "<h4>Average Household Income</h4>" + (props ? "$" + props.total : "Hover over a census tract");
};

info.addTo(map);

const getColor = (d) => {
  let color;

  if (d > 150000) {
    color = "#0571b0";
  } else if (d > 110000) {
    color = "#92c5de";
  } else if (d > 90000) {
    color = "#f7e8f9";
  } else if (d > 60000) {
    color = "#f4a582";
  } else {
    color = "#ca0020";
  }
  return color;
}

const style = feature => ({
  weight: 2,
  opacity: 1,
  color: "white",
  dashArray: "3",
  fillOpacity: 0.7,
  fillColor: getColor(feature.properties.total)
})

const highlightFeature = (e) => {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties);
}

let geojson;

const resetHighlight = (e) => {
  geojson.resetStyle(e.target);
  info.update();
}

const zoomToFeature = (e) => {
  map.fitBounds(e.target.getBounds());
}

const onEachFeature = (feature, layer) => {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

geojson = L.geoJson(null, {
  style: style,
  onEachFeature: onEachFeature
}).addTo(map);

map.attributionControl.addAttribution(
  'Population data &copy; <a href="https://www.statcan.gc.ca/eng/start">Statistics Canada</a>'
);

const legend = L.control({ position: "bottomright" });

legend.onAdd = function (map) {
  const div = L.DomUtil.create("div", "info legend"),
    grades = [0, 60000, 90000, 110000, 150000],
    labels = [],
    from,
    to;

  for (const i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
      '<i style="background:' +
      getColor(from + 1) +
      '"></i> $' +
      from +
      (to ? "&ndash; $" + to : "+")
    );
  }

  div.innerHTML = labels.join("<br>");
  return div;
};

legend.addTo(map);

axios
  .get(
    "https://s3.amazonaws.com/cdn.brianbancroft.io/assets/sample-map-data/income-with-children.geojson"
  )
  .then(response => {
    geojson.addData(response.data);
  })
  .catch(console.error);
