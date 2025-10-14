import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup as LeafletPopup, useMap } from "react-leaflet";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "leaflet/dist/leaflet.css";
import DatePicker from "react-datepicker";
import {
  MapPin,
  MapPinned,
  Bot,
  Calendar,
  Clock,
  Trash,
  Funnel,
  CalendarIcon,
  ClockIcon,
  Download,
} from "lucide-react";

const RobotPopUp = ({ activeRecord, closePopup }) => {
  const [detailedFromDate, setDetailedFromDate] = useState(null);
  const [detailedToDate, setDetailedToDate] = useState(null);
  const [detailedFilteredData, setDetailedFilteredData] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);


  useEffect(() => {
    // Disable background scroll
    document.body.style.overflow = "hidden";

    return () => {
      // Re-enable scroll when popup closes
      document.body.style.overflow = "auto";
    };
  }, []);


  // Initialize filtered data to all operation history initially
  useEffect(() => {
    if (activeRecord?.operation_history) {
      setDetailedFilteredData(activeRecord.operation_history);
    }
  }, [activeRecord]);

  const applyFilter = () => {
    if (!activeRecord?.operation_history) {
      setDetailedFilteredData([]);
      return;
    }

    const filtered = activeRecord.operation_history.filter((item) => {
      const itemDate = new Date(item.timestamp);
      const fromValid = detailedFromDate ? itemDate >= detailedFromDate : true;
      const toValid = detailedToDate ? itemDate <= detailedToDate : true;
      return fromValid && toValid;
    });

    setDetailedFilteredData(filtered);
  };

  const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
      if (lat && lng) map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
  };

  // Determine which record to show in right panel
  const currentRecord = selectedHistory || activeRecord;

  // Extract geo location
  let lat = 0,
    lng = 0;

  if (currentRecord?.location) {
    try {
      const loc = JSON.parse(currentRecord.location); // parse stringified JSON
      lat = parseFloat(loc.latitude); // convert to float
      lng = parseFloat(loc.longitude); // convert to float
    } catch (err) {
      console.error("Invalid geo_location format:", currentRecord.location, err);
    }
  }
  const handleGenerateReport = async () => {
    try {

      const response = await fetch("http://192.168.1.43:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: "generate_Robot_report", 
          params:{
          'device_id':currentRecord.device_id,
          'district':currentRecord.district,
          'division':currentRecord.division,
          'id':currentRecord.id,
          'area':currentRecord.area
          
          }
          
          
          
            // 'device_id':currentRecord.device_id,
            
            // 'division':'DC',
          
        }),
      });
            console.log("Sending payload:", { command: "generate_report"});


      // console.log(body)
      const data = await response.json();
      console.log("Backend response:", data);
      alert(data.Allert);
    } catch (error) {
      console.error("Error calling backend:", error);
    }
  };

// const handleGenerateReport = async () => {
//   try {
//     // Extract fields directly from currentRecord
//     const requestBody = {
//       device_id: currentRecord.device_id || null,
//       district: currentRecord.district || null,
//       division: currentRecord.division || null,
//       area: currentRecord.area || null,
//       start_date: currentRecord.start_date || null,
//       end_date: currentRecord.end_date || null
//     };

//     console.log("Sending payload:", requestBody);
    
//     const response = await fetch("http://192.168.1.8:8000/api/analyze", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(requestBody),  // ✅ Send direct fields
//     });

//     const data = await response.json();
//     console.log("Backend response:", data);
//     alert(`Report started! Job ID: ${data.job_id}`);
    
