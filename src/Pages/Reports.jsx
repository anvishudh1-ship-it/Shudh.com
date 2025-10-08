import React, { useState, useEffect } from "react";
import { File, ChartLine, FileChartColumnIncreasing, Bot , Search } from "lucide-react";
// 1. Import the ManholeReport component
import Manhole from "../Components/ReportFiles/Manhole"; 
import Ward from "../Components/ReportFiles/Ward";

export default function Reports() {
  const divisions = [
    "Kukatpally",
    "Old Bowenpally",
    "SR Nagar",
    "Durgam Cheruvu",
    "Hafeezpet",
    "Manikonda",
  ];

  const divisionsByDivision = {
    "SR Nagar": [
      "Borabanda",
      "Somajiguda",
      "Yellareddyguda",
      "Jubille Hills",
      "Vengalroanagar",
      "Fathenagar",
    ],
    Kukatpally: [
      "Hasmathpet",
      "Vivekanandha Nagar",
      "Yellammabanda",
      "Moosapet",
      "Balnagar",
      "KPHB",
      "Balaginagar",
    ],
    "Durgam Cheruvu": ["Nallagandla", "Madhapur", "Kondapur", "Gachibowli"],
    Hafeezpet: ["Chandanagar", "Miyapur", "patancheru"],
    Manikonda: [
      "Jalpally",
      "Thukkuguda",
      "Kismathpur",
      "Manikonda",
      "Shamshabad",
    ],
    "Old Bowenpally": [
      "Tadbund",
      "Mallikarjuna Nagar",
      "Bapuji Nagar",
    ],
  };

  const displayDivisionNames = {
    "SR Nagar": "Division 6 (SR Nagar)",
    Kukatpally: "Division 9 (Kukatpally)",
    "Durgam Cheruvu": "Division 4 (Durgam Cheruvu)",
    Hafeezpet: "Division 109 (Hafeezpet)",
    Manikonda: "Division 5 (Manikonda)",
    "Old Bowenpally": "Division 119 (Old Bowenpally)",
  };

  // 2. Update Manhole Reports to use the component directly
  const manholeReports = [
    {
      id: "manhole1",
      title: "Zone A Manhole Analysis",
      division: "Kukatpally",
      section: "Hasmathpet",
      component: <Manhole />, // Pass the component here
      icon: <ChartLine className="text-blue-500 w-10 h-10" />,
    },
    {
      id: "manhole2",
      title: "Zone B Manhole Analysis",
      division: "Kukatpally",
      section: "Hasmathpet",
      component: <Manhole/>, // Pass the component here
      icon: <ChartLine className="text-blue-500 w-10 h-10" />,
    },
    {
      id: "manhole3",
      title: "Zone C Manhole Analysis",
      division: "Kukatpally",
      section: "Hasmathpet",
      component: <Manhole/>, // Pass the component here
      icon: <ChartLine className="text-blue-500 w-10 h-10" />,
    },
  ];

  const wardReports = [
    {
      id: "ward1",
      title: "Ward A Incident Summary",
      division: "Kukatpally",
      section: "Hasmathpet",
     component: <Ward/>,
      icon: <FileChartColumnIncreasing className="text-green-500 w-10 h-10" />,
    },
  ];

  const robotReports = [
    {
      id: "robot1",
      title: "Robot Fleet Performance RP001",
      division: "Kukatpally",
      section: "Hasmathpet",
      file: "Robot.html",
      icon: <Bot className="text-purple-500 w-10 h-10" />,
    },
    {
      id: "robot2",
      title: "Robot Fleet Performance RP002",
      division: "Kukatpally",
      section: "Hasmathpet",
      file: "robo_reports_s.html",
      icon: <Bot className="text-purple-500 w-10 h-10" />,
    },
  ];

  const allReports = [...manholeReports, ...wardReports, ...robotReports];

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [popupReport, setPopupReport] = useState(null);
  const [displayReportsState, setDisplayReports] = useState([]);
  const [activeCard, setActiveCard] = useState("");
  const [searchClicked, setSearchClicked] = useState(false);
  const [allDivisionList, setAllDivisionList] = useState([]);
  const [expandedDivision, setExpandedDivision] = useState(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const sections =
    selectedDivision && selectedDivision !== "ALL Divisions"
      ? divisionsByDivision[selectedDivision] || []
      : [];

  const getFilteredReports = (
    type,
    division = selectedDivision,
    section = selectedSection
  ) => {
    let filtered = allReports.filter(
      (r) => r.division === division && r.section === section
    );

    if (type === "manhole")
      filtered = filtered.filter((r) => manholeReports.includes(r));
    if (type === "ward")
      filtered = filtered.filter((r) => wardReports.includes(r));
    if (type === "robot")
      filtered = filtered.filter((r) => robotReports.includes(r));

    return filtered;
  };

  const handleCardClick = (type) => {
    if (!searchClicked) return;
    if (selectedDivision === "ALL Divisions") return;
    setDisplayReports(getFilteredReports(type));
    setActiveCard(type);
  };

  const handleSearch = () => {
    setSearchClicked(true);
    if (selectedDivision === "ALL Divisions" || selectedDivision === "") {
      const list = divisions.map((div) => {
        const count = allReports.filter((r) => r.division === div).length;
        return { division: div, count };
      });
      setAllDivisionList(list);
      setDisplayReports([]);
      setActiveCard("all");
      return;
    }

    if (!selectedSection) {
      setDisplayReports([]);
      setActiveCard("");
      return;
    }

    const results = allReports.filter(
      (r) => r.division === selectedDivision && r.section === selectedSection
    );
    setDisplayReports(results);
    setActiveCard("all");
  };

  return (
    <>
      <section className="section1">
        <h1>Reports & Analytics</h1>
        <p>Generate and manage system reports and data exports</p>
      </section>

      <section className="flex flex-wrap gap-6 justify-center mb-10 mt-5 p-4 rounded-xl w-full max-w-4xl mx-auto bg-white shadow-md">
        <div className="flex flex-col flex-1 min-w-[250px]">
          <label className="mb-2 text-sm font-semibold text-gray-700 flex justify-items-start">
            Division
          </label>
          <select
            value={selectedDivision}
            onChange={(e) => {
              setSelectedDivision(e.target.value);
              setSelectedSection("");
              setDisplayReports([]);
              setSearchClicked(false);
              setAllDivisionList([]);
              setExpandedDivision(null);
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-[#1A8BA8] focus:border-[#1A8BA8] cursor-pointer"
          >
            <option value="">Select Division</option>
            {divisions.map((div) => (
              <option key={div} value={div}>
                {displayDivisionNames[div] || div}
              </option>
            ))}
          </select>
          {searchClicked && !selectedDivision && selectedSection && (
            <p className="text-red-500 text-xs mt-1 flex items-start">
              *Division is required
            </p>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-[250px]">
          <label className="mb-2 text-sm font-semibold text-gray-700 flex justify-items-start">
            Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              setDisplayReports([]);
              setSearchClicked(false);
            }}
            className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-[#1A8BA8] focus:border-[#1A8BA8] cursor-pointer ${
              !selectedDivision || selectedDivision === "ALL Divisions"
                ? "opacity-40 cursor-not-allowed"
                : ""
            }`}
            disabled={!selectedDivision || selectedDivision === "ALL Divisions"}
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
          {searchClicked &&
            selectedDivision &&
            !selectedSection && (
              <p className="text-red-500 text-xs mt-1 flex items-start">
                *Section is required
              </p>
            )}
        </div>
        <button
          onClick={handleSearch}
          className=" self-start justify-items-start cursor-pointer bg-[#1A8BA8] text-white px-6 py-2 rounded-xl mt-7 hover:bg-[#166f86] flex items-center gap-2 shadow-xl btn-hover transition duration-500 "
        >
         <Search className="w-4.5" />
          Search Reports
        </button>

        <div className="flex flex-col justify-end "></div>
      </section>

      <section className="w-full max-w-6xl px-[2vw] mx-auto">
        {searchClicked ? (
          (selectedDivision === "ALL Divisions" || selectedDivision === "") &&
          allDivisionList.length > 0 ? (
            <div className="space-y-4">
              {allDivisionList.map((d) => (
                <div
                  key={d.division}
                  className="bg-white p-4 rounded-xl shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {displayDivisionNames[d.division] || d.division} ({d.count})
                    </span>
                    <button
                      onClick={() =>
                        setExpandedDivision(
                          expandedDivision === d.division ? null : d.division
                        )
                      }
                      className="bg-gray-100 px-6 py-2 rounded-lg hover:bg-[#1A8BA8]  hover:text-white transition duration-300 cursor-pointer btn-hover"
                    >
                      {expandedDivision === d.division ? "Hide" : "View"}
                    </button>
                  </div>
                  {expandedDivision === d.division && (
                    <div className="mt-4 space-y-2">
                      {allReports
                        .filter((r) => r.division === d.division)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="bg-gray-50 p-3 rounded-lg shadow-sm flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2 font-semibold">
                              {r.icon}
                              <span>{r.title}</span>
                            </div>
                            <button
                              onClick={() => setPopupReport(r)}
                              className="bg-gray-100 px-6 py-2 rounded-lg  hover:bg-[#1A8BA8]
                               hover:text-white btn-hover transition duration-500 cursor-pointer"
                            >
                              View
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !selectedDivision || !selectedSection ? (
            <p className="text-gray-500 font-semibold">No reports available</p>
          ) : (
            displayReportsState.length > 0 ? (
              <div className="space-y-4">
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    {
                      type: "all",
                      label: "All Reports",
                      icon: <File color="#1A8BA8" />,
                    },
                    {
                      type: "manhole",
                      label: "Manhole Reports",
                      icon: <ChartLine color="#1A8BA8" />,
                    },
                    {
                      type: "ward",
                      label: "Ward Reports",
                      icon: <FileChartColumnIncreasing color="#1A8BA8" />,
                    },
                    {
                      type: "robot",
                      label: "Robot Reports",
                      icon: <Bot style={{ color: "#1A8BA8" }} />,
                    },
                  ].map((card) => {
                    const count = getFilteredReports(card.type).length;
                    return (
                      <div
                        key={card.type}
                        onClick={() => handleCardClick(card.type)}
                        className={`p-4 rounded-xl shadow text-center cursor-pointer ${
                          activeCard === card.type
                            ? "bg-blue-100 border border-blue-500"
                            : "bg-white"
                        } hover:bg-gray-100`}
                      >
                        {React.cloneElement(card.icon, {
                          className: "mx-auto mb-2 w-10 h-10",
                        })}
                        <p className="font-medium">{card.label}</p>
                        <p className="text-lg font-bold">{count}</p>
                      </div>
                    );
                  })}
                </section>
                {displayReportsState.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {r.icon}
                      <span>{r.title}</span>
                    </div>
                    <button
                      onClick={() => setPopupReport(r)}
                      className="bg-gray-100 px-6 py-2 rounded-lg hover:bg-[#1A8BA8]
                       hover:text-white btn-hover transition duration-500 cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 font-semibold">No reports available</p>
            )
          )
        ) : null}
      </section>

      {popupReport && (
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1000">
          <div className="bg-white p-6 rounded-xl shadow-lg w-11/12 md:w-2/3 h-[100vh] relative overflow-auto">
            <button
              onClick={() => setPopupReport(null)}
              className="popup-btn absolute top-3 right-3 text-gray-600 hover:text-black text-2xl cursor-pointer "
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">{popupReport.title}</h3>
            {/* 3. Conditionally render the component or iframe */}
            {popupReport.component ? (
              popupReport.component
            ) : (
              <iframe
                src={`/reports/${popupReport.file}`}
                className="w-full h-full border rounded-lg"
                title={popupReport.title}
              />
            )}
          </div>
        </section>
      )}
    </>
  );
}