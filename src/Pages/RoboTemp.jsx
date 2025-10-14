import { useState, useEffect} from "react";
import Papa from "papaparse";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Bot,
  Calendar,
  Download,
  MapPin,
  Funnel,
  CalendarIcon,
  ClockIcon,
  Search,
  MapPinned,
  FireExtinguisher,
} from "lucide-react";
import { Clock } from "lucide-react";
import { Trash } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "leaflet/dist/leaflet.css";

// ⬇️ import the global server data from context (adjust path if needed)
import { useServerData } from "../context/ServerDataContext";

export default function Robots() {
  // ====== existing UI state (unchanged names) ======
  const [data, setData] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [detailedFilteredData, setDetailedFilteredData] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [detailedfromdate, setDetailedFromDate] = useState(null);
  const [detailedtodate, setDetailedToDate] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal + UI messages (unchanged)
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [message, setMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [divisionError, setDivisionError] = useState("");
  const [showResults, setShowResults] = useState(false);

  // ====== NEW: local CSV state, but we still expose `data` as final merged ======
  const [mainCsvData, setMainCsvData] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(true);
  
  const [deviceImages, setDeviceImages] = useState({});

  // ====== get global server data from context ======
  const {
    serverData,
    loading: serverLoading,
    message: serverMessage,
  } = useServerData();

  // ====== helpers / UI actions (unchanged) ======
  const openRoboCardPopUp = (device) => {
    console.log('selected device: =======', device, data, mainCsvData)
    document.body.style.position = "fixed";
    setSelectedDevice(device);
    setSelectedHistory(null);

    let filtereds = mainCsvData.filter((item) => item.device_id == device.device_id);
    filtereds = filtereds.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    console.log('filtereds : ', filtereds);
    setDetailedFilteredData(filtereds);
    setShowResults(true);
  };

  const closeRoboCardPopUp = () => {
    document.body.style.position = "static";
    setSelectedDevice("");
  };

  const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
      if (lat && lng) {
        map.setView([lat, lng], map.getZoom());
      }
    }, [lat, lng, map]);
    return null;
  };

  const csvDataOpsCount = (csvDataInp) => {
    // console.log("csvDataInp : ==================", csvDataInp)
    const uniqCsvData = Object.values(
      csvDataInp.reduce((acc, curr) => {
        const id = curr.device_id;

        if (!acc[id]) {
          // first time seeing this device_id
          acc[id] = { ...curr, operationsCount: 1 };
        } else {
          // already exists → increment count
          acc[id].operationsCount += 1;
        }

        return acc;
      }, {})
    );

    console.log('uniqCsvData : ================= ', uniqCsvData)
    return uniqCsvData;
  }

  // ====== PAGE-LOCAL: load CSV only for Robots page (unchanged file path) ======
  useEffect(() => {
    setMessage("Loading Data...");
    setCsvLoading(true);

    Papa.parse("/datafiles/CSVs/Updated_Reports.csv", {
      download: true,
      header: true,
      complete: (result) => {
        console.log("Local CSV loaded");
        setMainCsvData(result.data);
        setCsvData(csvDataOpsCount(result.data) || []);
        setCsvLoading(false);
      },
      error: (err) => {
        console.error(" Failed to load CSV:", err);
        setCsvData([]);
        setCsvLoading(false);
      },
    });
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Step 1: Get all devices
        const devicesRes = await fetch(
          "https://shudhanvi-backend-cloud.onrender.com/api/devices"
        );
        const devices = await devicesRes.json();

        const imgMap = {};

        // Step 2: For each device, fetch all its operations & images
        for (const deviceId of devices) {
          const opsRes = await fetch(
            `https://shudhanvi-backend-cloud.onrender.com/api/devices/${deviceId}/operations`
          );
          const operations = await opsRes.json();

          imgMap[deviceId] = [];

          for (const opName of operations) {
            // Normalize operationId for DB match
            // Example: opName = "Kondapur_ofce_Kondapur_ofce_58"
            // DB value = "Kondapur_ofce_58"
            const operationId = opName.split(`${deviceId}_`).pop();
            console.log("Fetching images for operation:", operationId);
            const imgRes = await fetch(
              `https://shudhanvi-backend-cloud.onrender.com/api/devices/${deviceId}/${opName}/images`
            );
            const images = await imgRes.json(); // { before: <url>, after: <url> }

            imgMap[deviceId].push({
              folderKey: opName, // Full Azure folder name
              operationId, // Normalized for DB
              ...images,
            });
          }
        }

        // console.log("✅ Device Images (all ops):", imgMap);
        for (const deviceId of Object.keys(imgMap)) {
          console.log("Fetched images for device:", deviceId, imgMap[deviceId]);
        }
        setDeviceImages(imgMap);
      } catch (err) {
        console.error("❌ Failed to fetch images:", err);
      }
    };

    fetchImages();
  }, []);

  // ====== MERGE: whenever serverData or csvData changes, build final `data` ======
  useEffect(() => {
    const normalize = (ts) => {
      if (!ts) return null;
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const combined = [
      ...(Array.isArray(serverData) ? serverData : []),
      ...(Array.isArray(csvData) ? csvData : []),
    ].map((item) => {
      const ts = normalize(item.timestamp);

      // find images for this operation_id
      let images = [];
      if (deviceImages[item.device_id]) {
        images = deviceImages[item.device_id].filter((img) => {
          // Normalize DB operationId too
          const dbOp = item.operation_id.split(`${item.device_id}_`).pop();
          return img.operationId === dbOp;
        });
      }

      return { ...item, timestamp: ts, images };
    });

    const seen = new Set();
    const unique = combined.filter((item) => {
      const key = `${item.device_id}-${item.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setData(unique);

    const uniqueDivisions = [...new Set(unique.map((item) => item.division))];
    setDivisions(uniqueDivisions);

    const nextLoading = serverLoading || csvLoading;
    setLoading(nextLoading);

    if (nextLoading) {
      setMessage(
        serverLoading
          ? serverMessage || "Loading data......."
          : "Loading Robots Data..."
      );
    } else {
      setMessage("");
    }
  }, [
    serverData,
    serverLoading,
    serverMessage,
    csvData,
    csvLoading,
    deviceImages,
  ], []);

  // ====== existing areas derivation (unchanged) ======
  useEffect(() => {
    if (selectedDivision) {
      const divisionAreas = [
        ...new Set(
          data
            .filter((item) => item.division === selectedDivision)
            .map((item) => item.ward)
        ),
      ];
      setAreas(divisionAreas);
      setSelectedArea("");
    } else {
      setAreas([]);
    }
  }, [selectedDivision, data]);

  // ====== existing handlers (unchanged names/logic) ======
  const handleFilter = () => {
    setHasSearched(true);
    setMessage("");
    setDivisionError("");

    if (!selectedDivision) {
      setFilteredData([]);
      setDivisionError("*Division required");
      return;
    }

    let filtered = data.filter((item) => item.division === selectedDivision);

    if (selectedArea) {
      filtered = filtered.filter((item) => item.ward === selectedArea);
    }
    console.log('filtered : =======' , filtered);
    setFilteredData(filtered);

    if (fromDate && toDate) {
      filtered = filtered.filter((item) => {
        const ts = new Date(item.timestamp);
        return ts >= fromDate && ts <= toDate;
      });
    }

    // group by robot and count operations
    const robotStats = {};
    for (const row of filtered) {
      if (!robotStats[row.device_id]) {
        robotStats[row.device_id] = { ...row, operationsCount: 0 };
      }
      robotStats[row.device_id].operationsCount += 1;
      const ts = new Date(row.timestamp);
      if (
        !robotStats[row.device_id].timestamp ||
        ts > new Date(robotStats[row.device_id].timestamp)
      ) {
        robotStats[row.device_id] = {
          ...row,
          operationsCount: robotStats[row.device_id].operationsCount,
        };
      }
    }

    console.table(robotStats);

    const limited = Object.values(robotStats);

    if (limited.length === 0) {
      setMessage("No data available for selected area.");
    }

    // setFilteredData(limited);
  };

  const apply = () => {
    if (!selectedDevice) return;

    let filtereds = data.filter(
      (item) => item.device_id === selectedDevice.device_id
    );

    if (detailedfromdate && detailedtodate) {
      filtereds = filtereds.filter((item) => {
        const ts = new Date(item.timestamp);
        return ts >= detailedfromdate && ts <= detailedtodate;
      });
    }

    filtereds = filtereds.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    setDetailedFilteredData(filtereds);
    setShowResults(true);
  };

  const activeRecord = selectedHistory || selectedDevice;

  return (
    <div className="w-full px-[10px] ">
      <section className="section1 mx-auto">
        <h1>Robot Fleet Management</h1>
        <p>Monitor your autonomus drainage robots</p>
      </section>

      {/* Filters */}
      <section className="flex justify-center h-auto w-full mt-6 ">
        <div className="flex flex-wrap gap-4  min-h-35 p-4 rounded-xl border-gray-300 shadow-md justify-center items-center max-w-[1400px] shodow-md ">
          {/* Division */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setDivisionError("");
              }}
              className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem]"
            >
              <option value="" className="text-xs">
                Select Division
              </option>
              {divisions.map((div, i) => (
                <option key={i} value={div} className="text-xs">
                  {div}
                </option>
              ))}
            </select>

            <p className="text-red-500 text-xs mt-1 ml-2 h-[20px]">
              {divisionError}
            </p>
          </div>

          {/* Section */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">Section</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem]"
            >
              <option value="" className="text-xs">
                Select Section
              </option>
              {areas.map((section, i) => (
                <option key={i} value={section} className="text-xs">
                  {section}
                </option>
              ))}
            </select>
            <p className="text-red-500 text-sm mt-1 h-[20px]"></p>
          </div>

          {/* From Date */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">From Date</label>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              className="border border-gray-300 rounded-md p-2 w-48"
              placeholderText="Pick a date"
              maxDate={new Date()}
            />
            <p className="text-red-500 text-sm mt-1 h-[20px]"></p>
          </div>

          {/* To Date */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">To Date</label>
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              className="border border-gray-300 rounded-md p-2 w-48"
              placeholderText="Pick a date"
              maxDate={new Date()}
            />
            <p className="text-red-500 text-sm mt-1 h-[20px]"></p>
          </div>

          {/* Button */}
          <div className=" m-auto">
            <button
              className="bg-[#1A8BA8] text-white px-6 py-2 rounded-[16px] flex items-center gap-2 cursor-pointer mt-5.5  btn-hover transition-all duration-150"
              onClick={handleFilter}
            >
              <span>
                <Search className="w-4.5" />
              </span>
              View Bots
            </button>
            <p className="text-red-500 text-sm mt-1 h-[20px]"></p>
          </div>
        </div>
      </section>

      {/* Display Filtered Data */}
      <section className="max-w-[1400px] px-5">
        {loading ? (
          <p className="text-gray-800 text-center text-xl mt-4  animate-pulse">
            {message}
          </p>
        ) : filteredData.length > 0 ? (
          <>
            <div className="h-20 flex justify-between text-2xl text-bold mx-20 mt-10">
              <h1>Showing Bots from {selectedDivision} </h1>
              <span className="text-black">
                No. of Bots-{filteredData.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4  px-0">
              {console.log('filteredData: /////////// ', filteredData)}
              {filteredData.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => openRoboCardPopUp(item)}
                  className="cursor-pointer bg-white border border-gray-200 rounded-xl  px-2 h-80 max-w hover:shadow-lg hover:shadow-[#1A8BA850] hover:scale-101 transition-all duration-110"
                >
                  <div className="flex flex-row">
                    <img
                      src="/images/Robo.jpg"
                      alt="Device"
                      className="w-40 h-40 mt-3 object-cover rounded-lg mb-4"
                    />
                    <div className="flex text-sm pl-2 text-gray-600 text-start items-center">
                      <div className="space-y-2">
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <Bot className="inline-block w-4 h-4 mr-1 mb-1" />
                          </span>
                          Device ID: {item?.device_id || "-"}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <Calendar className="inline-block w-3 h-4 mr-2 mb-1" />
                          </span>
                          Last operation:{" "}
                          {new Date(item?.timestamp).toLocaleDateString() ||
                            "-"}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <FireExtinguisher className="inline-block w-4 h-4 mr-1 mb-1" />
                          </span>
                          Gas status:{" "}
                          {item.gas_status
                            ? item.gas_status.charAt(0).toUpperCase() +
                              item.gas_status.slice(1).toLowerCase()
                            : "N/A"}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <MapPin className="inline-block w-4 h-4 mr-1 mb-1" />
                          </span>
                          Ward: {item.ward}
                        </p>
                      </div>
                    </div>
                  </div>
                  <hr className="my-4 mx-4 text-gray-400 " />
                  <div className="px-15 py-2">
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="text-2xl ">
                          {item?.waste_collected_kg || "- "}Kgs
                        </p>
                        <p className="text-xs text-gray-500">Waste Collected</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl ">
                          {item?.operationsCount || "- "}
                        </p>
                        <p className="text-xs text-gray-500">Operations</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>{" "}
          </>
        ) : (
          hasSearched && (
            <p className="text-black-500 text-center  text-xl mt-4">
              {message}
            </p>
          )
        )}
      </section>

      {/* Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-transparent bg-opacity-50 z-[910]">
          <div className="w-full h-screen bg-[#00000099] flex place-content-center">
            <div className="mx-auto bg-white w-full max-w-[1000px] rounded-lg px-6 overflow-y-auto max-h-[100vh] relative top-5 shadow-2xl border border-gray-297">
              <button
                onClick={() => closeRoboCardPopUp()}
                className="popup-btn absolute right-6 text-gray-500 hover:text-black text-5xl top-[10px] cursor-pointer "
              >
                ×
              </button>

              {/* Modal Content */}
              <div className="flex flex-row justify-between pt-5">
                <div className="text-start w-[48%]">
                  <h1 className="text-start text-[18px]  mb-2">
                    Operational Details
                  </h1>
                </div>
                <div className="text-start w-[48%]">
                  <h1 className="text-start text-[18px] mb-2">
                    Operation History
                  </h1>
                </div>
              </div>
              <div className="flex flex-row justify-between px-1 ">
                <div className="w-[48%] ">
                  <div className="flex flex-col justify-start text-gray-500 w-full">
                    <span className="text-start text-[14px] text-[#676D7E]">
                      <MapPin className="inline-block w-4  mr-2 mb-1 text-blue-600 " />
                      Division:{activeRecord?.division || "- "}
                    </span>
                    <br />
                    <span className="text-start text-[14px] text-[#676D7E]">
                      <MapPinned className="inline-block w-4  mr-2 mb-1 text-blue-500 " />
                      Section:{activeRecord?.ward || "- "}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 w-full text-start text-[14px] text-[#676D7E] mt-5 gap-y-6">
                    <span className="flex flex-row">
                      <Bot
                        className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      <span className="flex flex-col ml-2">
                        Device Id{""}
                        <span className="text-[#21232C] text-[16px]">
                          {activeRecord.device_id}
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-row">
                      <Calendar
                        className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      <span className="flex flex-col ml-2">
                        Date
                        <span className="text-[#21232C] text-[16px]">
                          {" "}
                          {new Date(
                            activeRecord.timestamp
                          ).toLocaleDateString()}
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-row">
                      <Clock
                        className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      <span className="flex flex-col ml-2">
                        Starting Time
                        <span className="text-[#21232C] text-[16px]">
                          {new Date(
                            activeRecord.timestamp
                          ).toLocaleTimeString()}
                        </span>
                      </span>
                    </span>

                    <span className="flex flex-row">
                      <Clock
                        className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      <span className="flex flex-col ml-2">
                        Task Duration{" "}
                        <span className="text-[#21232C] text-[16px]">
                          {activeRecord?.operation_time_minutes || "-"} mins
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-row">
                      <Trash
                        className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      <span className="flex flex-col ml-2">
                        Waste Collected{" "}
                        <span className="text-[#21232C] text-[16px]">
                          {activeRecord?.waste_collected_kg || "-"}kgs
                        </span>
                      </span>
                    </span>
                    <span>
                      {" "}
                      <MapPin
                        className="inline-block w-10 h-10 mr-3 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      {activeRecord.ward}
                    </span>
                  </div>
                  <div className="flex flex-row mt-[24px] border border-gray-500 p-2 py-5 rounded-2xl ">
                    <div className="flex flex-col text-start text-[14px] text-[#676D7E] gap-y-2  w-max-content  flex-shrink-0">
                      <h1 className="text-[18px] text-black font-bold">
                        Gas Level
                      </h1>
                      <p>
                        Methane(CH4) : {"  "}
                        <span className="text-[16px] text-[#21232C]">
                          {" "}
                          {activeRecord?.gas_data_raw
                            ? JSON.parse(activeRecord.gas_data_raw).CH4
                            : "N/A"}{" "}
                          ppm
                        </span>
                      </p>
                      <p>
                        Carbon Monoxide(CO) :{"  "}
                        <span className="text-[16px] text-[#21232C]">
                          {" "}
                          {activeRecord?.gas_data_raw
                            ? JSON.parse(activeRecord.gas_data_raw).CO
                            : "N/A"}{" "}
                          ppm
                        </span>
                      </p>
                      <p>
                        Hydrogen Sulphate(H2S) : {"  "}
                        <span className="text-[16px] text-[#21232C]">
                          {" "}
                          {activeRecord?.gas_data_raw
                            ? JSON.parse(activeRecord.gas_data_raw).H2S
                            : "N/A"}{" "}
                          ppm
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-center max-w-[120px] m-auto  flex-shrink-1">
                      <div
                        style={{
                          width: "100%",
                          height: "auto",
                          aspectRatio: 1 / 1,
                        }}
                      >
                        <CircularProgressbar
                          value={
                            activeRecord.gas_status?.toLowerCase() === "safe"
                              ? 22
                              : activeRecord.gas_status?.toLowerCase() ===
                                "alert"
                              ? 55
                              : activeRecord.gas_status?.toLowerCase() ===
                                "toxic"
                              ? 80
                              : 0
                          }
                          text={
                            activeRecord.gas_status
                              ? activeRecord.gas_status
                                  .charAt(0)
                                  .toUpperCase() +
                                activeRecord.gas_status.slice(1).toLowerCase()
                              : "N/A"
                          }
                          styles={buildStyles({
                            textSize: "16px",
                            textColor: "#000",
                            pathColor:
                              activeRecord.gas_status?.toLowerCase() === "toxic"
                                ? "red"
                                : activeRecord.gas_status?.toLowerCase() ===
                                  "alert"
                                ? "orange"
                                : "green",
                            trailColor: "#eee",
                            strokeLinecap: "round",
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className=" w-full text-start text-[#21232C] mt-[24px] bg-gray-100 rounded-lg p-2 ">
                    <div className="flex flex-row justify-between">
                      <h1 className="pb-1 text-start">
                        {console.log(
                          "Latitude:====",
                          activeRecord.geo_location
                        )}
                        {activeRecord?.geo_location
                          ? JSON.parse(activeRecord.geo_location).latitude
                          : activeRecord?.geo_location?.latitude}
                        ,{" "}
                        {activeRecord?.geo_location
                          ? JSON.parse(activeRecord.geo_location).longitude
                          : activeRecord?.geo_location?.longitude}
                      </h1>
                      <h1>
                        Manhole ID : {activeRecord?.manhole_id || "Unknown"}
                      </h1>
                    </div>
                    {/* Map Container */}
                    <div className="bd-gray">
                      {activeRecord?.geo_location ? (
                        (() => {
                          let lat = 0;
                          let lng = 0;

                          try {
                            // Parse location JSON string
                            const loc = JSON.parse(activeRecord.geo_location);

                            lat = parseFloat(loc.latitude);
                            lng = parseFloat(loc.longitude);
                          } catch (err) {
                            console.error(
                              "Invalid location format:",
                              activeRecord.geo_location,
                              err
                            );
                          }

                          return (
                            <MapContainer
                              center={[lat, lng]}
                              zoom={15}
                              className="h-40 rounded-lg"
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                              <Marker position={[lat, lng]}>
                                <Popup>{activeRecord.geo_location}</Popup>
                              </Marker>

                              <RecenterMap lat={lat} lng={lng} />
                            </MapContainer>
                          );
                        })()
                      ) : (
                        <p>No location available</p>
                      )}
                    </div>
                  </div>
                  <h1 className="text-[16px] text-[#21232C] mt-[24px] text-start">
                    Operation Images
                  </h1>
                  <div className="rounded-lg mt-2 w-full  bg-gray-100 overflow-y-auto ">
                    <div className="flex justify-around px-2">
                      <h1 className="mt-2">Before</h1>
                      <h1 className="mt-2">After</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-10 h-[150px]">
                      <div className="flex flex-col gap-2">
                        {activeRecord?.images?.some((op) => op.before) ? (
                          activeRecord.images.map((op, i) =>
                            op.before ? (
                              <img
                                key={`before-${i}`}
                                src={op.before}
                                alt={`Before ${i}`}
                                className="h-full object-cover rounded-lg border border-gray-100"
                              />
                            ) : null
                          )
                        ) : (
                          <img
                            src={activeRecord.before_path}
                            alt="No Before"
                            className="h-full object-cover rounded-lg border"
                          />
                        )}
                      </div>

                      {/* After column */}

                      <div className="flex flex-col gap-2">
                        {activeRecord?.images?.some((op) => op.after) ? (
                          activeRecord.images.map((op, i) =>
                            op.after ? (
                              <img
                                key={`after-${i}`}
                                src={op.after}
                                alt={`After ${i}`}
                                className="h-full object-cover rounded-lg border border-gray-100"
                              />
                            ) : null
                          )
                        ) : (
                          <img
                            src={activeRecord.after_path}
                            alt="No After"
                            className="h-full object-cover rounded-lg border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  {console.log(
                    activeRecord?.before_path,
                    activeRecord?.after_path
                  )}
                  <div className=" flex justify-center w-full my-[20px] mb-10 ">
                    <button
                      onClick={() => alert("Report Generated Successfully")}
                      className=" flex items-center justify-center h-[48px] bg-[#1A8BA8] text-[16px]  w-full text-white rounded-[16px] cursor-pointer btn-hover"
                    >
                      <Download
                        className="inline-block w-5 h-5 mr-1  "
                        color="white"
                      />
                      Generate Operation Report
                    </button>
                  </div>
                </div>

                <div className="  w-[48%]">
                  <div className="flex flex-row">
                    <span className="inline-block text-[#676D7E] mr-2  ">
                      <Funnel />
                    </span>
                    <h1 className="text-start text-[14px] ">
                      {" "}
                      Filter by Date Range
                    </h1>
                  </div>
                  <div className="flex flex-row w-full justify-between mb-5 mt-3 gap-2 ">
                    <div className="text-start w-[45%] mt-2 ">
                      <label className="block text-[16px] text-[#676D7E100] mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        className="border border-gray-300 rounded-md p-2 w-full"
                        value={
                          detailedfromdate && !isNaN(detailedfromdate)
                            ? detailedfromdate.toISOString().split("T")[0]
                            : ""
                        }
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          const val = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          setDetailedFromDate(val);
                        }}
                      />
                    </div>
                    <div className="text-start w-[45%] mt-2">
                      <label className="block text-[16px] text-[#676D7E100] mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        className="border border-gray-300 rounded-md p-2 w-full "
                        value={
                          detailedtodate && !isNaN(detailedtodate)
                            ? detailedtodate.toISOString().split("T")[0]
                            : ""
                        }
                        max={new Date().toISOString().split("T")[0]} // 🚀 restricts future dates
                        onChange={(e) => {
                          const val = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          setDetailedToDate(val);
                        }}
                      />
                    </div>
                    <div>
                      <button
                        className="bg-[#1A8BA8] cursor-pointer text-white rounded-md h-10 text-sm px-6 mt-8.5 btn-hover"
                        onClick={apply}
                      >
                        Filter
                      </button>
                    </div>
                  </div>

                  <div className="h-80 shadow overflow-y-auto  rounded-md p-2 px-6">
                    <ul className="space-y-3">
                      {showResults && detailedFilteredData.length > 0
                        ? detailedFilteredData.map((history, index) => {
                            const isActive =
                              selectedHistory?.timestamp === history.timestamp;

                            return (
                              <li
                                key={index}
                                className={`flex items-center justify-between h-12 transition-all ${
                                  isActive ? "bg-gray-200" : ""
                                }`}
                              >
                                <div>
                                  <span className="mr-8">
                                    <CalendarIcon className="h-4 inline-block" />
                                    {new Date(
                                      history.timestamp
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className="mr-8">
                                    <ClockIcon className="h-4 inline-block" />
                                    {new Date(
                                      history.timestamp
                                    ).toLocaleTimeString("en-GB", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: false,
                                    })}
                                  </span>
                                </div>
                                <button
                                  className={`btn-view-more flex items-center rounded-[6px] cursor-pointer h-8 px-2 transition-colors ${
                                    isActive
                                      ? "bg-blue-700 text-white"
                                      : "bg-blue-500 text-white"
                                  }`}
                                  onClick={() => setSelectedHistory(history)}
                                >
                                  View More
                                </button>
                              </li>
                            );
                          })
                        : showResults && (
                            <li className="text-center text-gray-500 py-4">
                              No Records Found
                            </li>
                          )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