//   } catch (error) {
//     console.error("Error calling backend:", error);
//     alert(`Error: ${error.message}`);
//   }
// };
  return (
    <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-transparent bg-opacity-50 z-[910]">
      <div className="w-full h-screen bg-[#00000099] flex place-content-center">
        <div className="mx-auto bg-white w-full max-w-[1000px] rounded-lg px-6 overflow-y-auto max-h-[100vh] relative top-5 shadow-2xl border border-gray-297">
          <button
            onClick={closePopup}
            className="popup-btn absolute right-6 text-gray-500 hover:text-black text-5xl top-[10px] cursor-pointer "
          >
            ×
          </button>

          {/* Header */}
          <div className="flex flex-row justify-between pt-5">
            <div className="text-start w-[48%]">
              <h1 className="text-start text-[18px] mb-2">Operational Details</h1>
            </div>
            <div className="text-start w-[48%]">
              <h1 className="text-start text-[18px] mb-2">Operation History</h1>
            </div>
          </div>

          <div className="flex flex-row justify-between px-1">
            {/* Left Panel */}
            <div className="w-[48%]">
              <div className="flex flex-col justify-start text-gray-500 w-full">
                <span className="text-start text-[14px] text-[#676D7E]">
                  <MapPin className="inline-block w-4 mr-2 mb-1 text-blue-600" />
                  Division: {currentRecord?.division || "- "}
                </span>
                <br />
                <span className="text-start text-[14px] text-[#676D7E]">
                  <MapPinned className="inline-block w-4 mr-2 mb-1 text-blue-500" />
                  Section: {currentRecord?.area || "- "}
                </span>
              </div>

              <div className="grid grid-cols-2 w-full text-start text-[14px] text-[#676D7E] mt-5 gap-y-6">
                <span className="flex flex-row">
                  <Bot className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md" color="#0380FC" />
                  <span className="flex flex-col ml-2">
                    Device Id
                    <span className="text-[#21232C] text-[16px]">{currentRecord.device_id}</span>
                  </span>
                </span>
                <span className="flex flex-row">
                  <Calendar className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md" color="#0380FC" />
                  <span className="flex flex-col ml-2">
                    Date
                    <span className="text-[#21232C] text-[16px]">{new Date(currentRecord.timestamp).toLocaleDateString()}</span>
                  </span>
                </span>
                <span className="flex flex-row">
                  <Clock className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md" color="#0380FC" />
                  <span className="flex flex-col ml-2">
                    Starting Time
                    <span className="text-[#21232C] text-[16px]">{new Date(currentRecord.timestamp).toLocaleTimeString()}</span>
                  </span>
                </span>
                <span className="flex flex-row">
                  <Clock className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md" color="#0380FC" />
                  <span className="flex flex-col ml-2">
                    Task Duration
                    <span className="text-[#21232C] text-[16px]">{currentRecord?.operation_time_minutes || "-"} mins</span>
                  </span>
                </span>
                <span className="flex flex-row">
                  <Trash className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md" color="#0380FC" />
                  <span className="flex flex-col ml-2">
                    Waste Collected
                    <span className="text-[#21232C] text-[16px]">{currentRecord?.waste_collected_kg || "-"} kgs</span>
                  </span>
                </span>
                <span>
                  <MapPin className="inline-block w-10 h-10 mr-3 bg-[#0380FC10] p-2 rounded-md" color="#0380FC" />
                  {currentRecord.area}
                </span>
              </div>

              {/* Gas Level */}
              <div className="flex flex-row mt-[24px] border border-gray-500 p-2 py-5 rounded-2xl">
                <div className="flex flex-col text-start text-[14px] text-[#676D7E] gap-y-2 w-max-content flex-shrink-0">
                  <h1 className="text-[18px] text-black font-bold">Gas Level</h1>
                  <p>
                    Methane(CH4):
                    <span className="text-[16px] text-[#21232C]">
                      {currentRecord?.gas_data_raw ? JSON.parse(currentRecord.gas_data_raw).CH4 : "N/A"} ppm
                    </span>
                  </p>
                  <p>
                    Carbon Monoxide(CO):
                    <span className="text-[16px] text-[#21232C]">
                      {currentRecord?.gas_data_raw ? JSON.parse(currentRecord.gas_data_raw).CO : "N/A"} ppm
                    </span>
                  </p>
                  <p>
                    Hydrogen Sulphate(H2S):
                    <span className="text-[16px] text-[#21232C]">
                      {currentRecord?.gas_data_raw ? JSON.parse(currentRecord.gas_data_raw).H2S : "N/A"} ppm
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-center max-w-[120px] m-auto flex-shrink-1">
                  <div style={{ width: "100%", height: "auto", aspectRatio: 1 / 1 }}>
                    <CircularProgressbar
                      value={
                        currentRecord.gas_status?.toLowerCase() === "safe"
                          ? 22
                          : currentRecord.gas_status?.toLowerCase() === "alert"
                            ? 55
                            : currentRecord.gas_status?.toLowerCase() === "toxic"
                              ? 80
                              : 0
                      }
                      text={currentRecord.gas_status ? currentRecord.gas_status.charAt(0).toUpperCase() + currentRecord.gas_status.slice(1).toLowerCase() : "N/A"}
                      styles={buildStyles({
                        textSize: "16px",
                        textColor: "#000",
                        pathColor:
                          currentRecord.gas_status?.toLowerCase() === "toxic"
                            ? "red"
                            : currentRecord.gas_status?.toLowerCase() === "alert"
                              ? "orange"
                              : "green",
                        trailColor: "#eee",
                        strokeLinecap: "round",
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="w-full h-50 text-start text-[#21232C] mt-[24px] bg-gray-100 rounded-lg p-2">
                <div className="flex flex-row justify-between">
                  <h1 className="pb-1 text-start">
                    {lat ?? "-"},{lng ?? ""}
                  </h1>
                  <h1>Manhole ID : {currentRecord?.manhole_id || "-"}</h1>
                </div>

                <div className="bd-gray">
                  {lat !== null && lat !== undefined && lng !== null && lng !== undefined ? (
                    <MapContainer
                      center={[Number(lat), Number(lng)]}
                      zoom={15}
                      className="h-40 rounded-lg"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[Number(lat), Number(lng)]}>
                        <LeafletPopup>{currentRecord.location}</LeafletPopup>
                      </Marker>
                      <RecenterMap lat={Number(lat)} lng={Number(lng)} />
                    </MapContainer>
                  ) : (
                    <p className="text-gray-500 flex items-center justify-center h-40">
                      No location available
                    </p>
                  )}
                </div>
              </div>


              {/* Images and Report */}
              <h1 className="text-[16px] text-[#21232C] mt-[24px] text-start">Operation Images</h1>
              <div className="rounded-lg mt-2 w-full bg-gray-100 overflow-y-auto">
                <div className="flex justify-around px-2">
                  <h1 className="mt-2">Before</h1>
                  <h1 className="mt-2">After</h1>
                </div>
                <div className="grid grid-cols-2 gap-2  mb-2 h-[153px]">
                  <div className="flex flex-col  gap-2">
                    {currentRecord?.images?.some((op) => op.before)
                      ? currentRecord.images.map((op, i) => op.before && <img key={`before-${i}`} src={op.before} alt={`Before ${i}`} className="h-full object-cover rounded-lg border border-gray-100" />)
                      : <img src={currentRecord.before_path} alt="No Before" className="h-full object-cover rounded-lg border" />}
                  </div>
                  <div className="flex flex-col gap-2">
                    {currentRecord?.images?.some((op) => op.after)
                      ? currentRecord.images.map((op, i) => op.after && <img key={`after-${i}`} src={op.after} alt={`After ${i}`} className="h-full object-cover rounded-lg border border-gray-100" />)
                      : <img src={currentRecord.after_path} alt="No After" className="h-full object-cover rounded-lg border" />}
                  </div>
                </div>

              </div>

              <div className="flex justify-center w-full my-[20px] mb-10">
                {/* <button
                  onClick={() => alert("Report Generated Successfully")}
                  className="flex items-center justify-center h-[48px] bg-[#1A8BA8] text-[16px] w-full text-white rounded-[16px] cursor-pointer btn-hover"
                >
                  <Download className="inline-block w-5 h-5 mr-1" color="white" />
                  Generate Operation Report
                </button> */}
                {console.log("currentRecord:", currentRecord)}
                <button
                  onClick={handleGenerateReport}
                  className="flex items-center justify-center h-[48px] bg-[#1A8BA8] text-[16px] w-full text-white rounded-[16px] cursor-pointer btn-hover"
                >
                  <Download className="inline-block w-5 h-5 mr-1" color="white" />
                  Generate Operation Report
                </button>



              </div>
            </div>


            {/* Right Panel - Operation History */}
            <div className="w-[48%]">
              <div className="flex flex-row">
                <span className="inline-block text-[#676D7E] mr-2">
                  <Funnel />
                </span>
                <h1 className="text-start text-[14px]"> Filter by Date Range </h1>
              </div>
              <div className="flex flex-row w-full justify-between mb-5 mt-3 gap-2">
                <div className="text-start w-[45%] mt-2">
                  <label className="block text-[16px] text-[#676D7E100] mb-1">From Date</label>
                  <DatePicker
                    selected={detailedFromDate}
                    onChange={(date) => setDetailedFromDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="border border-gray-300 rounded-md p-2 w-full text-sm"
                    placeholderText="Select From Date"
                    maxDate={new Date()}
                  />

                </div>
                <div className="text-start w-[45%] mt-2">
                  <label className="block text-[16px] text-[#676D7E100] mb-1">To Date</label>
                  <DatePicker
                    selected={detailedToDate}
                    onChange={(date) => setDetailedToDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="border border-gray-300 rounded-md p-2 w-full text-sm"
                    placeholderText="Select Date"
                    maxDate={new Date()}
                  />


                </div>
                <div>
                  <button
                    className="bg-[#1A8BA8] cursor-pointer text-white rounded-md h-10 text-sm px-6 mt-8.5 btn-hover"
                    onClick={applyFilter}
                  >
                    Filter
                  </button>
                </div>
              </div>

              <div className="h-80 shadow overflow-y-auto rounded-md p-2 px-6">
                <ul className="space-y-3">
                  {detailedFilteredData.length > 0
                    ? detailedFilteredData.map((history, index) => {
                      const isActive = selectedHistory?.timestamp === history.timestamp;
                      return (
                        <li key={index} className={`flex items-center justify-between h-12 transition-all ${isActive ? "bg-gray-200" : ""}`}>
                          <div>
                            <span className="mr-8">
                              <CalendarIcon className="h-4 inline-block" />
                              {new Date(history.timestamp).toLocaleDateString()}
                            </span>
                            <span className="mr-8">
                              <ClockIcon className="h-4 inline-block" />
                              {new Date(history.timestamp).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                              })}
                            </span>
                          </div>
                          <button
                            className={`btn-view-more flex items-center rounded-[6px] cursor-pointer h-8 px-2 transition-colors ${isActive ? "bg-blue-700 text-white" : "bg-blue-500 text-white"}`}
                            onClick={() => setSelectedHistory(history)}
                          >
                            View More
                          </button>
                        </li>
                      );
                    })
                    : (
                      <li className="text-center text-gray-500 py-4">No Records Found</li>
                    )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>




    </div>
  );
};

export default RobotPopUp;
