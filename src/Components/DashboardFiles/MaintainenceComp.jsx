import { useEffect, useState } from "react";
import MaintainenceCard from "./MaintainenceCard";
import maintenanceTasks from "../../maintainenceDumData";

const filterBtnsList = [
  { label: "All Tasks", value: "all" },
  { label: "Upcoming Tasks", value: "upcoming" },
  { label: "Pending Tasks", value: "pending" },
  { label: "Immediate Tasks", value: "immediate" },
];

const MaintainenceComp = () => {
  const [activeTab, setActiveTab] = useState(filterBtnsList[0].value);
  const [maintainenceD, setMaintainenceD] = useState([]);

  useEffect(() => {
    setMaintainenceD(maintenanceTasks);
  }, []);

  const updateTab = (val) => {
    // console.log(val)
    setActiveTab(val);
    filteredMtData(val);
  };

  const filteredMtData = (val) => {
    // console.log('activeTab : ', val)
    const updatedMtData = maintenanceTasks.filter(i => {
        if (val === 'all') return i
        else {
            if (i.category === val) {
                return i
            }
        }
    })
    setMaintainenceD(updatedMtData);
    // console.log(updatedMtData)
  };

  return (
    <div className="maintainence-container bg-amer-900 w-full min-h-[50vh] p-3 rounded shadow-sm shadow-gray-400">
      {/* Top Box */}
      <div className="flex justify-between p-5 place-items-center align-middle gap-5">
        <h3 className="text-xl font-[500]">Maintainence Scheduler</h3>
        <ul className="filter-box flex justify-center align-middle gap-3">
          {filterBtnsList.map((each) => (
            <li key={each.label} className="">
              <button
                className={`${
                  activeTab === each.value ? "btn-blue" : "btn-blue-outline"
                } btn-hover py-2 text-sm`}
                onClick={() => updateTab(each.value)}
              >
                {each.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tasks Cards Container */}
      <div className="p-5 w-full flex flex-col justify-center align-middle">
        <h4 className="text-left text-lg mb-5 w-auto self-start border-b-2 border-blue-400">
          {filterBtnsList.find((e) => e.value === activeTab).label}
        </h4>
        <ul className="p-0 m-0 w-full grid grid-cols-3 lg:grid-cols-4 gap-4 place-items-center">
          {maintainenceD.map((each) => (
            <MaintainenceCard key={each.id} MaintainenceInfo={each} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MaintainenceComp;
