// AreaSearchManholeMap.jsx
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css"; // move your CSS here

const allManholeData = [
  { id: "1", area_name: "Hasmathpet", lat: 17.47687, lon: 78.48737 },
  { id: "2", area_name: "Hasmathpet", lat: 17.47538, lon: 78.49033 },
  { id: "3", area_name: "Hasmathpet", lat: 17.47494, lon: 78.49012 },
  // ... (rest of your manhole data)
];

export default function MapWardSearchComp() {
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const boundingBoxLayerRef = useRef(null);

  const [area, setArea] = useState("");
  const [status, setStatus] = useState(
    "Enter a location (e.g., Hasmathpet, Kondapur) within Hyderabad."
  );
  const [loading, setLoading] = useState(false);
  const [manholes, setManholes] = useState(allManholeData);

  useEffect(() => {
    // Initialize map
    mapRef.current = L.map("map").setView([17.385, 78.4867], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapRef.current);

    markersRef.current = L.featureGroup().addTo(mapRef.current);

    // Initial manholes
    addManholes(allManholeData);

    return () => {
      mapRef.current.remove();
    };
  }, []);

  const geocodeArea = async (query) => {
    let fullQuery = query;
    if (
      !query.toLowerCase().includes("hyderabad") &&
      !query.toLowerCase().includes("india")
    ) {
      fullQuery += ", Hyderabad, India";
    }

    const params = new URLSearchParams({
      q: fullQuery,
      format: "json",
      limit: 1,
      polygon_geojson: 1,
      addressdetails: 1,
      extratags: 1
    }).toString();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "User-Agent": "SewageBotWebApp/1.0 (anvirobot25@gmail.com)"
          }
        }
      );
      const data = await response.json();
      if (data.length > 0) {
        const first = data[0];
        return {
          lat: parseFloat(first.lat),
          lon: parseFloat(first.lon),
          geojson: first.geojson,
          displayName: first.display_name,
          boundingBox: first.boundingbox
            ? [
                parseFloat(first.boundingbox[0]),
                parseFloat(first.boundingbox[1]),
                parseFloat(first.boundingbox[2]),
                parseFloat(first.boundingbox[3])
              ]
            : null
        };
      }
      return null;
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  const filterManholesByProximity = (centerLat, centerLon, radiusKm = 5) => {
    const latDelta = radiusKm / 111;
    const lonDelta =
      radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

    return allManholeData.filter(
      (mh) =>
        mh.lat >= centerLat - latDelta &&
        mh.lat <= centerLat + latDelta &&
        mh.lon >= centerLon - lonDelta &&
        mh.lon <= centerLon + lonDelta
    );
  };

  const clearMapLayers = () => {
    markersRef.current.clearLayers();
    if (boundaryLayerRef.current) {
      mapRef.current.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }
    if (boundingBoxLayerRef.current) {
      mapRef.current.removeLayer(boundingBoxLayerRef.current);
      boundingBoxLayerRef.current = null;
    }
    setManholes([]);
  };

  const loadMapArea = (lat, lon, name) => {
    mapRef.current.setView([lat, lon], 14);
    L.marker([lat, lon])
      .addTo(markersRef.current)
      .bindPopup(`<b>${name}</b><br>Area Center`)
      .openPopup();
  };

  const addManholes = (manholesData) => {
    setManholes(manholesData);
    manholesData.forEach((mh) => {
      const icon = L.divIcon({
        className: "manhole-marker",
        html: `<span>${mh.id}</span>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker([mh.lat, mh.lon], { icon }).addTo(markersRef.current);
    });
  };

  const addGeoJsonBoundary = (geojson) => {
    if (boundaryLayerRef.current) {
      mapRef.current.removeLayer(boundaryLayerRef.current);
    }
    boundaryLayerRef.current = L.geoJSON(geojson, {
      style: {
        color: "#007bff",
        weight: 5,
        opacity: 0.8,
        fillColor: "#6ab04c",
        fillOpacity: 0.3
      }
    }).addTo(mapRef.current);
    mapRef.current.fitBounds(boundaryLayerRef.current.getBounds());
  };

  const addBoundingBox = (south, north, west, east) => {
    if (boundingBoxLayerRef.current) {
      mapRef.current.removeLayer(boundingBoxLayerRef.current);
    }
    const bounds = [
      [south, west],
      [north, east]
    ];
    boundingBoxLayerRef.current = L.rectangle(bounds, {
      color: "#ff7800",
      weight: 4,
      fillColor: "#ffbf00",
      fillOpacity: 0.2,
      dashArray: "5, 5"
    }).addTo(mapRef.current);
    mapRef.current.fitBounds(bounds);
  };

  const handleSearch = async () => {
    if (!area.trim()) {
      setStatus("Please enter an area name.");
      return;
    }
    setLoading(true);
    clearMapLayers();
    setStatus(`Searching for '${area}'...`);

    const result = await geocodeArea(area);

    setLoading(false);

    if (result) {
      const { lat, lon, geojson, displayName, boundingBox } = result;
      loadMapArea(lat, lon, displayName);
      if (geojson) {
        addGeoJsonBoundary(geojson);
        setStatus(`Map for '${displayName}' loaded with detailed boundary.`);
      } else if (boundingBox) {
        addBoundingBox(...boundingBox);
        setStatus(`Map for '${displayName}' loaded. Showing bounding box.`);
      } else {
        setStatus(`Map for '${displayName}' loaded. No boundary available.`);
      }
      const filtered = filterManholesByProximity(lat, lon, 5);
      addManholes(filtered);
      setStatus((prev) => `${prev} ${filtered.length} manholes shown.`);
    } else {
      setStatus(
        `Could not find results for '${area}'. Please try a more specific query.`
      );
    }
  };

  return (
    <div className="map-app">
      <div className="header">📍 Area & Manhole Search</div>
      <div className="container">
        <div className="sidebar">
          <div className="search-area">
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g., Hasmathpet, or Kondapur"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}>
              Search Area
            </button>
            {loading && <div className="loading-spinner"></div>}
          </div>
          <div
            className={`status-message ${
              status.includes("Please") ? "error-message" : ""
            }`}
          >
            {status}
          </div>
          <div className="manhole-list">
            <h3>Manholes:</h3>
            <ul>
              {manholes.length > 0 ? (
                manholes.map((mh) => (
                  <li key={mh.id}>
                    <span>ID: {mh.id}</span>
                    <span>
                      Lat: {mh.lat.toFixed(6)}, Lon: {mh.lon.toFixed(6)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="no-data">No nearby manholes found.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="map-section">
          <div id="map"></div>
        </div>
      </div>
    </div>
  );
}
