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
  Clock ,Trash,
  Calendar1Icon
} from "lucide-react";

// ⬇️ import the global server data from context (adjust path if needed)
import { useServerData } from "../context/ServerDataContext";

const userInputsObj = {
    city: '',
    division: '',
    section: '',
    fromDate: '',
    toDate: '',
} 
const Robots1 = () => {
    const [userInputs, setUserInputs] = useState(userInputsObj);
    const [MainData, setMainData] = useState([]);
    const [staticData, setStaticData] = useState([]);
    const [backendData, setBackendData] = useState([]);

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
              <label className="block font-semibold mb-1">Division</label>
              <select
                value={userInputs.city}
                onChange={(e) => {
                  // setSelectedDivision(e.target.value);
                  // setDivisionError("");
                }}
                className="border border-gray-300 rounded-md p-2 w-48 min-w-[12rem]"
              >
                <option value="" className="text-xs">
                  Select Division
                </option>
                {userInputs.division.map((div, i) => (
                  <option key={i} value={div} className="text-xs">
                    {div}
                  </option>
                ))}
              </select>

              <p className="text-red-500 text-xs mt-1 ml-2 h-[20px]">
                {divisionError}
              </p>
            </div>

            {/* Division */}
            <div className="m-auto text-start">
              <label className="block font-semibold mb-1">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => {
                  // setSelectedDivision(e.target.value);
                  // setDivisionError("");
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
              <Calendar1Icon />
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
      </div>
    );
}

export default Robots1;