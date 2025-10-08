import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as XLSX from "xlsx";

// --- Assuming these components exist in the same directory ---
import ManholePopUp from "./ManholePopUp";
import WardDetailsPopUp from "./WardDetailsPopUp";
import FilterableWardSelect from "./FilterableWardSelect";

// --- Mapbox Access Token ---
mapboxgl.accessToken = "pk.eyJ1Ijoic2h1YmhhbWd2IiwiYSI6ImNtZGZ1YmRhdzBqMmcya3I1cThjYWloZnkifQ.5ZIhoOuwzrGin8wzM5-0nQ";

const MapComponent = () => {
  // --- Refs for Mapbox instance and container ---
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(new mapboxgl.Popup({ offset: 15, closeButton: false }));
  // Use a ref for the selected manhole ID so the map event listener can access the latest value
  const selectedManholeIdRef = useRef(null);

  // --- State Management ---
  const [selectedManholeLocation, setSelectedManholeLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [wardData, setWardData] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [wardPolygons, setWardPolygons] = useState({});
  // Add these states near the other useState hooks:
  const [zoneList, setZoneList] = useState([]);  // List of unique zones
  const [selectedZone, setSelectedZone] = useState("All"); // Current zone filter
  const [allManholeData, setAllManholeData] = useState([]); // Store all manhole rows


  // --- Helper: Convert Excel serial date to JS Date ---
  const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  };

  // --- Main Status Function ---
  const getManholeStatus = (operationdates) => {
    if (!operationdates) {
      return "safe";
    }

    let lastCleaned;

    // Case 1: Excel serial number
    if (typeof operationdates === "number") {
      lastCleaned = excelDateToJSDate(operationdates);
    }
    // Case 2: String (DD/MM/YYYY or DD-MM-YYYY)
    else if (typeof operationdates === "string") {
      const parts = operationdates.split(/[\/-]/);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        lastCleaned = new Date(`${year}-${month}-${day}`);
      }
    }

    // Validate
    if (!lastCleaned || isNaN(lastCleaned.getTime())) {
      console.error("Invalid date:", operationdates);
      return "safe";
    }

    const today = new Date();
    const diffTime = today - lastCleaned;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 20) return "danger";
    if (diffDays >= 10) return "warning";
    return "safe";
  };
  // Format any Excel date (serial or string) into DD/MM/YYYY for display
  const formatExcelDate = (value) => {
    if (!value) return "N/A";

    // If it's already a string, return as-is
    if (typeof value === "string") return value;

    // If it's a number (Excel serial)
    if (typeof value === "number") {
      const utc_days = Math.floor(value - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toLocaleDateString("en-GB"); // DD/MM/YYYY
    }

    return "Invalid Date";
  };

  // --- Main data loading and map initialization function ---
  const loadManholeData = async () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    try {
      setIsLoading(true);
      const response = await fetch("/datafiles/MH.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const manholeRows = XLSX.utils.sheet_to_json(sheet);

      setAllManholeData(manholeRows); // Save all data

      // Extract unique zones for dropdown
      const uniqueZones = [...new Set(manholeRows.map((row) => row.Zone))].filter(Boolean).sort();
      // console.log(uniqueZones.sort())
      setZoneList(["All", ...uniqueZones]);

      // Prepare full geojson (initially all zones)
      const geojsonData = {
        type: "FeatureCollection",
        features: manholeRows.map((row) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [row.longitude, row.latitude],
          },
          properties: {
            ...row,
            status: getManholeStatus(row.last_operation_date),
          },
          id: row.id,
        })),
      };

      if (map.current.getSource("manholes")) {
        map.current.getSource("manholes").setData(geojsonData);
      } else {
        map.current.addSource("manholes", {
          type: "geojson",
          data: geojsonData,
          promoteId: "id",
        });

        map.current.addLayer({
          id: "manhole-dots",
          type: "circle",
          source: "manholes",
          paint: {
            "circle-radius": 5,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#fff",
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#3b82f6",
              [
                "match",
                ["get", "status"],
                "safe",
                "#22c55e",
                "warning",
                "#fbbf24",
                "danger",
                "#ef4444",
                "#ccc",
              ],
            ],
          },
        });
      }

      setIsLoading(false);
    } catch (e) {
      setError(e.message);
      setIsLoading(false);
      console.error("Error loading and processing manhole data:", e);
    }
  };
