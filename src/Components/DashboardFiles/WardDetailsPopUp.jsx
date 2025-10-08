import { X } from "lucide-react";
import React from "react";

const WardDetailsPopUp = ({ selectedWard, setSelectedWard, wardData }) => {
  if (!selectedWard) return null;

  const selectedWardInfo = wardData.find((i) => i.ward_name === selectedWard);
  // console.log(selectedWardInfo);
  const {
    "s.no": sNo,
    Population,
    Total_sewer_length,
    area,
    landuse_classes,
    no_of_manholes,
    "no_of_robo's": noOfRobos,
    perimeter,
    ward_id,
    ward_name,
    waste_colleccted,
  } = selectedWardInfo;

  // console.log(selectedWard, wardData);

  return (
    <div className="flex w-full h-max overflow-x-hidden relative flex-col p-2 rounded-xl border-1 border-gray-400 shadow-xl shadow-gray-300">
      <div
        className="w-full flex justify-between items-center sticky -top-2 p-4 rounded-t-xl"
        style={{
          background:
            "linear-gradient(94.24deg, #1E9AB0 0%, #2A9FB4 43.66%, #87C4CF 99.59%)",
        }}
      >
        <div className="flex flex-col justify-center relative align-middle gap-2 text-white text-left">
          <h1 className="text-xl font-bold ">{`Ward: ${ward_name}`}</h1>
          <p className="text-[12px]">Zone : N/A</p>
          <button
            type="button"
            className="btn-hover cursor-pointer"
            style={{
              backgroundColor: "green",
              padding: "10px 20px",
              borderRadius: "5px",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
            }}
            onClick={() => confirm("Generated Report")}
          >
            Generate Report
          </button>
        </div>
        <button
          onClick={() => setSelectedWard(null)}
          className="absolute cursor-pointer top-5 right-2"
        >
          <X className="text-white" />
        </button>
      </div>

      <div className="ward-table-box mt-4 px-2">
        <h3 className="font-bold text-left">Details</h3>
        <table className="details-table mt-2 w-full bg-white shadow-md text-[12px] font-[400] border-1 border-gray-400 shadow-gray-400 rounded-md overflow-hidden text-left">
          <thead>
            <tr className="bg-gray-200 border border-gray-400">
              <th className="p-2 border border-gray-400">FIELD</th>
              <th className="p-2">VALUE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">S.No</td>
              <td className="p-2 border border-gray-400">{sNo}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                Ward Name
              </td>
              <td className="p-2 border border-gray-400">{ward_name}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                Ward ID
              </td>
              <td className="p-2 border border-gray-400">{ward_id}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                No. of Manholes
              </td>
              <td className="p-2 border border-gray-400">{no_of_manholes}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                Population
              </td>
              <td className="p-2 border border-gray-400">{Population}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                Waste Collected (tons)
              </td>
              <td className="p-2 border border-gray-400">
                {waste_colleccted} kgs
              </td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                No. of Robots
              </td>
              <td className="p-2 border border-gray-400">{noOfRobos}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                Total Sewer Length (km)
              </td>
              <td className="p-2 border border-gray-400">
                {Total_sewer_length}
              </td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                Perimeter (m)
              </td>
              <td className="p-2 border border-gray-400">{perimeter}</td>
            </tr>
            <tr>
              <td className="p-2 font-semibold border border-gray-400">
                Land Use Classes
              </td>
              <td className="p-2 border border-gray-400">{landuse_classes}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="demographics-box mt-4 text-left text-md px-2 py-3">
        <h3 className="section-title font-bold">Demographics</h3>
        <div className="demographics-card mt-2 rounded-lg p-4 py-3 shadow-md bg-gray-100 flex justify-between align-middle gap-2">
          <div className="area-label text-sm">Area:</div>
          <div className="area-value text-sm font-semibold">{area} sq.m</div>
        </div>
      </div>
    </div>
  );
};

export default WardDetailsPopUp;
