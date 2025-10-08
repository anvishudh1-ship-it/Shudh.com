import { useState } from "react";

const accordionList = [
  {
    heading: "Predict",
    desc: "Moderate blockage detected likely to escalate within 2–3 days if not addressed.",
    isOpen: true,
    textColor: "#C79101",
    leftLineBg: "#FFB900",
    bg: "#FFFBEB",
    borderColor: "#FEE685",
  },
  {
    heading: "Prevent",
    desc: "Schedule cleaning/inspection within the next 24–48 hours to avoid escalation.",
    isOpen: true,
    textColor: "#1447E6",
    leftLineBg: "#51A2FF",
    bg: "#EFF6FF",
    borderColor: "#BEDBFF",
  },
  {
    heading: "Cure",
    desc: "Last cleaning completed recently, but blockage indicators suggest follow-up is needed soon.",
    isOpen: true,
    textColor: "#00913A",
    leftLineBg: "#7DFFB1",
    bg: "#E8FCF0",
    borderColor: "#AAFFCC",
  },
];

export default function DashAccordian() {
  const [accdList, setAccdList] = useState(accordionList);

  const updateAcdList = (updateAccd) => {
    setAccdList((prev) =>
      prev.map((item) =>
        item.heading === updateAccd.heading
          ? { ...item, isOpen: !item.isOpen }
          : item
      )
    );
  };

  return (
    <ul className="w-[95%] mx-auto rounded-md flex flex-col gap-2 justify-center align-middle">
      {/* boxes */}
      {accdList.map((eachAcd) => (
        <li
          key={eachAcd.heading}
          className="w-full text-left rounded-lg p-2.5 py-4 border-1 border-l-3"
          style={{
            backgroundColor: eachAcd.bg,
            borderColor: eachAcd.borderColor,
            borderLeftColor: eachAcd.leftLineBg,
          }}
        >
          <h5
            className="text-[12px] font-[500]"
            style={{ color: eachAcd.textColor }}
          >
            {eachAcd.heading}
          </h5>
          <p className="text-[10px] mt-1.5 text-gray-900">{eachAcd.desc}</p>
        </li>
      ))}

      {/* Accordion Header */}
      {/* NotAdded */}
      {
        !accdList?.map((eachAcd) => (
          <li
            key={eachAcd.heading}
            className="w-full mx-auto rounded-xl bg-gray-500"
          >
            <button
              type="button"
              onClick={() => updateAcdList(eachAcd)}
              className="w-full h-auto cursor-pointer my-2 font-medium text-gray-900 rounded-t-xl hover:bg-gray-100 gap-3"
            >
              <div className="bg-[#FEF9E6] w-full flex items-center justify-between px-4 py-2 ">
                <span className="text-md">{eachAcd.heading}</span>
                <svg
                  className={`w-3 h-3 transform transition-transform duration-200 ${
                    eachAcd.isOpen ? "" : "rotate-180"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 5 5 1 1 5"
                  />
                </svg>
              </div>
            </button>

            {/* Accordion Content */}
            {eachAcd.isOpen && (
              <div className="p-5 bg-white transition-all duration-110">
                <p className="mb-4 text-[12px] text-gray-500">{eachAcd.desc}</p>
              </div>
            )}
          </li>
        ))
      }
    </ul>
  );
}
