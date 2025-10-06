const CureComp = () => {
  const robotsAvailable = 4;
  const lastBooking = "2025-08-12, 14:30";

  const manualReports = [
    {
      ward: "Ward 22",
      date: "2025-08-10",
      note: "Emergency overflow cleanup",
    },
    {
      ward: "Ward 12",
      date: "2025-08-08",
      note: "Heavy Clog Removed Manually",
    },
  ];

  const postCleaningReports = [
    { code: "MH-120", status: "clear" },
    { code: "MH-045", status: "Minor debris" },
  ];

  return (
    <div className="cure-comp w-full max-w-[600px] bg-white p-5 space-y-6 rounded-lg shadow mx-auto mt-8">
      {/* Box-1-Line */}
      <div className="flex space-x-6 max-w-xl mx-auto">
        {/* Available Robots */}
        <div className="flex-1 shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left">
          <h3 className="font-semibold mb-2 text-xl">Available Robots</h3>
          <div className="bg-white py-2 px-3 rounded-xl border border-gray-300 text-gray-700 text-md font-medium">
            {robotsAvailable} Robots Currently Available
          </div>
        </div>
        {/* Robo Booking */}
        <div className="flex-1 shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left">
          <h3 className="font-semibold mb-2 text-xl">Robo Booking</h3>
          <div className="bg-white py-2 px-3 rounded-xl border border-gray-300 text-gray-700 text-md font-semibold">
            Last Request: <br />
            {lastBooking}
          </div>
        </div>
      </div>

      {/* Box-2 */}
      {/* Manual Intervention */}
      <div className="manual-reports shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left">
        <h3 className="font-semibold text-xl mb-3">
          Manual Intervention Reports
        </h3>
        <div className="flex space-x-4 flex-wrap">
          {manualReports.map(({ ward, date, note }) => (
            <div
              key={ward + date}
              className="flex-1 shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left"
            >
              <div className="mb-1 font-semibold">
                {ward} - {date}
              </div>
              <div className="text-gray-600 text-sm font-[500]">{note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Box-3 */}
      {/* Post Cleaning Reports */}
      <div className="manual-reports shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left">
        <h3 className="font-semibold text-lg mb-3">Post-Cleaning Reports</h3>
        <div className="flex space-x-4 flex-wrap">
          {postCleaningReports.map(({ code, status }) => (
            <div
              key={code}
              className="flex-1 shadow shadow-gray-300 bg-white border border-gray-200 rounded-xl p-4 text-left"
            >
              <div className="mb-1 font-semibold">{code}</div>
              <div className="text-gray-600 text-sm font-[500]">
                Status: {status}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Last Box End */}

    </div>
  );
};

export default CureComp;
