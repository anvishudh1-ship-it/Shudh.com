import { useState, useEffect, useContext } from "react";
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
  Clock,
  Trash,
  Calendar1Icon,
} from "lucide-react";

// ⬇️ import the global server data from context (adjust path if needed)
import { useServerData } from "../context/ServerDataContext";

const areasData = {
  Hyderabad: {
    "Division 9 (Kukatpally)": {
      Hasmathpet: {},
      "Vivekanandha Nagar": {},
      Yellammabanda: {},
      Moosapet: {},
      Balnagar: {},
      KPHB: {},
      Balaginagar: {},
    },
    "Division 119 (Old Bowenpally)": {},
    "Division 6 (SR Nagar)": {},
    "Division 4 (Durgam Cheruvu)": {
      Nallagandla: {},
      Madhapur: {},
      Kondapur: {},
      Gachibowli: {},
    },
    "Division 109 (Hafeezpet)": {},
    "Division 5 (Manikonda)": {},
  },
  Warangal: {},
};

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
  const {serverData, loading, message} = useServerData();
  console.log('serverData :', serverData, loading, message)
  const [userInputs, setUserInputs] = useState(userInputsObj);
  const [inputError, setInputError] = useState(userInputsErrorObj);
  const [MainData, setMainData] = useState([]);
  const [staticData, setStaticData] = useState([]);
  const [backendData, setBackendData] = useState([]);

  const handleInput = (key, value) => {
    console.log("----->>> ", key, value);
    const updated = {...userInputs, [key]: value};
    console.log('updated ', updated)
    setUserInputs(updated);
  };

  // Get divisions based on selected city
  const divisions = userInputs.city
    ? Object.keys(areasData[userInputs.city] || {})
    : [];

  // Get sections based on selected division
  const sections =
    userInputs.city && userInputs.division
      ? Object.keys(
          areasData[userInputs.city][userInputs.division] || {}
        )
      : [];


  return (
    <div className="w-full px-[10px] ">
      {/* Heading Box */}
      <section className="section1 mx-auto">
        <h1>Robot Fleet Management</h1>
        <p>Monitor your autonomus drainage robots</p>
      </section>

      {/* Filters */}
      <section className="flex justify-center h-auto w-full mt-6 ">
        <div className="flex flex-wrap gap-4  min-h-35 p-4 rounded-xl border-gray-300 shadow-md justify-center items-center max-w-[1400px] shodow-md ">
          {/* City */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">City/District</label>
            <select
              value={userInputs.city}
              onChange={(e) => {
                handleInput("city", e.target.value);
              }}
              className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem]"
            >
              <option value='' className="text-xs">
                Select City/District
              </option>
              {Object.keys(areasData).map((e) => (
                <option key={e} value={e} className="text-xs">
                  {e}
                </option>
              ))}
            </select>
            {inputError.city && <span className="text-red-500 text-xs mt-1 ml-2 h-[20px]">*City required</span>}
          </div>

          {/* Division */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">Division</label>
            <select
              value={userInputs.division}
              onChange={(e) => {
                handleInput("division", e.target.value);
              }}
              className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem]"
            >
              <option value='' className="text-xs">
                Select Division
              </option>
              {divisions.map((e) => (
                <option key={e} value={e} className="text-xs">
                  {e}
                </option>
              ))}
            </select>
            {inputError.division && <span className="text-red-500 text-xs mt-1 ml-2 h-[20px]">*Division required</span>}
          </div>

          {/* Section */}
          <div className="m-auto text-start">
            <label className="block font-semibold mb-1">Section</label>
            <select
              value={userInputs.section}
              onChange={(e) => {
                handleInput("section", e.target.value);
              }}
              className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem]"
            >
              <option value='' className="text-xs">
                Select Section
              </option>
              {sections.map((e) => (
                <option key={e} value={e} className="text-xs">
                  {e}
                </option>
              ))}
            </select>
            {inputError.section && <span className="text-red-500 text-xs mt-1 ml-2 h-[20px]">*Section required</span>}
          </div>

          {/* From Date */}
          <div className="m-auto text-start relative">
            <label className="block font-semibold mb-1">From Date</label>
            <DatePicker
              selected={userInputs.fromDate}
              onChange={(date) => (userInputs.fromDate = date)}
              className="border border-gray-300 rounded-md p-2 w-48"
              placeholderText="Pick a date"
              maxDate={new Date()}
            />
            <Calendar className="absolute top-9 right-1" />
          </div>

          {/* To Date */}
          <div className="m-auto text-start relative">
            <label className="block font-semibold mb-1">To Date</label>
            <DatePicker
              selected={userInputs.toDate}
              onChange={(date) => (userInputs.toDate = date)}
              className="border border-gray-300 rounded-md p-2 w-48"
              placeholderText="Pick a date"
              maxDate={new Date()}
            />
            <Calendar className="absolute top-9 right-1" />
          </div>

          {/* Button */}
          <div className=" m-auto">
            <button
              className="bg-[#1A8BA8] text-white px-6 py-2 rounded-[16px] flex items-center gap-2 cursor-pointer mt-5.5  btn-hover transition-all duration-150"
              onClick={() => console.log("clicked View")}
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
              {/* {console.log('filteredData: /////////// ', filteredData)} */}
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
    </div>
  );
};

export default Robots1;
