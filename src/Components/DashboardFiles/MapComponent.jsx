import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as XLSX from "xlsx";
import { LocateFixed , Map } from 'lucide-react';

// --- Assuming these components exist in the same directory ---
import ManholePopUp from "./ManholePopUp";
import WardDetailsPopUp from "./WardDetailsPopUp";

// --- Mapbox Access Token ---
mapboxgl.accessToken = "pk.eyJ1Ijoic2h1YmhhbWd2IiwiYSI6ImNtZGZ1YmRhdzBqMmcya3I1cThjYWloZnkifQ.5ZIhoOuwzrGin8wzM5-0nQ";

const MapComponent = () => {
  // --- Refs for Mapbox instance and container ---
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(new mapboxgl.Popup({ offset: 15, closeButton: false }));
  const selectedManholeIdRef = useRef(null);

  // --- Map Style Definitions ---
const mapStyles = [
  {      
    url: "mapbox://styles/shubhamgv/cmggj327600ke01pd15kqh8v6",
    img: "/images/satilight.png" // or any path to your image
  },
  { 
    url: "mapbox://styles/shubhamgv/cmdr5g1b2000c01sd8h0y6awy",
    img: "/images/street.png" // replace with your actual image
  }
];


  // --- State Management ---
  const [selectedManholeLocation, setSelectedManholeLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  
  // wardDetailsMap will store details for popup: { 'Area_name': { detail_1, detail_2, ... } }
  const [wardDetailsMap, setWardDetailsMap] = useState({}); 
  // wardPolygons stores coordinates as { 'Area_name': [[Lon, Lat], ...] }
  const [wardPolygons, setWardPolygons] = useState({}); 

  // --- HIERARCHICAL FILTER STATES ---
  // const [cityList, setCityList] = useState([]); // REMOVED
  // const [selectedCity, setSelectedCity] = useState("All"); // REMOVED

  const [divisionList, setDivisionList] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("All"); // Now the top-level filter

  const [areaNameList, setAreaNameList] = useState([]);
  const [selectedAreaName, setSelectedAreaName] = useState("All");

  // --- Zone Filter State (Kept) ---
  const [zoneList, setZoneList] = useState([]);
  const [selectedZone, setSelectedZone] = useState("All");

  // --- Original States ---
  const [allManholeData, setAllManholeData] = useState([]);
  const [mapStyle, setMapStyle] = useState(mapStyles[0].url);


  // --- HELPER FUNCTIONS ---

  // Helper: Convert Excel serial date to JS Date
  const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  };

  // Main Status Function
  const getManholeStatus = (operationdates) => {
    if (!operationdates) return "safe";

    let lastCleaned;
    if (typeof operationdates === "number") {
      lastCleaned = excelDateToJSDate(operationdates);
    } else if (typeof operationdates === "string") {
      const parts = operationdates.split(/[\/-]/);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        lastCleaned = new Date(`${year}-${month}-${day}`);
      }
    }

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
    if (typeof value === "string") return value;
    if (typeof value === "number") {
      const utc_days = Math.floor(value - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toLocaleDateString("en-GB"); // DD/MM/YYYY
    }
    return "Invalid Date";
  };

  /**
   * Generates GeoJSON features from the filtered manhole data.
   */
  const generateManholeGeoJSON = (data) => ({
    type: "FeatureCollection",
    features: data.map((row) => ({
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
  });

  /**
   * Adds or updates the 'manholes' source and 'manhole-dots' layer on the map.
   */
  const updateMapLayers = (dataRows) => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const geojsonData = generateManholeGeoJSON(dataRows);

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
  };

  // Helper to clear the drawn Ward/Area layer
  const removeWardLayer = () => {
    if (!map.current) return;
    if (map.current.getLayer("ward-polygon-layer")) map.current.removeLayer("ward-polygon-layer");
    if (map.current.getLayer("ward-outline-layer")) map.current.removeLayer("ward-outline-layer");
    if (map.current.getSource("ward-polygon-source")) map.current.removeSource("ward-polygon-source");
  };

  // Helper to clear the Mapbox pop-up
  const removeMapboxPopup = () => {
    if (popup.current) {
      popup.current.remove();
    }
  };


  // --- Initial Data Loading ---
  const initialLoadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/datafiles/MH.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const manholeRows = XLSX.utils.sheet_to_json(sheet);

      setAllManholeData(manholeRows); // Store all data

      // --- Initialize Hierarchy Lists (Division is now the top level) ---
      const uniqueDivisions = [...new Set(manholeRows.map((row) => row.Division))].filter(Boolean).sort();
      setDivisionList(["All", ...uniqueDivisions]); // "All" is the default unselected state

      const uniqueZones = [...new Set(manholeRows.map((row) => row.Zone))].filter(Boolean).sort();
      // setZoneList(["All", ...uniqueZones]); // Zone list is better populated after Area selection

      // Update layers once the map is ready
      if (map.current && map.current.isStyleLoaded()) {
        updateMapLayers(manholeRows);
      }

      setIsLoading(false);
    } catch (e) {
      setError(e.message);
      setIsLoading(false);
      console.error("Error loading manhole data:", e);
    }
  };

  // Handler to change map style
  const handleStyleChange = (newStyleUrl) => {
    if (map.current && newStyleUrl !== mapStyle) {
      setMapStyle(newStyleUrl);
      map.current.setStyle(newStyleUrl);
    }
  };

  // --- HIERARCHY HANDLERS ---

  // 1. Division Change Handler (Now the top-level)
  const handleDivisionChange = (divisionValue) => {
    removeMapboxPopup(); 
    clearManholeSelection();
    setSelectedDivision(divisionValue);
    setSelectedAreaName("All");
    setSelectedZone("All");

    let areas = [];
    if (divisionValue !== "All") {
      // Filter areas based only on selected Division
      const divisionData = allManholeData.filter(row => row.Division === divisionValue);
      areas = [...new Set(divisionData.map(row => row.Area_name))].filter(Boolean).sort();
    }
    setAreaNameList(["All", ...areas]);
    setZoneList([]); // Clear Zone list until Area Name is selected
  };


  // 2. Area Name Change Handler (This triggers the Zoom & Polygon draw)
  const handleAreaNameChange = (areaValue) => {
    removeMapboxPopup(); 
    clearManholeSelection();
    setSelectedAreaName(areaValue);
    setSelectedZone("All");

    let zones = [];
    if (selectedDivision !== "All" && areaValue !== "All") {
      const areaData = allManholeData.filter(row =>
        row.Division === selectedDivision &&
        row.Area_name === areaValue
      );
      zones = [...new Set(areaData.map(row => row.Zone))].filter(Boolean).sort();
      setZoneList(["All", ...zones]);
    } else {
        setZoneList([]); 
    }
    
  };
  // 3. Zone Change Handler (Optional Filter)
  const handleZoneChange = (zoneValue) => {
    removeMapboxPopup(); 
    clearManholeSelection();
    setSelectedZone(zoneValue);
  };

  // --- Effect to Apply Status Filter ---
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer("manhole-dots")) return;

    clearManholeSelection(); 

    const filterExpression = filter === "all" ? null : ["==", ["get", "status"], filter];
    map.current.setFilter("manhole-dots", filterExpression);

  }, [filter]); 

  // --- Effect to Filter Manholes (Updated to use 3 levels: Division > Area > Zone) ---
  useEffect(() => {
    if (allManholeData.length === 0 || !map.current || !map.current.isStyleLoaded()) return;

    // --- HIERARCHY CHECK: MANDATORY DIVISION AND AREA NAME ---
    if (selectedDivision === "All" || selectedAreaName === "All") {
       
      updateMapLayers([]);
      return;
    }

    let filtered = allManholeData.filter((row) => {
      // Filter by mandatory hierarchy
      const matchesHierarchy = (
        row.Division === selectedDivision &&
        row.Area_name === selectedAreaName
      );

      if (!matchesHierarchy) return false;

      // Filter by optional Zone
      if (selectedZone !== "All" && row.Zone !== selectedZone) {
        return false;
      }

      return true;
    });

    updateMapLayers(filtered);

  }, [selectedDivision, selectedAreaName, selectedZone, allManholeData]);


  // --- Initial Map and Data Loading ---
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [78.4794, 17.3940],
      zoom: 9.40,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    map.current.on("load", initialLoadData);

    map.current.on("style.load", () => {
      // Re-run the main filter logic to re-populate the map dots
      setSelectedDivision((current) => current);
      // Re-apply Status Filter
      const filterExpression = filter === "all" ? null : ["==", ["get", "status"], filter];
      if (map.current.getLayer("manhole-dots")) {
        map.current.setFilter("manhole-dots", filterExpression);
      }

      // Re-apply Manhole Selection
      if (selectedManholeIdRef.current !== null) {
        map.current.setFeatureState({ source: 'manholes', id: selectedManholeIdRef.current }, { selected: true });
      }
    });

    // --- Event Listeners (NO CHANGE) ---
    map.current.on("click", "manhole-dots", (e) => {
      const clickedFeature = e.features[0];
      if (!clickedFeature) return;

      const clickedManholeId = clickedFeature.id;

      if (selectedManholeIdRef.current !== null) {
        map.current.setFeatureState({ source: 'manholes', id: selectedManholeIdRef.current }, { selected: false });
      }

      map.current.setFeatureState({ source: 'manholes', id: clickedManholeId }, { selected: true });

      selectedManholeIdRef.current = clickedManholeId;
      setSelectedManholeLocation({
        ...clickedFeature.properties,
        latitude: clickedFeature.geometry.coordinates[1],
        longitude: clickedFeature.geometry.coordinates[0],
        lastCleaned: clickedFeature.properties.last_operation_date,
      });

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

  // --- Daily data update timer (NO CHANGE) ---
  useEffect(() => {
    const dailyTimer = setInterval(() => {
      console.log("Re-calculating manhole status based on current date and re-loading data...");
      initialLoadData();
    }, 1000 * 60 * 60 * 24);

    return () => clearInterval(dailyTimer);
  }, []);

// --- Effect for Coordinates and Ward Details (NO CHANGE, data loading logic is fine) ---
useEffect(() => {
  // Load coordinates and ward details from the single file
  fetch("/datafiles/ward_coordinates.xlsx")
    .then(res => res.arrayBuffer())
    .then(ab => {
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      const allRows = XLSX.utils.sheet_to_json(ws, { defval: null });

      const groupedCoords = {};
      const detailsMap = {};
      
      const uniqueAreaNames = new Set(); 

      allRows.forEach(row => {
        const areaRaw = row.Area_name ?? row.area ?? row["Area Name"] ?? row["area_name"];
        if (!areaRaw) return;
        const area = String(areaRaw).trim();

        const lonVal = row.longitude ?? row.Longitude ?? row.lon ?? row.x ?? row.X;
        const latVal = row.latitude ?? row.Latitude ?? row.lat ?? row.y ?? row.Y;
        if (lonVal != null && latVal != null) {
          const idx = (row.vertex_index ?? row.vertex ?? row.index ?? null);

          if (!groupedCoords[area]) groupedCoords[area] = [];

          groupedCoords[area].push({
            lon: Number(lonVal),
            lat: Number(latVal),
            idx: (idx !== null && !isNaN(Number(idx))) ? Number(idx) : groupedCoords[area].length
          });
        }

        if (!uniqueAreaNames.has(area)) {
          detailsMap[area] = {
            Area_name: area,
            ...row 
          };
          delete detailsMap[area].longitude; 
          delete detailsMap[area].latitude;
          delete detailsMap[area].lon; 
          delete detailsMap[area].lat;
          delete detailsMap[area].x; 
          delete detailsMap[area].y;
          delete detailsMap[area].vertex_index;
          delete detailsMap[area].vertex;
          delete detailsMap[area].index;
          uniqueAreaNames.add(area);
        }
      });

      Object.keys(groupedCoords).forEach(area => {
        const coords = groupedCoords[area]
          .sort((a, b) => a.idx - b.idx)
          .map(p => [p.lon, p.lat]);

        if (coords.length > 0) {
          const first = coords[0];
          const last = coords[coords.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            coords.push([first[0], first[1]]);
          }
        }

        groupedCoords[area] = coords;
      });

      setWardPolygons(groupedCoords);
      setWardDetailsMap(detailsMap);
    })
    .catch(err => console.error("Error loading combined ward data:", err));
}, []);


/**
 * Draw & zoom to polygon for the selectedAreaName. (Logic is correct, using case-insensitive match)
 */
useEffect(() => {
  if (!map.current || !map.current.isStyleLoaded()) return;

  // Remove any previous polygon
  removeWardLayer();

  if (!selectedAreaName || selectedAreaName === "All") return;

  // Use case-insensitive match for Area_name keys
  const normalized = String(selectedAreaName).trim().toLowerCase();
  const matchKey = Object.keys(wardPolygons).find(k => k.trim().toLowerCase() === normalized);

  if (!matchKey) {
    console.warn("No polygon found for area:", selectedAreaName);
    return;
  }

  const coords = wardPolygons[matchKey];

  if (!Array.isArray(coords) || coords.length < 4) {
    console.warn("Insufficient coords for polygon:", matchKey, coords);
    return;
  }

  const geojson = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: { name: matchKey }
  };

  // Add source and layers for the polygon border
  if (map.current.getSource("ward-polygon-source")) {
    map.current.getSource("ward-polygon-source").setData(geojson);
  } else {
    map.current.addSource("ward-polygon-source", { type: "geojson", data: geojson });
    map.current.addLayer({
      id: "ward-polygon-layer",
      type: "fill",
      source: "ward-polygon-source",
      paint: { "fill-color": "#1d4ed8", "fill-opacity": 0.1 },
    });
    map.current.addLayer({
      id: "ward-outline-layer",
      type: "line",
      source: "ward-polygon-source",
      paint: { "line-color": "#1d4ed8", "line-width": 2 },
    });
  }

  // Fit to bounds
  const bounds = new mapboxgl.LngLatBounds();
  coords.forEach(c => bounds.extend(c)); // coords are [lon, lat]
  map.current.fitBounds(bounds, { padding: 40, duration: 1000 });
  console.log("Zoomed to area and drawn border:", matchKey);

}, [selectedAreaName, wardPolygons, mapStyle]);

// Get the matched key for the Area Name popup (Necessary for case-insensitivity)
const normalized = selectedAreaName && selectedAreaName !== "All" ? String(selectedAreaName).trim().toLowerCase() : null;
const finalMatchKey = normalized ? Object.keys(wardPolygons).find(k => k.trim().toLowerCase() === normalized) : null;
const selectedWardForPopup = finalMatchKey ? wardDetailsMap[finalMatchKey] : null;


// --- Handlers (Simplified and Updated for new hierarchy) ---

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

  // UPDATED: Now clears all filters and resets map
  const handleReset = () => {
    clearManholeSelection();
    removeWardLayer(); // Clears the polygon/area highlight
    setSelectedDivision("All");
    setSelectedAreaName("All");
    setSelectedZone("All");
    // Reset secondary lists
    setAreaNameList([]);
    setZoneList([]); 

    // Re-populate Division list from allManholeData (as set in initialLoadData)
    const uniqueDivisions = [...new Set(allManholeData.map((row) => row.Division))].filter(Boolean).sort();
    setDivisionList(["All", ...uniqueDivisions]);
    // setZoneList(["All", ...new Set(allManholeData.map((row) => row.Zone))].filter(Boolean).sort()); // Removed initial zone list populating

    if (map.current) {
      map.current.flyTo({ center: [78.4894, 17.4740], zoom: 14.69, });
    }
  };

  return (
    <div className="map-container w-full flex gap-1   ">
      {/* --- Left section: Controls + Map --- */}
      <div
        className="transition-all relative duration-500 w-full"
        style={{ width: selectedManholeLocation || selectedWardForPopup ? "65%" : "100%", }}
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

              {/* 1. Division Select (Now the top-level filter) */}
              <select
                value={selectedDivision}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="hover:shadow-md border border-gray-300 rounded-sm bg-white hover:bg-gray-50 px-2 py-1 w-auto max-w-[150px]"
              >
                <option value="All">Select Division</option>
                {divisionList.filter(d => d !== "All").map((division, idx) => (
                  <option key={idx} value={division}>
                    {division}
                  </option>
                ))}
              </select>

              {/* 2. Area Name Select */}
              <select
                value={selectedAreaName}
                onChange={(e) => handleAreaNameChange(e.target.value)}
                disabled={selectedDivision === "All"}
                className="hover:shadow-md border border-gray-300 rounded-sm bg-white hover:bg-gray-50 px-2 py-1 w-auto max-w-[150px]"
              >
                <option value="All">Select Ward</option>
                {areaNameList.filter(a => a !== "All").map((area, idx) => (
                  <option key={idx} value={area}>
                    {area}
                  </option>
                ))}
              </select>

              {/* 3. Zone Select (Optional Filter) */}
              <select
                value={selectedZone}
                onChange={(e) => handleZoneChange(e.target.value)}
                disabled={selectedAreaName === "All"}
                className="hover:shadow-md border border-gray-300 rounded-sm bg-white hover:bg-gray-50 px-2 py-1 w-auto max-w-[160px]"
              >
                <option value="All">Select Zone</option>
                {zoneList.filter(z => z !== "All").map((zone, idx) => (
                  <option key={idx} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>

            </div>

          </div>
          {/* Map Container */}
          <div
            className="map-box relative rounded-lg overflow-hidden border  border-gray-300"
            style={{ height: "445.52px", opacity: 1 }}
          >
            {/* Reset Button */}
            <button onClick={handleReset} className=" bg-[#eee] absolute right-4.5 top-2 z-[500] rounded px-1.5 py-1 text-xs  border-gray-400 cursor-pointer hover:bg-[#fff]"> <LocateFixed className="font-light w-8.5" /></button>

            {/* --- LAYER SELECT DROPDOWN (NO CHANGE) --- */}
            <div className="absolute right-2 top-10 z-[500] group mt-3">
              <button className=" bg-[#eee] border cursor-pointer border-gray-300 shadow-md rounded-md w-12  h-10   mr-2 flex items-center justify-center hover:bg-gray-100 transition">
 <Map />
  </button>
   {/* Dropdown (hover-down) */}
  <div className="absolute top-full mt-1 left--4 grid grid-row-2 gap-1 w-13.5  rounded-md overflow-hidden transform scale-y-0 opacity-0 origin-top transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100 ">
    {mapStyles.map((style) => (
      <button
        key={style.url}
        onClick={() => handleStyleChange(style.url)}
        className={` w-12 h-12 border-2 rounded-md overflow-hidden transition-all duration-150 cursor-pointer ${
          mapStyle === style.url
            ? "border-blue-500"
            : "border-transparent hover:border-gray-400"
        }`}
      >
        <img
          src={style.img}
          alt={style.name}
          className="w-full h-full object-cover"
        />
      </button>
    ))}
 
</div>

            </div>
            {/* --- END LAYER SELECT DROPDOWN --- */}

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
        style={{ width: selectedManholeLocation || selectedWardForPopup ? "35%" : "0%", }}
      >
        {/* Ward Details Popup */}
        {selectedWardForPopup && !selectedManholeLocation && (
          <div className="dB-Popup w-full flex justify-start h-full place-items-start transition-all duration-500">
            <WardDetailsPopUp
 wardData={selectedWardForPopup}
 onClose={() => setSelectedAreaName("All")}
              selectedWard={selectedWardForPopup}
              setSelectedWard={setSelectedAreaName} 
            />
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