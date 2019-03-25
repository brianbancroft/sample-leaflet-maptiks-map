var map = L.map("map").setView([48.4062302, -123.3942418], 12);
L.tileLayer(
  "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnJpYW5iYW5jcm9mdCIsImEiOiJsVGVnMXFzIn0.7ldhVh3Ppsgv4lCYs65UdA",
  {
    // ENTER THE MAP NAME HERE
    maptiks_id: "GoGeomatics Tracking Map",

    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: "mapbox.light"
  }
).addTo(map);

/*  ============== LAYER DEFINITIONS =======================================
 *
 * Layers go here. This is where you add the maptiks layer identifiers
 *
 *   =======================================================================
 */

var choropleth = L.geoJson(null, {
  style: choroplethStyle,
  onEachFeature: onEachFeature,
  // ENTER THE LAYER NAME HERE
  maptiks_id: "Polygon -> Income Layer"
}).addTo(map);

var pubPopup = "Loading...";
var popPopupOptions = {
  maxWidth: "500",
  className: "custom"
};

var pubMarkers = L.geoJSON(null, {
  // ENTER THE POINT LAYER NAME HERE
  maptiks_id: "Point -> Pub Markers",
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng, geojsonMarkerOptions);
  }
})
  .bindPopup(pubPopup, popPopupOptions)
  .addTo(map);

//  =====================================================

function pubMarkerClickEvent(e) {
  var popup = e.target.getPopup();

  popup.setContent(`
    <h3>${e.sourceTarget.feature.properties.name}</h3>
    <a href="${
      e.sourceTarget.feature.properties.url
    }" target="_blank">Website</a>
  `);
  popup.update();
}

pubMarkers.on("click", pubMarkerClickEvent);

// control that shows state info on hover
var info = L.control();

info.onAdd = function() {
  this._div = L.DomUtil.create("div", "info");
  this.update();
  return this._div;
};

info.update = function(props) {
  this._div.innerHTML =
    "<h4>Average Household Income</h4>" +
    (props ? "$" + props.total : "Hover over a census tract");
};

info.addTo(map);

// get color depending on population total value

function getColor(d) {
  let color;

  if (d > 150000) {
    color = "#0571b0";
  } else if (d > 110000) {
    color = "#92c5de";
  } else if (d > 90000) {
    color = "#FF0000";
  } else if (d > 60000) {
    color = "#BF0000";
  } else {
    color = "#400000";
  }
  return color;
}

function choroplethStyle(feature) {
  return {
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
    fillColor: getColor(feature.properties.total)
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.7
  });
  choropleth.bringToBack();

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
    pubMarkers.bringToFront();
  }

  info.update(layer.feature.properties);
}

function resetHighlight(e) {
  choropleth.resetStyle(e.target);
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

map.attributionControl.addAttribution(
  'Population data &copy; <a href="https://www.statcan.gc.ca/eng/start">Statistics Canada</a>'
);

var legend = L.control({ position: "bottomright" });

legend.onAdd = function(map) {
  var div = L.DomUtil.create("div", "info legend"),
    grades = [0, 60000, 90000, 110000, 150000],
    labels = [],
    from,
    to;

  for (var i = 0; i < grades.length; i++) {
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

const stats =
  "https://s3.amazonaws.com/cdn.brianbancroft.io/assets/sample-map-data/income-with-children.geojson";
axios
  .get(stats)
  .then(response => {
    choropleth.addData(response.data);
    choropleth.bringToBack();
  })
  .catch(console.error);

var geojsonMarkerOptions = {
  radius: 8,
  fillColor: "#ff7800",
  color: "#000",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

const pubs =
  "https://gist.githubusercontent.com/brianbancroft/2e6abac2ce26a9ff188ac4c8d17bb3ff/raw/10404a93a040ba2cb0224ef4c86fed8743d3a22f/map.geojson";
axios
  .get(pubs)
  .then(response => {
    pubMarkers.addData(response.data);
    pubMarkers.bringToFront();
  })
  .catch(console.error);
