import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PreventComp = () => {
  const [areaNames, setAreaNames] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [sensorReadings, setSensorReadings] = useState([]);
  const [blockageHistory, setBlockageHistory] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use useCallback to memoize the function, preventing unnecessary re-creation
  const fetchPreventData = useCallback(async () => {
    if (!selectedArea) {
      setSensorReadings([]);
      setBlockageHistory([]);
      setUpcomingMaintenance([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/prevent_data/${selectedArea}`);
      const data = response.data;
      setSensorReadings(data.sensorReadings);
      setBlockageHistory(data.blockageHistory);
      setUpcomingMaintenance(data.upcomingMaintenance);
    } catch (error) {
      console.error("Error fetching prevention data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedArea]);

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
    fetchPreventData();
  }, [selectedArea, fetchPreventData]);

  
  return (
    <div className="prevent-comp w-full max-w-[600px] p-5 space-y-6 bg-white rounded-lg shadow-md mx-auto mt-8">
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

      {selectedArea ? (
        isLoading ? (
          <div className="text-center p-8">Loading data...</div>
        ) : (
          <>
           
            
            {/* Box 2 */}
            <div className="blockage-history mt-6 grid grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* blockage-history */}
              <div className="bg-white p-3 shadow flex flex-col gap-1.5 shadow-gray-300 rounded-xl border border-gray-200 text-left">
                <h4 className="font-semibold mb-2">Blockage History</h4>
                {blockageHistory.map(({ code, desc }) => (
                  <div
                    key={code}
                    className="bg-white border rounded-xl border-gray-300 px-3 py-2 mb-2"
                  >
                    <div className="font-semibold text-sm">{code}</div>
                    <div className="text-gray-600 font-[600] text-[10px]">{desc}</div>
                  </div>
                ))}
              </div>

              {/* Upcoming Maintenance */}
              <div className="bg-white p-3 shadow flex flex-col gap-1.5 shadow-gray-300 rounded-xl border border-gray-200 text-left">
                <h4 className="font-semibold mb-2">Upcoming Maintenance</h4>
                {upcomingMaintenance.map(({ code, dueDate }) => (
                  <div
                    key={code}
                    className="bg-white border rounded-xl border-gray-300 px-3 py-2 mb-2"
                  >
                    <div className="font-semibold text-sm">{code}</div>
                    <div className="text-gray-600 font-[600] text-[10px]">
                      Due By {dueDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-white shadow pt-3 flex flex-col gap-1.5 shadow-gray-300 rounded-xl border border-gray-200 text-left">
              <h4 className="font-semibold text-md px-3">Network Analysis</h4>
              <p className="text-gray-600 text-[12px] font-[600] mb-3 px-3">
                How upcoming MH-034 and MH-057 can create issues in the network
              </p>
              <div className="aspect-w-16 aspect-h-9 h-auto relative">
                <img
                  src="/images/prevent-map.png"
                  className="w-full max-w-3xl m-auto object-contain"
                  alt="Detailed network map visualization highlighting MH-034 and MH-057 with surrounding pipeline and infrastructure"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            </div>
                {/* Live Sensor Reading */}
            <div className="bg-white p-5 shadow shadow-gray-300 rounded-xl">
              <h3 className="font-semibold text-md mb-1 text-left">
                Live Sensor Reading
              </h3>
              <p className="text-gray-600 text-sm mb-3 text-left">
                Act early. Reduce Downtime
              </p>
              <table className="w-full text-sm border-gray-300 rounded text-left">
                <thead className="bg-gray-50 font-[600]">
                  <tr>
                    <th className="border-b border-gray-300 p-2">Sensor ID</th>
                    <th className="border-b border-gray-300 p-2">CO</th>
                    <th className="border-b border-gray-300 p-2">CH4</th>
                    <th className="border-b border-gray-300 p-2">H2S</th>
                    <th className="border-b border-gray-300 p-2">Linked MH</th>
                  </tr>
                </thead>
                <tbody className="font-[300]">
                  {sensorReadings.map(({ id, CO, CH4, H2S, linkedMH }) => (
                    <tr
                      key={id}
                      className={CH4 > 50 || H2S > 7 ? "bg-yellow-50" : ""}
                    >
                      <td className="p-2 border-b border-gray-200">{id}</td>
                      <td className="p-2 border-b border-gray-200">
                        {CO.toFixed(1)}
                      </td>
                      <td
                        className={`p-2 border-b border-gray-200 ${
                          CH4 > 50 ? "text-red-600 font-semibold" : ""
                        }`}
                      >
                        {CH4.toFixed(1)}
                      </td>
                      <td
                        className={`p-2 border-b border-gray-200 ${
                          H2S > 7 ? "text-red-600 font-semibold" : ""
                        }`}
                      >
                        {H2S.toFixed(1)}
                      </td>
                      <td className="p-2 border-b border-gray-200">{linkedMH}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </>
        )
      ) : (
        <div className="text-center p-8 text-gray-500">
          <p>Please select a ward for the prevent.</p>
        </div>
      )}
    </div>
  );
};

export default PreventComp;