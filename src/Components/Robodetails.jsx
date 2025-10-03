import React, { useState, useEffect } from "react";
import Papa from "papaparse";

export default function Robots() {
  const [csvData, setCsvData] = useState([]);
  const [division, setDivision] = useState("");
  const [section, setSection] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // Load CSV on mount
  useEffect(() => {
    Papa.parse("/datafiles/data.csv", {
      download: true,
      header: true,
      complete: (result) => {
        setCsvData(result.data);
      },
    });
  }, []);

  // Filter logic with fallback
  useEffect(() => {
    if (division && section) {
      const matched = csvData.filter(
        (row) =>
          row.division === division && row.section === section
      );
      setFilteredData(matched.length ? matched : csvData.slice(0, 1));
    }
  }, [division, section, csvData]);

  // Get unique divisions
  const divisions = [...new Set(csvData.map((row) => row.division))];
  const sections = [
    ...new Set(csvData.filter((row) => row.division === division).map((row) => row.section)),
  ];
  console.log({ divisions, sections });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="p-2 border rounded"
          value={division}
          onChange={(e) => setDivision(e.target.value)}
        >
          <option value="">Select Division</option>
          {divisions.map((div, idx) => (
            <option key={idx} value={div}>
              {div}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="">Select Section</option>
          {sections.map((sec, idx) => (
            <option key={idx} value={sec}>
              {sec}
            </option>
          ))}
        </select>
      </div>

      {/* Data Display */}
      {filteredData.map((item, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Section */}
          <div className="bg-white shadow p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2">
              {item.district} - {item.division}
            </h2>
            <p><b>Date:</b> {item.date}</p>
            <p><b>Time:</b> {item.time}</p>
            <p><b>Waste Collected:</b> {item.waste_collected}</p>
            <p><b>Device ID:</b> {item.device_id}</p>
            <p><b>Duration:</b> {item.duration}</p>
            <p><b>Gas Level:</b> {item.gas_level}</p>
            <p><b>Coordinates:</b> {item.coordinates}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <img src={item.before_img} alt="Before" className="rounded shadow" />
              <img src={item.after_img} alt="After" className="rounded shadow" />
            </div>
          </div>

          {/* Right Section */}
          <div className="bg-white shadow p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-4">Operating History</h2>
            {csvData
              .filter(
                (row) =>
                  row.division === item.division &&
                  row.section === item.section
              )
              .map((history, hIdx) => (
                <div
                  key={hIdx}
                  className="flex justify-between border-b py-2"
                >
                  <span>{history.date}</span>
                  <button className="text-blue-500">View More</button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
