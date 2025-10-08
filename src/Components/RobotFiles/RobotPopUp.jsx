
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";
import "leaflet/dist/leaflet.css";

const RobotPopUp = () => {

    const RecenterMap = ({ lat, lng }) => {
        const map = useMap();
        useEffect(() => {
          if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
          }
        }, [lat, lng, map]);
        return null;
      };
      
    return (
        <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-transparent bg-opacity-50 z-[910]">
          <div className="w-full h-screen bg-[#00000099] flex place-content-center">
            <div className="mx-auto bg-white w-full max-w-[1000px] rounded-lg px-6 overflow-y-auto max-h-[100vh] relative top-5 shadow-2xl border border-gray-297">
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
                      <MapPin className="inline-block w-4  mr-2 mb-1 text-blue-600 " />
                      Division:{activeRecord?.division || "- "}
                    </span>
                    <br />
                    <span className="text-start text-[14px] text-[#676D7E]">
                      <MapPinned className="inline-block w-4  mr-2 mb-1 text-blue-500 " />
                      Section:{activeRecord?.ward || "- "}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 w-full text-start text-[14px] text-[#676D7E] mt-5 gap-y-6">
                    <span className="flex flex-row">
                      <Bot
                        className="inline-block w-10 h-10 mr-1 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      <span className="flex flex-col ml-2">
                        Device Id{""}
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
                          {activeRecord?.operation_time_minutes || "-"} mins
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
                          {activeRecord?.waste_collected_kg || "-"}kgs
                        </span>
                      </span>
                    </span>
                    <span>
                      {" "}
                      <MapPin
                        className="inline-block w-10 h-10 mr-3 bg-[#0380FC10] p-2 rounded-md"
                        color="#0380FC"
                      />
                      {activeRecord.ward}
                    </span>
                  </div>
                  <div className="flex flex-row mt-[24px] border border-gray-500 p-2 py-5 rounded-2xl ">
                    <div className="flex flex-col text-start text-[14px] text-[#676D7E] gap-y-2  w-max-content  flex-shrink-0">
                      <h1 className="text-[18px] text-black font-bold">
                        Gas Level
                      </h1>
                      <p>
                        Methane(CH4) : {"  "}
                        <span className="text-[16px] text-[#21232C]">
                          {" "}
                          {activeRecord?.gas_data_raw
                            ? JSON.parse(activeRecord.gas_data_raw).CH4
                            : "N/A"}{" "}
                          ppm
                        </span>
                      </p>
                      <p>
                        Carbon Monoxide(CO) :{"  "}
                        <span className="text-[16px] text-[#21232C]">
                          {" "}
                          {activeRecord?.gas_data_raw
                            ? JSON.parse(activeRecord.gas_data_raw).CO
                            : "N/A"}{" "}
                          ppm
                        </span>
                      </p>
                      <p>
                        Hydrogen Sulphate(H2S) : {"  "}
                        <span className="text-[16px] text-[#21232C]">
                          {" "}
                          {activeRecord?.gas_data_raw
                            ? JSON.parse(activeRecord.gas_data_raw).H2S
                            : "N/A"}{" "}
                          ppm
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-center max-w-[120px] m-auto  flex-shrink-1">
                      <div
                        style={{
                          width: "100%",
                          height: "auto",
                          aspectRatio: 1 / 1,
                        }}
                      >
                        <CircularProgressbar
                          value={
                            activeRecord.gas_status?.toLowerCase() === "safe"
                              ? 22
                              : activeRecord.gas_status?.toLowerCase() ===
                                "alert"
                              ? 55
                              : activeRecord.gas_status?.toLowerCase() ===
                                "toxic"
                              ? 80
                              : 0
                          }
                          text={
                            activeRecord.gas_status
                              ? activeRecord.gas_status
                                  .charAt(0)
                                  .toUpperCase() +
                                activeRecord.gas_status.slice(1).toLowerCase()
                              : "N/A"
                          }
                          styles={buildStyles({
                            textSize: "16px",
                            textColor: "#000",
                            pathColor:
                              activeRecord.gas_status?.toLowerCase() === "toxic"
                                ? "red"
                                : activeRecord.gas_status?.toLowerCase() ===
                                  "alert"
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
                      <h1 className="pb-1 text-start">
                        {console.log(
                          "Latitude:====",
                          activeRecord.geo_location
                        )}
                        {activeRecord?.geo_location
                          ? JSON.parse(activeRecord.geo_location).latitude
                          : activeRecord?.geo_location?.latitude}
                        ,{" "}
                        {activeRecord?.geo_location
                          ? JSON.parse(activeRecord.geo_location).longitude
                          : activeRecord?.geo_location?.longitude}
                      </h1>
                      <h1>
                        Manhole ID : {activeRecord?.manhole_id || "Unknown"}
                      </h1>
                    </div>
                    {/* Map Container */}
                    <div className="bd-gray">
                      {activeRecord?.geo_location ? (
                        (() => {
                          let lat = 0;
                          let lng = 0;

                          try {
                            // Parse location JSON string
                            const loc = JSON.parse(activeRecord.geo_location);

                            lat = parseFloat(loc.latitude);
                            lng = parseFloat(loc.longitude);
                          } catch (err) {
                            console.error(
                              "Invalid location format:",
                              activeRecord.geo_location,
                              err
                            );
                          }

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
                                <Popup>{activeRecord.geo_location}</Popup>
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
                  <h1 className="text-[16px] text-[#21232C] mt-[24px] text-start">
                    Operation Images
                  </h1>
                  <div className="rounded-lg mt-2 w-full  bg-gray-100 overflow-y-auto ">
                    <div className="flex justify-around px-2">
                      <h1 className="mt-2">Before</h1>
                      <h1 className="mt-2">After</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-10 h-[150px]">
                      <div className="flex flex-col gap-2">
                        {activeRecord?.images?.some((op) => op.before) ? (
                          activeRecord.images.map((op, i) =>
                            op.before ? (
                              <img
                                key={`before-${i}`}
                                src={op.before}
                                alt={`Before ${i}`}
                                className="h-full object-cover rounded-lg border border-gray-100"
                              />
                            ) : null
                          )
                        ) : (
                          <img
                            src={activeRecord.before_path}
                            alt="No Before"
                            className="h-full object-cover rounded-lg border"
                          />
                        )}
                      </div>

                      {/* After column */}

                      <div className="flex flex-col gap-2">
                        {activeRecord?.images?.some((op) => op.after) ? (
                          activeRecord.images.map((op, i) =>
                            op.after ? (
                              <img
                                key={`after-${i}`}
                                src={op.after}
                                alt={`After ${i}`}
                                className="h-full object-cover rounded-lg border border-gray-100"
                              />
                            ) : null
                          )
                        ) : (
                          <img
                            src={activeRecord.after_path}
                            alt="No After"
                            className="h-full object-cover rounded-lg border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  {console.log(
                    activeRecord?.before_path,
                    activeRecord?.after_path
                  )}
                  <div className=" flex justify-center w-full my-[20px] mb-10 ">
                    <button
                      onClick={() => alert("Report Generated Successfully")}
                      className=" flex items-center justify-center h-[48px] bg-[#1A8BA8] text-[16px]  w-full text-white rounded-[16px] cursor-pointer btn-hover"
                    >
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
                        max={new Date().toISOString().split("T")[0]}
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
                        max={new Date().toISOString().split("T")[0]} // 🚀 restricts future dates
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

                  <div className="h-80 shadow overflow-y-auto  rounded-md p-2 px-6">
                    <ul className="space-y-3">
                      {showResults && detailedFilteredData.length > 0
                        ? detailedFilteredData.map((history, index) => {
                            const isActive =
                              selectedHistory?.timestamp === history.timestamp;

                            return (
                              <li
                                key={index}
                                className={`flex items-center justify-between h-12 transition-all ${
                                  isActive ? "bg-gray-200" : ""
                                }`}
                              >
                                <div>
                                  <span className="mr-8">
                                    <CalendarIcon className="h-4 inline-block" />
                                    {new Date(
                                      history.timestamp
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className="mr-8">
                                    <ClockIcon className="h-4 inline-block" />
                                    {new Date(
                                      history.timestamp
                                    ).toLocaleTimeString("en-GB", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: false,
                                    })}
                                  </span>
                                </div>
                                <button
                                  className={`btn-view-more flex items-center rounded-[6px] cursor-pointer h-8 px-2 transition-colors ${
                                    isActive
                                      ? "bg-blue-700 text-white"
                                      : "bg-blue-500 text-white"
                                  }`}
                                  onClick={() => setSelectedHistory(history)}
                                >
                                  View More
                                </button>
                              </li>
                            );
                          })
                        : showResults && (
                            <li className="text-center text-gray-500 py-4">
                              No Records Found
                            </li>
                          )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    )
};

export default RobotPopUp;