// Filter manholes when zone changes
useEffect(() => {
  if (!map.current || !map.current.isStyleLoaded() || !map.current.getSource("manholes") || allManholeData.length === 0)
    return;

  const filtered = selectedZone === "All"
    ? allManholeData
    : allManholeData.filter((row) => row.Zone === selectedZone);

  const geojsonData = {
    type: "FeatureCollection",
    features: filtered.map((row) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [row.longitude, row.latitude] },
      properties: {
        ...row,
        status: getManholeStatus(row.last_operation_date),
      },
      id: row.id,
    })),
  };

  map.current.getSource("manholes").setData(geojsonData);
}, [selectedZone, allManholeData]);


  // --- Initial Map and Data Loading ---
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/shubhamgv/cmggj327600ke01pd15kqh8v6",
      center: [78.4794, 17.3940],
      zoom: 9.40,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    map.current.on("load", async () => {
      loadManholeData();
    });

    // --- Event Listeners ---
    map.current.on("click", "manhole-dots", (e) => {
      const clickedFeature = e.features[0];
      if (!clickedFeature) return;

      const clickedManholeId = clickedFeature.id;

      // Un-select the previously selected manhole using the ref
      if (selectedManholeIdRef.current !== null) {
        map.current.setFeatureState({ source: 'manholes', id: selectedManholeIdRef.current }, { selected: false });
      }

      // Select the new manhole
      map.current.setFeatureState({ source: 'manholes', id: clickedManholeId }, { selected: true });

      // Update the ref and state with the new manhole
      selectedManholeIdRef.current = clickedManholeId;
      setSelectedManholeLocation({
        ...clickedFeature.properties,
        latitude: clickedFeature.geometry.coordinates[1],
        longitude: clickedFeature.geometry.coordinates[0],
        lastCleaned: clickedFeature.properties.last_operation_date,
      });

      setSelectedWard(null);
      map.current.flyTo({ center: clickedFeature.geometry.coordinates, zoom: 18 });
    });

    map.current.on("mouseenter", "manhole-dots", (e) => {
      map.current.getCanvas().style.cursor = "pointer";
      if (e.features.length > 0) {
        const feature = e.features[0];
        popup.current
          .setLngLat(feature.geometry.coordinates)
          .setHTML(
            `<div id="mhpop" style="font-size: 8px; padding: 2px; text-align: center; background-color: white; border-radius: 1px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
  <strong>ID:</strong> ${feature.properties.id}<br/>
  <strong>Last Cleaned:</strong> ${formatExcelDate(feature.properties.last_operation_date)}
</div>`
          )
          .addTo(map.current);
      }
    });

    map.current.on("mouseleave", "manhole-dots", () => {
      map.current.getCanvas().style.cursor = "";
      popup.current.remove();
    });

  }, []);

  // --- Daily data update timer ---
  useEffect(() => {
    const dailyTimer = setInterval(() => {
      console.log("Re-calculating manhole status based on current date...");
      loadManholeData();
    }, 1000 * 60 * 60 * 24); // Rerun every 24 hours

    return () => clearInterval(dailyTimer); // Cleanup on unmount
  }, []);

  // --- Load Ward Data from Excel Files ---
  useEffect(() => {
    fetch("/datafiles/ward_coordinates.xlsx")
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const grouped = {};
        data.forEach((row) => {
          const name = row.Ward;
          const coord = [row.y, row.x];
          if (!grouped[name]) grouped[name] = [];
          grouped[name].push(coord);
        });
        setWardPolygons(grouped);
      })
      .catch((err) => console.error("Error loading ward coordinates:", err));

    fetch("/datafiles/ward_data.xlsx")
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const workbook = XLSX.read(ab, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setWardData(jsonData);
      })
      .catch((error) => console.error("Error loading ward data:", error));
  }, []);

  // --- Effect to Filter Manholes on the Map ---
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getSource("manholes")) return;
    const filterExpression = filter === "all" ? null : ["==", ["get", "status"], filter];
    map.current.setFilter("manhole-dots", filterExpression);
  }, [filter]);

  // --- Effect to Draw and Zoom to Selected Ward Polygon ---
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const removeWardLayer = () => {
      if (map.current.getLayer("ward-polygon-layer")) map.current.removeLayer("ward-polygon-layer");
      if (map.current.getLayer("ward-outline-layer")) map.current.removeLayer("ward-outline-layer");
      if (map.current.getSource("ward-polygon-source")) map.current.removeSource("ward-polygon-source");
    };
    removeWardLayer();
    if (selectedWard && wardPolygons[selectedWard]) {
      const coordinates = wardPolygons[selectedWard];
      const geojsonCoordinates = [coordinates.map(coord => [coord[1], coord[0]])];
      map.current.addSource("ward-polygon-source", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "Polygon", coordinates: geojsonCoordinates } },
      });
      map.current.addLayer({
        id: "ward-polygon-layer", type: "fill", source: "ward-polygon-source", paint: { "fill-color": "#1d4ed8", "fill-opacity": 0.1 },
      });
      map.current.addLayer({
        id: "ward-outline-layer", type: "line", source: "ward-polygon-source", paint: { "line-color": "#1d4ed8", "line-width": 2 }
      });
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => { bounds.extend([coord[1], coord[0]]); });
      map.current.fitBounds(bounds, { padding: 40, duration: 1000 });
    }
  }, [selectedWard, wardPolygons]);

  // --- Handlers ---
  const clearManholeSelection = () => {
    if (selectedManholeIdRef.current !== null && map.current && map.current.getSource('manholes')) {
      map.current.setFeatureState({ source: 'manholes', id: selectedManholeIdRef.current }, { selected: false });
    }
    selectedManholeIdRef.current = null;
    setSelectedManholeLocation(null);
  };
  const handleClosePopup = () => clearManholeSelection();
  const handleGenerateReport = () => { console.log("Report generated and saved!"); clearManholeSelection(); };
  const handleAssignBot = () => { console.log("Successfully booked a bot."); clearManholeSelection(); };
  const handleJumpToLocation = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (!isNaN(lat) && !isNaN(lon) && map.current) {
      map.current.flyTo({ center: [lon, lat], zoom: 18 });
    }
  };
  const handleWardChange = (e) => {
    clearManholeSelection();
    setSelectedWard(e.target.value);
  };
  const handleReset = () => {
    clearManholeSelection();
    setSelectedWard(null);
    if (map.current) {
      map.current.flyTo({ center: [78.4894, 17.4740], zoom: 14.69, });
    }
  };

  return (
    <div className="map-container w-full flex gap-1">
      {/* --- Left section: Controls + Map --- */}
      <div
        className="transition-all relative duration-500 w-full"
        style={{ width: selectedManholeLocation || selectedWard ? "65%" : "100%", }}
      >
        <div className="shadow-md shadow-gray-500 p-6 mb-4 rounded-xl bg-white">
          {/* Top Controls */}
          <div className="flex justify-between align-middle flex-wrap gap-2">
            <p className="font-semibold text-md">Interactive Hotspot Manhole Map</p>
            <div className="flex justify-center align-middle gap-4 ml-auto">
              {["all", "safe", "warning", "danger"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{ paddingBlock: "5px", borderRadius: "5px" }}
                  className={`${filter === f ? "btn-blue" : "btn-blue-outline"} text-sm rounded-md hover:scale-105 hover:shadow-md hover:shadow-gray-300 duration-150`}
                >
                  {f === "all" ? "All Locations" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Bottom Controls */}
          <div className="mt-4 flex flex-col justify-start align-middle gap-4 pb-3">
            <div className="flex items-center gap-5 text-sm">
              <span className="flex items-center gap-1 space-x-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>Safe</span>
              <span className="flex items-center gap-1 space-x-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Warning</span>
              <span className="flex items-center gap-1 space-x-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>Danger</span>
            </div>
            <div className="flex gap-3 justify-start align-middle flex-wrap">
              <input type="number" placeholder="Latitude.." value={latInput} onChange={(e) => setLatInput(e.target.value)} className="hover:shadow-md border border-gray-300 rounded-sm bg-white hover:bg-gray-50 px-2 py-1 w-auto max-w-[150px]" />
              <input type="number" placeholder="Longitude.." value={lonInput} onChange={(e) => setLonInput(e.target.value)} className="hover:shadow-md border border-gray-300 rounded-sm bg-white hover:bg-gray-50 px-2 py-1 w-auto max-w-[150px]" />
              <button onClick={handleJumpToLocation} className="btn-blue btn-hover text-sm ml-3" style={{ paddingBlock: "6px", borderRadius: "8px" }}>Go</button>
              <FilterableWardSelect wardData={wardData} selectedWard={selectedWard} setSelectedWard={setSelectedWard} setSelectedManholeLocation={setSelectedManholeLocation} />
             <select
  value={selectedZone}
  onChange={(e) => setSelectedZone(e.target.value)}
  className="hover:shadow-md border border-gray-300 rounded-sm bg-white hover:bg-gray-50 px-2 py-1 w-auto max-w-[160px]"
>
  {zoneList.map((zone, idx) => (
    <option key={idx} value={zone}>
      {zone}
    </option>
  ))}
</select>

            </div>

          </div>
          {/* Map Container */}
          <div
            className="map-box relative rounded-lg overflow-hidden border border-gray-300"
            style={{ height: "445.52px", opacity: 1 }}
          >
            <button onClick={handleReset} className="bg-white absolute right-2 top-2 z-[500] rounded px-2 py-1 text-xs border border-gray-400 hover:bg-gray-100">Recenter</button>
            <div ref={mapContainer} className="h-full w-full" />
            {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">Loading map...</div>}
            {error && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 text-red-500">Error: {error}</div>}
            <div className="bg-[#ffffff] absolute left-2 bottom-2 z-[900] rounded-xl p-4 py-5 text-[12px] text-black flex flex-col gap-1">
              <span className="flex items-center gap-3 space-x-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>Safe - Regular Maintenance
              </span>
              <span className="flex items-center gap-3 space-x-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>Warning - Require Attention
              </span>
              <span className="flex items-center gap-3 space-x-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>Danger - Immediate Action Needed
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* --- Right section: Pop-ups --- */}
      <div
        className="db-popup-container overflow-x-hidden h-[665px] overflow-y-auto "
        style={{ width: selectedManholeLocation || selectedWard ? "35%" : "0%", }}
      >
        {/* Ward Details Popup */}
        {selectedWard && !selectedManholeLocation && (
          <div className="dB-Popup w-full flex justify-start h-full place-items-start transition-all duration-500">
            <WardDetailsPopUp selectedWard={selectedWard} setSelectedWard={setSelectedWard} wardData={wardData} />
          </div>
        )}
        {/* Manhole Details Popup */}
        {selectedManholeLocation && (
          <div className="dB-Popup w-full flex justify-start place-items-start h-full transition-all duration-500">
            <ManholePopUp
              selectedLocation={selectedManholeLocation}
              onClose={handleClosePopup}
              onGenerateReport={handleGenerateReport}
              onAssignBot={handleAssignBot}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;