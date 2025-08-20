import { useState, useEffect } from "react";
import Papa from "papaparse";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Bot, Calendar, Download, MapPin, Funnel, CalendarIcon, ClockIcon } from "lucide-react";
import { Clock } from "lucide-react";
import { Trash } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function Robots() {
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


  // Modal state
  const [selectedDevice, setSelectedDevice] = useState(null);

  // ✅ new states for controlling messages
  const [message, setMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const openRoboCardPopUp = (device) => {
    document.body.style.position = "fixed";
    setSelectedDevice(device);
    setSelectedHistory(null);

    let filtereds = data.filter((item) => item.device_id === device.device_id);

    filtereds = filtereds.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

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
        map.setView([lat, lng], map.getZoom()); // keep current zoom
        // or use map.flyTo([lat, lng], 23) if you want animation & fixed zoom
      }
    }, [lat, lng, map]);
    return null;
  }

useEffect(() => {
  // 1. Load CSV immediately
  setMessage("Loading Robots Data...");
  Papa.parse("/datafiles/records_updated.csv", {
    download: true,
    header: true,
    complete: (result) => {
      console.log("📂 Local CSV loaded:", result.data);
      setData(result.data);

      const uniqueDivisions = [
        ...new Set(result.data.map((item) => item.division)),
      ];
      setDivisions(uniqueDivisions);
    },
    error: (err) => {
      console.error("❌ Failed to load CSV:", err);
    },
  });

  // 2. Fetch server data and place it on top
  const fetchServerData = async () => {
  try {
    console.log("🌐 Fetching server data...");
    setMessage("Loading data from Server......."); // <-- show message in UI
    setLoading(true);

    const response = await fetch(
      "https://sewage-bot-backend.onrender.com/api/data",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const serverData = await response.json();
    console.log("✅ Server data:", serverData);

    if (Array.isArray(serverData) && serverData.length > 0) {
      setData((prev) => {
        // server data first, CSV (prev) after
        const combined = [...serverData, ...prev];

        // update divisions
        const uniqueDivisions = [
          ...new Set(combined.map((item) => item.division)),
        ];
        setDivisions(uniqueDivisions);

        return combined;
      });
    }
  } catch (error) {
    console.warn("⚠ Server fetch failed:", error.message);
    setMessage("⚠ Failed to load data from server, using local CSV.");
  } finally {
    setLoading(false); // ✅ stop showing loading
  }
};

  fetchServerData();
}, []);


  useEffect(() => {
    if (selectedDivision) {
      const divisionAreas = [
        ...new Set(
          data
            .filter((item) => item.division === selectedDivision)
            .map((item) => item.area)
        ),
      ];
      setAreas(divisionAreas);
      setSelectedArea("");
    } else {
      setAreas([]);
    }
  }, [selectedDivision, data]);

  // ✅ updated handleFilter with proper messages
  // ✅ new state
  const [divisionError, setDivisionError] = useState("");

  // ✅ updated handleFilter
  const handleFilter = () => {
    setHasSearched(true);
    setMessage("");
    setDivisionError(""); // reset error

    if (!selectedDivision) {
      setFilteredData([]);
      setDivisionError("*Division required"); // <-- specific error
      return;
    }

    let filtered = data.filter((item) => item.division === selectedDivision);

    if (selectedArea) {
      filtered = filtered.filter((item) => item.area === selectedArea);
    }

    if (fromDate && toDate) {
      filtered = filtered.filter((item) => {
        const ts = new Date(item.timestamp);
        return ts >= fromDate && ts <= toDate;
      });
    }

    const latestByRobot = {};
    for (const row of filtered) {
      const ts = new Date(row.timestamp);
      if (
        !latestByRobot[row.device_id] ||
        ts > new Date(latestByRobot[row.device_id].timestamp)
      ) {
        latestByRobot[row.device_id] = row;
      }
    }

    const limited = Object.values(latestByRobot);
    if (limited.length === 0) {
      setMessage("No data available for selected area.");
    }

    setFilteredData(limited);
  };

  const [showResults, setShowResults] = useState(false);

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
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    setDetailedFilteredData(filtereds);
    setShowResults(true);
  };

  const activeRecord = selectedHistory || selectedDevice;

  return (
    <div className="w-full px-[10px]">
      <section className="section1 mx-auto">
        <h1>Robot Fleet Management</h1>
        <p>Monitor your autonomus drainage robots</p>
      </section>
      {/* Filters */}
      <section className="flex justify-center h-auto w-full mt-6">
        <div className="flex flex-wrap gap-4 bg-white min-h-35 p-4 rounded-lg border border-gray-300">
          {/* Division */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setDivisionError('')
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

            <p className="text-red-500 text-xs mt-1 ml-2 h-[20px]">{divisionError}</p>

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
                <img
                  src="/icons/search-icon.png"
                  alt="Search Icon"
                  className="inline-block w-4 h-4"
                />
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
        ):filteredData.length > 0 ? (
          <>
            <div className="h-20 flex justify-between text-2xl text-bold mx-20 mt-10">
              <h1>Showing Bots from {selectedDivision} </h1>
              <span className="text-black">
                No.of Bots-{filteredData.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4  px-0">
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
                            <img
                              src="/icons/robot-icon.png"
                              alt="Device Icon"
                              className="inline-block w-4 h-4 mr-1"
                            />
                          </span>
                          Device ID: {item.device_id}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <img
                              src="/icons/calendar-icon.png"
                              alt="Last Operation Icon"
                              className="inline-block w-4 h-4 mr-1"
                            />
                          </span>
                          Last operation:{" "}
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <img
                              src="/icons/gas-icon.png"
                              alt="Gas Level Icon"
                              className="inline-block w-4 h-4 mr-1"
                            />
                          </span>
                          Gas level: {item.gas_level}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <img
                              src="/icons/map-pin-icon.png"
                              alt="Last Operation Icon"
                              className="inline-block w-4 h-4 mr-1"
                            />
                          </span>
                          Ward: {item.area}
                        </p>
                      </div>
                    </div>
                  </div>
                  <hr className="my-4 mx-4 text-gray-400 " />
                  <div className="px-15 py-2">
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="text-2xl ">
                          {item.waste_collected_kg}Kgs
                        </p>
                        <p className="text-xs text-gray-500">Waste Collected</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl ">
                          {item.operation_time_minutes}
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
            <div className="bg-white w-11/12 lg:w-3/4 rounded-lg px-6 overflow-y-auto max-h-[100vh] relative right-5 top-5 shadow-2xl border border-gray-300">
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
                      <img
                        src="/icons/map-marker-icon.png"
                        alt=""
                        className="inline-block w-4  mr-1 "
                      />
                      Division:{activeRecord.division}
                    </span>
                    <br />
                    <span className="text-start text-[14px] text-[#676D7E]">
                      <img
                        src="/icons/map-marker2-icon.png"
                        alt=""
                        className="inline-block w-4  mr-1 "
                      />
                      Section:{activeRecord.area}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 w-full text-start text-[14px] text-[#676D7E] mt-5 gap-y-6">
                    <span className="flex flex-row">
                      <Bot
                        className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      <span className="flex flex-col ml-2">
                        Device Id{" "}
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
                          {activeRecord.operation_time_minutes} mins
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
                          {activeRecord.waste_collected_kg}kgs
                        </span>
                      </span>
                    </span>
                    <span>
                      {" "}
                      <MapPin
                        className="inline-block w-10 h-10 mr-3 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      {activeRecord.area}
                    </span>
                  </div>
                  <div className="flex flex-row mt-[24px] border border-gray-500 p-2 py-5 rounded-2xl " >
                    <div className="flex flex-col text-start text-[14px] text-[#676D7E] gap-y-2  w-max-content  flex-shrink-0">
                      <h1 className="text-[18px] text-black font-bold">Gas Level</h1>
                      <p>Methane(CH4) : {"  "}<span className="text-[16px] text-[#21232C]">  {activeRecord?.gas_data ? JSON.parse(activeRecord.gas_data).CH4 : "N/A"} ppm</span></p>
                      <p>Carbon Monoxide(CO) :{"  "}<span className="text-[16px] text-[#21232C]">  {activeRecord?.gas_data ? JSON.parse(activeRecord.gas_data).CO : "N/A"} ppm</span></p>
                      <p>Hydrogen Sulphate(H2S) : {"  "}<span className="text-[16px] text-[#21232C]">  {activeRecord?.gas_data ? JSON.parse(activeRecord.gas_data).H2S : "N/A"} ppm</span></p>

                    </div>

                    <div className="flex items-center justify-center max-w-[120px] m-auto  flex-shrink-1">
                      <div style={{ width: "100%", height: "auto", aspectRatio: 1 / 1 }}>
                        <CircularProgressbar
                          value={
                            activeRecord.gas_level?.toLowerCase() === "low"
                              ? 22
                              : activeRecord.gas_level?.toLowerCase() ===
                                "medium"
                                ? 55
                                : activeRecord.gas_level?.toLowerCase() === "high"
                                  ? 80
                                  : 0
                          }
                          text={
                            activeRecord.gas_level
                              ? activeRecord.gas_level.charAt(0).toUpperCase() +
                              activeRecord.gas_level.slice(1).toLowerCase()
                              : "N/A"
                          }
                          styles={buildStyles({
                            textSize: "16px",
                            textColor: "#000",
                            pathColor:
                              activeRecord.gas_level?.toLowerCase() === "high"
                                ? "red"
                                : activeRecord.gas_level?.toLowerCase() ===
                                  "medium"
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
                      <h1 className=" pb-1 text-start">
                        {activeRecord.location}
                      </h1>
                      <h1>Manhole ID : {activeRecord?.manhole_id || "Unknown"}</h1>
                    </div>
                    {/* Map Container */}
                    <div className="bd-gray">
                      {activeRecord?.location ? (
                        (() => {
                          const [lat, lng] = activeRecord.location
                            .split(",")
                            .map(Number);
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
                                <Popup>{activeRecord.location}</Popup>
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
                  <h1 className="text-[16px] text-[#21232C]  mt-[24px] text-start ">
                    Operation Images
                  </h1>
                  <div className=" rounded-lg mt-2  w-full grid grid-cols-2 gap-2 mb-10 bg-gray-100">
                    <h1>Before</h1>
                    <h1>After</h1>
                    <img
                      src={
                        activeRecord.before_path.startsWith('http')
                          ? activeRecord.before_path
                          : "/images/before.png"
                      }
                      alt="Operation"
                      className="h-full object-cover rounded-lg border border-gray-100"
                    />

                    <img
                      src={
                        activeRecord.after_path.startsWith('http')
                          ? activeRecord.after_path
                          : "/images/after.png"
                      }
                      alt="Operation"
                      className="h-full object-cover rounded-lg border border-gray-100"
                    />
                  </div>
                  <div className=" flex justify-center w-full my-[20px] mb-10 ">
                    <button className=" flex items-center justify-center h-[48px] bg-[#1A8BA8] text-[16px]  w-full text-white rounded-[16px] cursor-pointer btn-hover">
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

                  <div className="max-h-80 shadow overflow-y-auto  rounded-md p-2 px-8">
                    <ul className="space-y-3">
                      {showResults &&
                        detailedFilteredData.map((history, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between pb-5"
                          >
                            <div>
                            <span className="mr-8">
                              <CalendarIcon className="h-4 inline-block  " />
                              {new Date(history.timestamp).toLocaleDateString()}
                            </span>
                            <span className="mr-8">
                              <ClockIcon className="h-4 inline-block" />
                               
                              {new Date(history.timestamp).toLocaleTimeString()}
                            </span>
                            </div>
                            <button
                              className="btn-view-more text-white  rounded-[6px] cursor-pointer bg-blue-500 h-8 p-2"
                              onClick={() => setSelectedHistory(history)}
                            >
                              View More
                            </button>
                          </li>
                        ))}
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
