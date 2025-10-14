import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Main application component
const App = () => {
    const chartRefs = useRef({});
    const [fetchedData, setFetchedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hardcoded data that doesn't change
    const hardcodedCardData = [
        { iconClass: "fa-solid fa-map", label: "Total Area (sq m)", value: "726,916.26" },
        { iconClass: "fa-solid fa-fire", label: "Slum Area (sq m)", value: "82,350.66" },
        { iconClass: "fa-solid fa-water", label: "Waterbody (sq m)", value: "178,908.15" },
        { iconClass: "fa-solid fa-ruler-combined", label: "Perimeter (m)", value: "2,273.81" },
        { iconClass: "fa-solid fa-fire-flame-curved", label: "Hotspots", value: "20" },
        { iconClass: "fa-solid fa-robot", label: "Robots", value: "15" },
    ];

    const hardcodedImageCards = [
        { src: "https://placehold.co/300x200/e2e8f0/1a202c?text=Landuse", alt: "Landuse", label: "Landuse" },
        { src: "https://placehold.co/300x200/e2e8f0/1a202c?text=Sewage+Network", alt: "Sewage Network", label: "Sewage Network" },
        { src: "https://placehold.co/300x200/e2e8f0/1a202c?text=Surface", alt: "Surface", label: "Surface" },
        { src: "https://placehold.co/300x200/e2e8f0/1a202c?text=Hotspot", alt: "Hotspot", label: "Hotspot" },
    ];

    // Function to fetch data from the Google Sheet
    const fetchData = async () => {
        // Corrected URL to get Tab-Separated Values (TSV)
        const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsAGjWDY4O-BeUHO4ECifCzY5I3p4Gi7zvMEUKF8QRUcq3nx8k_FaOBRDb-H7sjzhb3kHTmXDyHN0d/pub?gid=449318028&single=true&output=tsv";
          

        try {
            const response = await fetch(sheetUrl);
            if (!response.ok) {
                throw new Error(` HTTP error! status: ${response.status}`);
            }
            const textData = await response.text();

            // Split the data into rows and then into cells
            const rows = textData.split('\n').map(row => row.trim().split('\t'));
            
            // Get the headers from the first row
            const headers = rows[0].map(header => header.trim());
            const dataRows = rows.slice(1);

            // Create a structured object from the data for easier access
            const parsedData = {};
            dataRows.forEach(row => {
                const title = row[headers.indexOf('Title')]?.trim();
                if (title) {
                    parsedData[title] = {
                        labels: [],
                        data: [],
                        colors: []
                    };
                    for (let i = 1; i <= 5; i++) {
                        const label = row[headers.indexOf(`Label ${i}`)]?.trim();
                        const dataValue = parseFloat(row[headers.indexOf(`Data ${i}`)]?.replace(',', '.') || '0');
                        const color = row[headers.indexOf(`Color ${i}`)]?.trim();

                        if (label && !isNaN(dataValue)) {
                            parsedData[title].labels.push(label);
                            parsedData[title].data.push(dataValue);
                            parsedData[title].colors.push(color);
                        }
                    }
                }
            });

            // Extract table data (assuming it's at the end of the sheet)
            const tableHeaders = rows[29]?.map(h => h.trim());
            const tableData = rows.slice(30).map(row => row.map(cell => cell.trim()));
            
            setFetchedData({ pieChartData: parsedData, tableData: [tableHeaders, ...tableData] });
            setLoading(false);

        } catch (e){
            console.error('Error fetching data:', e);
            setError("Failed to load data. Please check the network and sheet URL.");
            setLoading(false);
        }
    };

    // Function to initialize and update a pie chart
    const updateChart = (id, labels, data, colors) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;

        const existingChart = Chart.getChart(id);
        if (existingChart) {
            existingChart.destroy();
        }

        chartRefs.current[id] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{ data, backgroundColor: colors }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    datalabels: {
                        color: '#fff',
                        formatter: (value, context) => {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            return total ?  `${((value / total) * 100).toFixed(1)}%` : '';
                        }
                    }
                }
            },
        });
    };

    // This effect runs once on component mount to fetch data
    useEffect(() => {
        if (window.ChartDataLabels) {
            Chart.register(window.ChartDataLabels);
        }
        fetchData();
    }, []);

    // This effect runs whenever fetchedData changes to update the charts
    useEffect(() => {
        if (fetchedData && fetchedData.pieChartData) {
            const chartTitles = [
                "Land Use Mix", "Manhole Condition", "Sewer Length by Area", "Waste by Blockage",
                "Junction Type Share", "Clogging Share", "Robots by Area", "Hotspot Share"
            ];
            chartTitles.forEach((title, index) => {
                const chartData = fetchedData.pieChartData[title];
                if (chartData) {
                    updateChart(`pie${index + 1}`, chartData.labels, chartData.data, chartData.colors);
                }
            });
        }
    }, [fetchedData]);

    const Card = ({ iconClass, label, value }) => (
        <div className="bg-white rounded-xl p-2 flex items-center shadow-sm border border-gray-200">
            <div className="bg-gray-100 rounded-lg p-3 text-lg mr-3 text-gray-600">
                <i className={iconClass}></i>
            </div>
            <div>
                <h3 className="text-zinc-950 font-semibold">{value}</h3>
                <p className="text-gray-500 text-sm">{label}</p>
            </div>
        </div>
    );

    const ChartCard = ({ title, chartId }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base text-center font-bold mb-2">{title}</h3>
            <div className="h-64">
                <canvas id={chartId}></canvas>
            </div>
        </div>
    );

    const ImageCard = ({ src, alt, label }) => (
        <div className="flex flex-col items-center">
            <img src={src} alt={alt} className="w-full rounded-lg border border-gray-300 mb-2" />
            <p className="text-lg font-bold">{label}</p>
          
        </div>
    );

    const Table = ({ data }) => {
        if (!data || data.length < 2) return <div>No data available.</div>;
        const headers = data[0];
        const rows = data.slice(1);

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr>
                            {headers?.map((header, index) => (
                                <th key={index} className="px-4 py-2 text-left bg-gray-50 font-semibold border border-gray-300">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-2 border border-gray-300">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 font-sans text-black min-h-screen">
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
            <div className="bg-gray-900 text-white p-4 text-center  w-full">
                <h1 className="text-xl md:text-2xl font-bold">Ward Report - Hasmathpet</h1>
                <p className="text-sm md:text-base">Comprehensive analysis of manhole network, operational records, and area data</p>
            </div>
            <div className="container mx-auto p-5 max-w-7xl">
                {loading ? (
                    <div className="text-center text-gray-500">Loading data...</div>
                ) : error ? (
                    <div className="text-center text-red-500">{error}</div>
                ) : (
                    <>
                        <h1 className="text-center font-bold text-2xl mb-5 text-gray-800">Ward META Data</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 mb-5">
                            {hardcodedCardData.map((data, index) => <Card key={index} iconClass={data.iconClass} label={data.label} value={data.value} />)}
                        </div>
                        <h1 className="text-center font-bold text-2xl mb-5 text-gray-800">Ward Analysis</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                            <ChartCard title="Land Use Mix" chartId="pie1" />
                            <ChartCard title="Manhole Condition" chartId="pie2" />
                            <ChartCard title="Sewer Length by Area" chartId="pie3" />
                            <ChartCard title="Waste by Blockage" chartId="pie4" />
                            <ChartCard title="Junction Type Share" chartId="pie5" />
                            <ChartCard title="Clogging Share" chartId="pie6" />
                            <ChartCard title="Robots by Area" chartId="pie7" />
                            <ChartCard title="Hotspot Share" chartId="pie8" />
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-md mb-5 border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4 border-l-4 border-blue-500 pl-2">Ward Operation</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 text-center">
                                {hardcodedImageCards.map((data, index) => <ImageCard key={index} src={data.src} alt={data.alt} label={data.label} />)}
                            </div>
                            <p className="mt-4 text-gray-600 text-sm md:text-base">The Hotspot analysis revealed a clear concentration around the lake, primarily driven by high impervious surface coverage, slope-induced runoff patterns, and surrounding land use pressures.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                            <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                                <h2 className="text-xl font-semibold mb-4 border-l-4 border-blue-500 pl-2">Top Manholes by Clog Incidents</h2>
                                <Table data={fetchedData?.tableData} />
                            </div>
                            <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                                <h2 className="text-xl font-semibold mb-4 border-l-4 border-blue-500 pl-2">Sewer Areas: Length & Robots</h2>
                                <Table data={[
                                    ['Area Type', 'Length (km)', 'Robots'],
                                    ['Residential', '12.93', '10'],
                                    ['Slum', '12.87', '10'],
                                    ['Waterbody', '16.23', '10'],
                                    ['Residential', '11.84', '10'],
                                    ['Slum', '17.55', '10'],
                                ]} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <Card iconClass="fa-solid fa-trash" label="Avg Waste (kg)" value="5.97" />
                            <Card iconClass="fa-solid fa-stopwatch" label="Avg Time (mins)" value="22.79" />
                        </div>
                        <div className="container mx-auto p-5 max-w-7xl">
                            <div className="text-center font-normal text-xl p-2 mb-5">
                                <p className="mb-2"><strong>Hasmathpet Ward</strong> spans <strong>726,916 sq.m</strong>, with significant water bodies and slum areas, requiring focused sewer maintenance and hotspot management.</p>
                                <p>Key priorities: Repair poor manholes (MH-0024),(MH-0044), address clog-prone junctions, and protect waterbody-adjacent sewers.</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;