import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

// The 'import' statement for the plugin was causing a compilation error.
// We will now rely on the <script> tag to load the plugin globally.
// This line has been commented out to resolve the issue.
// import ChartDataLabels from 'chartjs-plugin-datalabels';

// The Chart.js plugin is now loaded and registered by the script tag,
// so this manual registration is no longer needed and causes the error.
// Chart.register(ChartDataLabels);

const ManholeReport = () => {
  const [manholeData, setManholeData] = useState([]);
  const [selectedManhole, setSelectedManhole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [operationHistory, setOperationHistory] = useState([]);
  const chartRefs = useRef({});

  // Function to dynamically update or create a chart
  const updateChart = (id, type, labels, data, config) => {
    if (chartRefs.current[id]) {
      chartRefs.current[id].data.labels = labels;
      chartRefs.current[id].data.datasets[0].data = data;
      chartRefs.current[id].update();
    } else {
      const ctx = document.getElementById(id);
      if (ctx) {
        chartRefs.current[id] = new Chart(ctx, {
          type,
          data: { labels, datasets: [{ data, ...config }] },
          options: { responsive: true, ...config.options },
        });
      }
    }
  };

  // Specific functions for different chart types
  const updatePieChart = (id, labels, data, colors) => {
    // Filter out NaN and null values before updating the chart
    const validData = data.filter(d => !isNaN(d) && d !== null);
    const validLabels = labels.filter((label, index) => !isNaN(data[index]) && data[index] !== null);
    const validColors = colors.filter((color, index) => !isNaN(data[index]) && data[index] !== null);

    updateChart(id, 'pie', validLabels, validData, {
      backgroundColor: validColors,
      options: {
        plugins: {
          legend: { position: 'bottom' },
          datalabels: {
            color: '#fff',
            formatter: (v, ctx) => {
              const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              return total ? `${(v / total * 100).toFixed(1)}%` : '';
            },
          },
        },
      },
    });
  };

  const updateBarChart = (id, labels, data, label) => {
    // Filter out NaN and null values before updating the chart
    const validData = data.filter(d => !isNaN(d) && d !== null);
    const validLabels = labels.filter((label, index) => !isNaN(data[index]) && data[index] !== null);

    updateChart(id, 'bar', validLabels, validData, {
      label,
      backgroundColor: '#3b82f6',
      options: {
        plugins: {
          legend: { display: false },
          datalabels: { anchor: 'end', align: 'top', color: '#4b5563' },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
  };

  // This is the function that directly fetches data from the Google Sheet
  const fetchManholeData = async () => {
    try {
      // Corrected URL to get a Tab-Separated Values (TSV) file
      const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsAGjWDY4O-BeUHO4ECifCzY5I3p4Gi7zvMEUKF8QRUcq3nx8k_FaOBRDb-H7sjzhb3kHTmXDyHN0d/pub?gid=653480361&single=true&output=tsv";
      const response = await fetch(sheetUrl);
      const textData = await response.text();
      const rows = textData.split('\n').slice(1);
      
      const data = rows.map(row => {
        // Here we are manually mapping the positional data from the TSV to named variables.
        const [
          manhole_id,map_location, last_operation_date, total_ops, co, ch4, h2s, clean_freq, days_since_clean,
          next_clean_days, next_clean_date, condition_fair, condition_good, condition_poor,
          residential_km, slum_km, waterbody_km, waste_low, waste_med, waste_high,
          junction_y, junction_bend, junction_multi, junction_straight, junction_cross,
          clogging_bend, clogging_y, clogging_straight, clogging_multi, clogging_cross, Date, activity, Remarks,
        ] = row.split('\t');
        
        // Split the date string to reformat it for correct parsing.
        const [day, month, year] = last_operation_date.split('-');
        const formattedDate = `${month}-${day}-${year}`;

        // Create a single-item array for operation history from the new columns
        const operationHistory = (Date || activity || Remarks) ? [{ date: Date, activity: activity, remarks: Remarks }] : [];

        return {
          manhole_id: manhole_id,
          maplocation: map_location,
          last_operation_date: formattedDate,
          total_ops: parseInt(total_ops),
          // Fix: Replace comma with a period for correct parsing
          co: parseFloat(co.replace(',', '.')),
          ch4: parseFloat(ch4.replace(',', '.')),
          h2s: parseFloat(h2s.replace(',', '.')),
          clean_freq: parseInt(clean_freq),
          days_since_clean: parseInt(days_since_clean),
          next_clean_days: parseInt(next_clean_days),
          next_clean_date: next_clean_date,
          condition_fair: parseInt(condition_fair),
          condition_good: parseInt(condition_good),
          condition_poor: parseInt(condition_poor),
          residential_km: parseFloat(residential_km.replace(',', '.')),
          slum_km: parseFloat(slum_km.replace(',', '.')),
          waterbody_km: parseFloat(waterbody_km.replace(',', '.')),
          waste_low: parseFloat(waste_low.replace(',', '.')),
          waste_med: parseFloat(waste_med.replace(',', '.')),
          waste_high: parseFloat(waste_high.replace(',', '.')),
          junction_y: parseInt(junction_y),
          junction_bend: parseInt(junction_bend),
          junction_multi: parseInt(junction_multi),
          junction_straight: parseInt(junction_straight),
          junction_cross: parseInt(junction_cross),
          clogging_bend: parseInt(clogging_bend),
          clogging_y: parseInt(clogging_y),
          clogging_straight: parseInt(clogging_straight),
          clogging_multi: parseInt(clogging_multi),
          clogging_cross: parseInt(clogging_cross),
          operation_history: operationHistory
        };
      });
      setManholeData(data);
      setSelectedManhole(data[0]);
    } catch (error) {
      console.error('Error fetching manhole data:', error);
      setErrorMessage('Could not fetch data. Please check the sheet URL and if it is published.');
    }
  };

  // Effect to fetch data on initial load
  useEffect(() => {
    fetchManholeData();
  }, []);

  // Effect to update charts when selected manhole data changes
  useEffect(() => {
    if (selectedManhole) {
      // Update the state for the operation history based on the selected manhole's data.
      setOperationHistory(selectedManhole.operation_history);

      updatePieChart('gasPie', ['CO', 'CH₄', 'H₂S'], [selectedManhole.co, selectedManhole.ch4, selectedManhole.h2s], ['#B67300', '#60a5fa', '#ef4444']);
      updatePieChart('condPie', ['Fair', 'Good', 'Poor'], [selectedManhole.condition_fair, selectedManhole.condition_good, selectedManhole.condition_poor], ['#60a5fa', '#22c55e', '#ef4444']);
      updatePieChart('sewerPie', ['Residential', 'Slum', 'Waterbody'], [selectedManhole.residential_km, selectedManhole.slum_km, selectedManhole.waterbody_km], ['#3b82f6', '#E40000', '#8b5cf6']);
      updateBarChart('wasteBar', ['Low', 'Medium', 'High'], [selectedManhole.waste_low, selectedManhole.waste_med, selectedManhole.waste_high], 'Avg Waste (kg)');
      updateBarChart('junctionBar', ['Y-Junction', 'Bend', 'Multi-Inlet', 'Straight', 'Cross'], [selectedManhole.junction_y, selectedManhole.junction_bend, selectedManhole.junction_multi, selectedManhole.junction_straight, selectedManhole.junction_cross], 'Count');
      updateBarChart('cloggingBar', ['Bend', 'Y-Junction', 'Straight', 'Multi-Inlet', 'Cross'], [selectedManhole.clogging_bend, selectedManhole.clogging_y, selectedManhole.clogging_straight, selectedManhole.clogging_multi, selectedManhole.clogging_cross], 'Incidents');
    }
  }, [selectedManhole]);

  // Handle change for the dropdown selector
  const handleSelectChange = (e) => {
    const data = manholeData.find(m => m.manhole_id === e.target.value);
    setSelectedManhole(data);
  };

  // Function to format the date string, or return "N/A" if invalid.
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  return (
    <>
      {/* Tailwind CSS and Chart.js scripts */}
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
      
      <div className="bg-gray-50 text-gray-900 font-sans ">
        <header className="bg-gray-800 text-white text-center py-4 w-full ml-[520px]">
          <h1 className="text-3xl font-bold"> Manhole Report</h1>
          <p className="mt-2 text-sm">Detailed operational, inspection, and predictive analysis</p>
        </header>
        <div className="dashboard-container max-w-6xl mx-auto p-5 min-h-screen pb-12">
          {errorMessage && (
            <div className="bg-red-500 text-white p-3 rounded-lg text-center mb-5">
              {errorMessage}
            </div>
          )}
          <div className="manhole-selector mb-5 text-center">
            <label htmlFor="manhole-id-select" className="text-lg font-semibold text-gray-600">
              Select Manhole ID:
            </label>
            <select
              id="manhole-id-select"
              onChange={handleSelectChange}
              value={selectedManhole?.manhole_id || ''}
              className="p-2 rounded-md border border-gray-300 text-base ml-3"
            >
              {manholeData.map((manhole) => (
                <option key={manhole.manhole_id} value={manhole.manhole_id}>
                  {manhole.manhole_id}
                </option>
              ))}
            </select>
          </div>
          {selectedManhole && (
            <>
              <div className="card-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div className="card bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-200 shadow-md">
                  <div className="card-icon bg-gray-100 rounded-lg p-3 text-2xl text-gray-600">
                    🕳️
                  </div>
                  <div>
                    <h3 className="m-0 text-lg font-bold">
                      {selectedManhole.manhole_id}
                    </h3>
                    <p className="m-0 text-sm text-gray-500">Manhole ID</p>
                  </div>
                </div>
                <div className="card bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-200 shadow-md">
                  <div className="card-icon bg-gray-100 rounded-lg p-3 text-2xl text-gray-600">
                    🧹
                  </div>
                  <div>
                    <h3 className="m-0 text-lg font-bold">
                      {formatDate(selectedManhole.last_operation_date)}
                    </h3>
                    <p className="m-0 text-sm text-gray-500">Last Cleaned</p>
                  </div>
                </div>
                <div className="card bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-200 shadow-md">
                  <div className="card-icon bg-gray-100 rounded-lg p-3 text-2xl text-gray-600">
                    🔄
                  </div>
                  <div>
                    <h3 className="m-0 text-lg font-bold">
                      {isNaN(selectedManhole.total_ops) ? 'N/A' : selectedManhole.total_ops}
                    </h3>
                    <p className="m-0 text-sm text-gray-500">Total Operations</p>
                  </div>
                </div>
              </div>
              <div className="map-card bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-5 text-center max-w-3xl mx-auto">
                <div className="section-title text-center font-bold text-2xl bg-gray-100 rounded-lg p-3 mb-5 font-sans">
                  {`${selectedManhole.manhole_id} Location Map`}
                </div>
               <img
                  // Use a placeholder image that is based on the location.
                  src={`https://placehold.co/650x300/e2e8f0/1a202c?text=Map+of+Manhole+at+${selectedManhole.map_location}`}
                  alt="Manhole Map"
                  className="w-full rounded-lg border border-gray-300"
                />
              </div>
              <div className="two-col grid md:grid-cols-2 gap-5 mb-5">
                <div className="section bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h2 className="mb-3 text-lg border-l-4 border-blue-500 pl-3">
                    Gas Readings
                  </h2>
                  <table className="w-full border-collapse bg-white">
                    <tbody>
                      <tr>
                        <th className="p-2 text-left bg-gray-50 font-semibold border border-gray-300">
                          CO
                        </th>
                        <td className="p-2 text-left border border-gray-300">
                          {isNaN(selectedManhole.co) ? 'N/A' : selectedManhole.co}
                        </td>
                      </tr>
                      <tr>
                        <th className="p-2 text-left bg-gray-50 font-semibold border border-gray-300">
                          CH₄
                        </th>
                        <td className="p-2 text-left border border-gray-300">
                          {isNaN(selectedManhole.ch4) ? 'N/A' : selectedManhole.ch4}
                        </td>
                      </tr>
                      <tr>
                        <th className="p-2 text-left bg-gray-50 font-semibold border border-gray-300">
                          H₂S
                        </th>
                        <td className="p-2 text-left border border-gray-300">
                          {isNaN(selectedManhole.h2s) ? 'N/A' : selectedManhole.h2s}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="section bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h2 className="mb-3 text-lg border-l-4 border-blue-500 pl-3">
                    Cleaning Prediction
                  </h2>
                  <table className="w-full border-collapse bg-white">
                    <tbody>
                      <tr>
                        <th className="p-2 text-left bg-gray-50 font-semibold border border-gray-300">
                          Cleaning Frequency
                        </th>
                        <td className="p-2 text-left border border-gray-300">
                          {isNaN(selectedManhole.clean_freq) ? 'N/A' : `${selectedManhole.clean_freq} days`}
                        </td>
                      </tr>
                      <tr>
                        <th className="p-2 text-left bg-gray-50 font-semibold border border-gray-300">
                          Days Since Last Cleaning
                        </th>
                        <td className="p-2 text-left border border-gray-300">
                          {isNaN(selectedManhole.days_since_clean) ? 'N/A' : `${selectedManhole.days_since_clean} days`}
                        </td>
                      </tr>
                      <tr>
                        <th className="p-2 text-left bg-gray-50 font-semibold border border-gray-300">
                          Next Cleaning
                        </th>
                        <td className="p-2 text-left border border-gray-300">
                          {isNaN(selectedManhole.next_clean_days) ? 'N/A' : `${selectedManhole.next_clean_days} days remaining`}
                        </td>
                      </tr>
                      <tr>
                        <th className="p-2 text-left bg-gray-50 font-semibold border border-gray-300">
                          Next Cleaning Date
                        </th>
                        <td className="p-2 text-left border border-gray-300">
                          {selectedManhole.next_clean_date}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="section bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-5">
                <h2 className="mb-3 text-lg border-l-4 border-blue-500 pl-3">
                  Operation Summary
                </h2>
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr>
                      <th className="p-2 text-left bg-gray-100 font-semibold border border-gray-300">Date</th>
                      <th className="p-2 text-left bg-gray-100 font-semibold border border-gray-300">Activity</th>
                      <th className="p-2 text-left bg-gray-100 font-semibold border border-gray-300">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationHistory.map((op, index) => (
                      <tr key={index}>
                        <td className="p-2 text-left border border-gray-300">{op.date}</td>
                        <td className="p-2 text-left border border-gray-300">{op.activity}</td>
                        <td className="p-2 text-left border border-gray-300">{op.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="section-title text-center font-bold text-2xl bg-gray-100 rounded-lg p-3 mb-5 font-sans">
                Manhole Analytics
              </div>
              <div className="charts-grid grid md:grid-cols-2 gap-5">
                <div className="chart-card bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h3 className="m-0 mb-3 text-base text-center">
                    Gas Composition
                  </h3>
                  <canvas id="gasPie"></canvas>
                </div>
                <div className="chart-card bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h3 className="m-0 mb-3 text-base text-center">
                    Condition Distribution
                  </h3>
                  <canvas id="condPie"></canvas>
                </div>
                <div className="chart-card bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h3 className="m-0 mb-3 text-base text-center">
                    Sewer Length by Area
                  </h3>
                  <canvas id="sewerPie"></canvas>
                </div>
                <div className="chart-card bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h3 className="m-0 mb-3 text-base text-center">
                    Waste by Blockage
                  </h3>
                  <canvas id="wasteBar"></canvas>
                </div>
                <div className="chart-card bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h3 className="m-0 mb-3 text-base text-center">
                    Junction Type Distribution
                  </h3>
                  <canvas id="junctionBar"></canvas>
                </div>
                <div className="chart-card bg-white border border-gray-200 rounded-xl shadow-md p-4">
                  <h3 className="m-0 mb-3 text-base text-center">
                    Clogging by Junction
                  </h3>
                  <canvas id="cloggingBar"></canvas>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ManholeReport;