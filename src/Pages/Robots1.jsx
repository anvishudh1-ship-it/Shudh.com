import { useState, useEffect, useRef, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Bot,
  Calendar,
  MapPin,
  Search,
  FireExtinguisher,
} from "lucide-react";
import Papa from "papaparse";
import { useServerData } from "../context/ServerDataContext";
import RobotPopUp from "../Components/RobotFiles/RobotPopUp";

const userInputsObj = {
  city: "",
  division: "",
  section: "",
  fromDate: "",
  toDate: "",
};

const userInputsErrorObj = {
  city: false,
  division: false,
  section: false,
  fromDate: false,
  toDate: false,
};

const Robots1 = () => {
  const { serverData, loading, message } = useServerData();
  const [inputError, setInputError] = useState(userInputsErrorObj);
  const [userInputs, setUserInputs] = useState(userInputsObj);
  const [MainData, setMainData] = useState([]);
  const [staticData, setStaticData] = useState([]);
  const [showFiltered, setShowFiltered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [activeRobot, setActiveRobot] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(userInputsObj);


  const backendCalls = useRef({ static: false, server: false });

 // Handle input changes
const handleInput = (key, value) => {
  setUserInputs((prev) => {
    const updated = { ...prev, [key]: value };

    // Reset dependent fields when parent changes
    if (key === "city") {
      updated.division = "";
      updated.section = "";
    } else if (key === "division") {
      updated.section = "";
    }

    return updated;
  });
};

  // Fetch static CSV once
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const res = await fetch("/datafiles/CSVs/Robo_Operations.csv");
        const csvText = await res.text();
        const parsedCSV = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
        setStaticData(parsedCSV);
      } catch (err) {
        console.error("Error fetching CSV:", err);
      }
    };
    fetchCSV();
  }, []);

  // Normalize/structure incoming data
  const structingData = (dataObj) => {
    return Object.keys(dataObj).map((index) => {
      const item = dataObj[index];
      return {
        id: item?.id || "-",
        operation_id: item?.operation_id || "-",
        device_id: item?.device_id || item?.deviceId || item?.robot_id || "-",
        before_path: item?.before_path || "-",
        after_path: item?.after_path || "-",
        gas_data_raw: item?.gas_data_raw || "-",
        gas_status: item?.gas_status || "-",
        location: item?.location || "-",
        timestamp: item?.timestamp || item?.time || "-",
        district: item?.district || item?.city || "-",
        division: item?.division || "-",
        area: item?.area || item?.section || "-",
        operation_time_minutes: item?.operation_time_minutes || "-",
        manhole_id: item?.manhole_id || "Unknown",
        waste_collected_kg: item?.waste_collected_kg || item?.wasteCollectedKg || "-",
      };
    });
  };

  // Merge CSV data once
  useEffect(() => {
    if (staticData?.length > 0 && !backendCalls.current.static) {
      backendCalls.current.static = true;
      const StaticStructData = structingData(staticData);
      setMainData((prev) => [...prev, ...StaticStructData]);
    }
  }, [staticData]);

  // Merge server data once
  useEffect(() => {
    if (serverData?.length > 0 && !backendCalls.current.server) {
      backendCalls.current.server = true;
      const backendStructData = structingData(serverData);
      setMainData((prev) => [...prev, ...backendStructData]);
    }
  }, [serverData]);

  // Build dynamic areas from MainData
  const dynamicAreasData = useMemo(() => {
    const hierarchy = {};
    MainData.forEach((item) => {
      const city = item?.district || item?.city || "-";
      const division = item?.division || "-";
      const section = item?.area || "-";

      if (!hierarchy[city]) hierarchy[city] = {};
      if (!hierarchy[city][division]) hierarchy[city][division] = {};
      if (!hierarchy[city][division][section]) hierarchy[city][division][section] = {};
    });
    return hierarchy;
  }, [MainData]);

  const cities = Object.keys(dynamicAreasData);
  const divisions = userInputs.city ? Object.keys(dynamicAreasData[userInputs.city] || {}) : [];
  const sections = userInputs.city && userInputs.division ? Object.keys(dynamicAreasData[userInputs.city][userInputs.division] || {}) : [];

  // Filter MainData based on userInputs
  const filteredData = useMemo(() => {
    if (!MainData || MainData.length === 0) return [];

    const fromDate = appliedFilters.fromDate ? new Date(appliedFilters.fromDate) : null;
    const toDate = appliedFilters.toDate ? new Date(appliedFilters.toDate) : null;

    return MainData.filter((item) => {
      const city = (appliedFilters.city || "").toString().trim().toLowerCase();
      const division = (appliedFilters.division || "").toString().trim().toLowerCase();
      const section = (appliedFilters.section || "").toString().trim().toLowerCase();

      const itemCity = (item.district || item.city || "").toString().trim().toLowerCase();
      const itemDivision = (item.division || "").toString().trim().toLowerCase();
      const itemSection = (item.area || "").toString().trim().toLowerCase();

      const cityMatch = !city || itemCity === city;
      const divisionMatch = !division || itemDivision === division;
      const sectionMatch = !section || itemSection === section;

      const itemTime = item.timestamp ? new Date(item.timestamp) : null;
      const fromOk = !fromDate || (itemTime && itemTime >= fromDate);
      const toOk = !toDate || (itemTime && itemTime <= toDate);

      return cityMatch && divisionMatch && sectionMatch && fromOk && toOk;
    });
  }, [MainData, appliedFilters]);

  // Group filtered operations by device_id
  const uniqueBots = useMemo(() => {
    const map = new Map();

    filteredData.forEach((op) => {
      const botId = op.device_id || "Unknown";
      if (!map.has(botId)) {
        map.set(botId, {
          device_id: botId,
          gas_status: op.gas_status || "-",
          area: op.area || "-",
          waste_collected_kg: Number(op.waste_collected_kg) || 0,
          operationsCount: 1,
          latestTimestamp: op.timestamp ? new Date(op.timestamp) : null,
        });
      } else {
        const cur = map.get(botId);
        cur.operationsCount += 1;
        cur.waste_collected_kg = (Number(cur.waste_collected_kg) || 0) + (Number(op.waste_collected_kg) || 0);
        if (op.timestamp) {
          const d = new Date(op.timestamp);
          if (!cur.latestTimestamp || d > cur.latestTimestamp) cur.latestTimestamp = d;
        }
        map.set(botId, cur);
      }
    });

    return Array.from(map.values());
  }, [filteredData]);

  const handleViewBots = () => {
    const errors = { ...userInputsErrorObj };

    // Validation: Both city and division are required
    if (!userInputs.city) errors.city = true;
    if (!userInputs.division) errors.division = true;

    setInputError(errors);

    // Stop if there are errors
    if (errors.city || errors.division) return;

    setAppliedFilters(userInputs); // apply current inputs
    setShowFiltered(true);         // show results
  };


  console.log(MainData)
  return (
    <div className="w-full px-[10px] ">
      {/* Heading */}
      <section className="section1 mx-auto">
        <h1>Robot Fleet Management</h1>
        <p>Monitor your autonomus drainage robots</p>
      </section>

      {/* Filters */}
      <section className="flex justify-center h-auto w-full mt-6 ">
        <div className="flex flex-wrap gap-4  min-h-35 p-4 rounded-xl border-gray-300 shadow-md justify-center items-center max-w-[1400px] shodow-md ">
          {/* City */}
          <div className="m-auto text-start relative">
            <label className="block font-semibold mb-1">City/District</label>
            <div className="flex flex-col">
              <select
                value={userInputs.city}
                onChange={(e) => handleInput("city", e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem] text-xs"
              >
                <option value="">Select City/District</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <p className="absolute bottom-[-20px]">{inputError.city && <span className="text-red-500 text-xs mt-1 ml-2 h-[20px]">*City required</span>} </p>
            </div>
          </div>

          {/* Division */}
          <div className="m-auto text-start relative">
            <label className="block font-semibold mb-1">Division</label>
            <div className="flex flex-col">
              <select
                value={userInputs.division}
                onChange={(e) => handleInput("division", e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem] text-xs"
              >
                <option value="">Select Division</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
              <p className="absolute bottom-[-20px]"> {inputError.division && <span className="text-red-500 text-xs mt-1 ml-2 h-[20px]  ">*Division required</span>}</p>
            </div>
          </div>

          {/* Section */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">Section</label>
            <select
              value={userInputs.section}
              onChange={(e) => handleInput("section", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem] text-xs"
            >
              <option value="">Select Section</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="m-auto text-start relative">
            <label className="block font-semibold mb-1">From Date</label>
            <DatePicker
              selected={userInputs.fromDate}
              onChange={(date) => handleInput("fromDate", date)}
              className="border border-gray-300 rounded-md p-2 w-48 text-xs"
              placeholderText="Pick a date"
              maxDate={new Date()}
            />
            <Calendar className="absolute top-8 right-2 text-gray-600" />
          </div>

          {/* To Date */}
          <div className="m-auto text-start relative">
            <label className="block font-semibold mb-1">To Date</label>
            <DatePicker
              selected={userInputs.toDate}
              onChange={(date) => handleInput("toDate", date)}
              className="border border-gray-300 rounded-md p-2 w-48 text-xs"
              placeholderText="Pick a date"
              maxDate={new Date()}
            />
            <Calendar className="absolute top-8 right-2 text-gray-600" />
          </div>

          {/* Button */}
          <div className="m-auto">
            <button
              className="bg-[#1A8BA8] text-white px-6 py-2 rounded-[16px] flex items-center gap-2 cursor-pointer mt-5.5 btn-hover transition-all duration-150"
              onClick={handleViewBots}
            >
              <Search className="w-4.5" />
              View Bots
            </button>
          </div>
        </div>
      </section>

      {/* Data Display */}
      <section className="max-w-[1400px] px-5">
        {loading ? (
          <p className="text-gray-800 text-center text-xl mt-4 animate-pulse">{message}</p>
        ) : showFiltered ? (
          uniqueBots.length > 0 ? (
            <>
              <div className="h-20 flex justify-between text-2xl text-bold mx-20 mt-10">
                <h1>Showing Bots from {userInputs?.section || userInputs.division || userInputs.city}</h1>
                <span className="text-black">No. of Bots - {uniqueBots.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-0">
                {uniqueBots.map((item, idx) => (
                  <div
                    key={idx}
                    className="cursor-pointer bg-white border border-gray-200 rounded-xl px-2 h-80 hover:shadow-lg hover:shadow-[#1A8BA850] hover:scale-101 transition-all duration-110"
                    onClick={() => {
                      // 1. Get all operations for this device_id from filteredData
                      const botOperations = filteredData.filter(op => op.device_id === item.device_id);

                      // 2. Get the latest operation for default display
                      const latestOp = botOperations.reduce((a, b) =>
                        new Date(a.timestamp) > new Date(b.timestamp) ? a : b
                        , botOperations[0]);

                      // 3. Pass the full object to popup including the operation history
                      setActiveRobot({
                        ...latestOp,
                        operation_history: botOperations
                      });
                      setShowPopup(true);
                    }}
                  >
                    <div className="flex flex-row">
                      <img src="/images/Robo.jpg" alt="Device" className="w-40 h-40 mt-3 object-cover rounded-lg mb-4" />
                      <div className="flex text-sm pl-2 text-gray-600 text-start items-center">
                        <div className="space-y-2">
                          <p className="flex items-center mb-2">
                            <Bot className="inline-block w-4 h-4 mr-1 mb-1" />
                            Device ID: {item?.device_id || "-"}
                          </p>
                          <p className="flex items-center mb-2">
                            <Calendar className="inline-block w-3 h-4 mr-2 mb-1" />
                            Last operation:{" "}
                            {item?.latestTimestamp ? new Date(item.latestTimestamp).toLocaleDateString() : "-"}
                          </p>
                          <p className="flex items-center mb-2">
                            <FireExtinguisher className="inline-block w-4 h-4 mr-1 mb-1" />
                            Gas status: {item.gas_status ? item.gas_status.charAt(0).toUpperCase() + item.gas_status.slice(1).toLowerCase() : "N/A"}
                          </p>
                          <p className="flex items-center mb-2">
                            <MapPin className="inline-block w-4 h-4 mr-1 mb-1" />
                            Ward: {item.area || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <hr className="my-4 mx-4 text-gray-400 " />
                    <div className="px-15 py-2">
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <p className="text-2xl ">{item?.waste_collected_kg ?? "-"} Kgs</p>
                          <p className="text-xs text-gray-500">Waste Collected</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl ">{item?.operationsCount ?? 0}</p>
                          <p className="text-xs text-gray-500">Operations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </>
          ) : (
            <p className="text-black-500 text-center text-xl mt-4">No data matches your filters.</p>
          )
        ) : (
          <p className="text-gray-400 text-center mt-6">Select filters and click “View Bots” to see results.</p>
        )}
        {showPopup && activeRobot && (
          <RobotPopUp
            activeRecord={activeRobot}
            closePopup={() => setShowPopup(false)}
          />
        )}

      </section>
    </div>
  );
};

export default Robots1;
