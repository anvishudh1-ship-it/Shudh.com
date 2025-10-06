import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PredictComp = () => {
  const [areaNames, setAreaNames] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [riskData, setRiskData] = useState([]);
  const [sewerFlowZones, setSewerFlowZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Static Data (not in CSV) ---
  const rainfallData = [
    { day: "D1", rainfall: 12 }, { day: "D2", rainfall: 5 }, { day: "D3", rainfall: 0 },
    { day: "D4", rainfall: 8 }, { day: "D5", rainfall: 21 }, { day: "D6", rainfall: 33 }, { day: "D7", rainfall: 10 },
  ];
  const gasRiskZones = {
    location: "North West", gas: "H₂S", riskLevel: "Elevated", riskDesc: "Moderate",
  };

  // Effect to fetch all area names for the dropdown on component mount
  useEffect(() => {
    const fetchAreaNames = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/areas');
        setAreaNames(response.data);
      } catch (error) {
        console.error("Error fetching area names:", error);
      }
    };
    fetchAreaNames();
  }, []);

  // Effect to fetch data for the selected area whenever it changes
  useEffect(() => {
    const fetchDataForArea = async () => {
      // Do nothing if no area is selected
      if (!selectedArea) {
        setRiskData([]);
        setSewerFlowZones([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:3001/api/data/${selectedArea}`);
        const data = response.data;
        
        // Process Risk Data (top 2 clog risk)
        const sortedByIncidents = data.sort((a, b) => b.history_of_clogging_incidents - a.history_of_clogging_incidents);
        const topRisks = sortedByIncidents.slice(0, 2);
        const newRiskData = topRisks.map(item => ({
          ward: item.area_name,
          code: item.id,
          riskPercent: Math.round((item.history_of_clogging_incidents / 8) * 100),
        }));
        setRiskData(newRiskData);
    
        // Process Sewer Flow Zones
        const newSewerFlowZones = data.slice(0, 3).map(item => ({
          zone: item.id,
          status: item.flow_in_m3_s > item.flow_out_m3_s ? 'Over Flow' : 'Stable',
        }));
        setSewerFlowZones(newSewerFlowZones);

      } catch (error) {
        console.error("Error fetching data for area:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataForArea();
  }, [selectedArea]);

  const StatGraph = () => (
    <svg viewBox="0 0 500 200" className="w-full h-48" aria-label="Line chart representing rainfall trend over last 7 days">
      <line x1="40" y1="10" x2="40" y2="180" stroke="#bbb" strokeWidth="1" />
      <line x1="40" y1="180" x2="480" y2="180" stroke="#bbb" strokeWidth="1" />
      {[0, 9, 18, 27, 36].map((val) => {
        const y = 180 - (val / 36) * 170;
        return (
          <g key={val} className="text-gray-500 text-xs">
            <text x="5" y={y + 5} fill="#666">{val}</text>
            <line x1="40" y1={y} x2="480" y2={y} stroke="#eee" strokeWidth="1" />
          </g>
        );
      })}
      {rainfallData.map(({ day, rainfall }, i) => {
        const x = 40 + i * 65;
        const y = 180 - (rainfall / 36) * 170;
        return (
          <g key={day}>
            <text x={x} y="195" fill="#666" className="text-xs" textAnchor="middle">{day}</text>
            <circle cx={x} cy={y} r="4" fill="#38bdf8" />
            <text x={x} y={y - 10} fill="#0590bc" fontSize="12" fontWeight="600" textAnchor="middle">{rainfall}</text>
          </g>
        );
      })}
      <polyline fill="none" stroke="#38bdf8" strokeWidth="3" points={rainfallData.map(({ rainfall }, i) => {
        const x = 40 + i * 65;
        const y = 180 - (rainfall / 36) * 170;
        return `${x},${y}`;
      }).join(" ")} />
    </svg>
  );

  return (
    <div className="predict-comp w-full max-w-[600px] p-5 space-y-6 bg-white rounded-lg shadow-md mx-auto">
      {/* Area Selection Dropdown */}
      <div className="flex-1 shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left">
        <label htmlFor="area-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Ward:
        </label>
        <select
          id="area-select"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="" disabled>Select a ward</option>
          {areaNames.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* Conditionally render data sections based on selection */}
      {selectedArea ? (
        isLoading ? (
          <div className="text-center p-8">Loading data...</div>
        ) : (
          <>
            <div className="flex-1 shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left">
              <h2 className="font-semibold text-xl mb-1">Clog Risk Prediction</h2>
              <p className="text-gray-600 mb-3 text-sm font-semibold">See risks before they surge.</p>
              {riskData.length > 0 ? (
                riskData.map(({ ward, code, riskPercent }) => (
                  <div key={code} className="mb-3 p-3 border-1 border-gray-300 rounded-xl flex items-center space-x-4">
                    <div className="bg-[#1A8BA8] text-white rounded-xl px-5 py-[10px] text-xs font-semibold">{ward}</div>
                    <div className="flex-1">
                      <div className="text-sky-600 font-medium">{code}</div>
                      <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
                        <div className="bg-[#0380FC] h-2 rounded-full" style={{ width: `${riskPercent}%` }}></div>
                      </div>
                    </div>
                    <div className="w-12 text-right font-semibold">{riskPercent}%</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No data available for this area.</p>
              )}
            </div>

            <div className="flex-1 w-full shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl">
              <img src="/images/cure-bargraph.png" className="w-full max-w-3xl m-auto object-contain" alt="Cure RainFall Trend Stats Graph" />
            </div>

            <div className="flex-1 shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left">
              <h3 className="font-semibold mb-3">Sewer Flow ForeCast</h3>
              <div className="flex justify-between align-middle gap-1">
                {sewerFlowZones.length > 0 ? (
                  sewerFlowZones.map(({ zone, status }) => (
                    <div key={zone} className="bg-gray-50 px-4 py-2 rounded border-1 border-gray-200 shadow hover:shadow-gray-400 font-semibold text-sm text-gray-800 cursor-default">
                      {zone} - {status}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No forecast available.</p>
                )}
              </div>
            </div>
          </>
        )
      ) : (
        <div className="text-center p-8 text-gray-500">
          <p>Please select a ward for the Prediction</p>
        </div>
      )}
    </div>
  );
};

export default PredictComp;