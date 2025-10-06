import React from 'react';
import DashAccordian from './DashAccordian';
import { FaDirections } from "react-icons/fa";

const ManholePopUp = ({
  selectedLocation,
  onClose,
  onGenerateReport,
  onAssignBot,
}) => {
  if (!selectedLocation) return null;

  // Helper function to get color based on status string
  const getStatusColorFromStatus = (status) => {
    switch (status) {
      case 'safe':
        return "#16A249";
      case 'warning':
        return "#E7B008";
      case 'danger':
        return "#EF4343";
      default:
        return "#808080"; // Grey for unknown status
    }
  };

  const getStatusIcon = (status) => {
    const color = getStatusColorFromStatus(status);
    return (
      <div
        className="rounded-full w-[15px] h-[15px] aspect-square border-2 border-white shadow-md shadow-[0px 3.36px 5.04px -3.36px #0000001A;]"
        style={{ backgroundColor: color }}
      ></div>
    );
  };

  const riskLevel = (depth, waterLevel) => {
    if (depth <= 0) return 0;
    let risk = (waterLevel / depth) * 100;
    if (risk > 100) risk = 100;
    if (risk < 0) risk = 0;
    return parseFloat(risk.toFixed(1));
  };

  const {
    depth_manhole_m: depth,
    water_level_m: waterLevel,
  } = selectedLocation;
  const risk = riskLevel(parseFloat(depth), parseFloat(waterLevel));
  const popupHeaderColor = getStatusColorFromStatus(selectedLocation.status);

  return (
    <div className="manhole-popup-box bg-grey-50 rounded-xl border-1 border-t-0 border-[#333] w-full ">
      {/* Header */}
      <div className="w-full flex justify-between rounded-xl align-middle place-items-center gap-2 p-4 border-y-1  sticky top-0">
        <h4 className="font-[600] text-black">Manhole Details</h4>
        <button
          onClick={() => onClose()}
          className="cursor-pointer text-black hover:text-gray-800 hover:rotate-180 transition-all duration-110"
        >
          <span className="text-2xl font-bold">&#x2715;</span>
        </button>
      </div>

      <div className="w-[95%] m-auto rounded-xl flex justify-center align-middle p-3 my-4 gap-2 bg-[#FEF9E6]">
        <div className="manholePopupBox1 w-full flex flex-col justify-center gap-2 text-[12px] text-left text-[#717182]">
          <h4 className="font-[400] grid grid-cols-2">
            Manhole :{" "}
            <span className="font-[500] text-right text-[#0A0A0A] flex justify-end align-middle items-center gap-1">
              {getStatusIcon(selectedLocation.status)}
              {selectedLocation.manhole_id || selectedLocation.id}
            </span>{" "}
          </h4>
          <h4 className="font-[400] grid grid-cols-2">
            Ward :{" "}
            <span className="font-[400] text-right text-[#0A0A0A]">
              {selectedLocation.area_name || "N/A"}
            </span>{" "}
          </h4>
          <h4 className="font-[400] grid grid-cols-2">
            Division :{" "}
            <span className="font-[400] text-right text-[#0A0A0A]">
              {selectedLocation.Division || "N/A"}
            </span>{" "}
          </h4>
          <h4 className="font-[400] grid grid-cols-2">
            Location :{" "}
            <span className="text-[12px] text-right text-[#0A0A0A]">
              {selectedLocation.latitude?.toFixed(6) || "N/A"},{" "}
              {selectedLocation.longitude?.toFixed(6) || "N/A"}
            </span>{" "}
          </h4>
        </div>
      </div>

  
      <div>
        <DashAccordian />
      </div>

      <div className="w-full flex justify-around overflow-hidden align-middle gap-2 my-4 px-2 pb-5">
        <button
          onClick={() => onGenerateReport("maintenance")}
          className="manhole-popup-btn w-1/2 text-[10px] whitespace-nowrap self-center border-1 border-[#16A249] text-[#16A249] hover:text-white hover:bg-[#16A249] px-6 py-2 rounded-lg font-medium cursor-pointer btn-hover transition-all"
        >
          Generate Report
        </button>
        <button
          onClick={() => {
            onClose();
            confirm("Successfully booked a bot.");
          }}
          className="manhole-popup-btn w-1/2 text-[10px] whitespace-nowrap self-center bg-[#1E9AB0] text-white px-6 py-2 rounded-lg font-medium cursor-pointer btn-hover transition-all duration-120"
        >
          Assign a Bot
        </button>
      </div>
    </div>
  );
};

export default ManholePopUp;