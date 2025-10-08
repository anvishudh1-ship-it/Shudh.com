import React, { useState } from "react";

const FilterableWardSelect = ({ wardData, selectedWard, setSelectedWard, setSelectedManholeLocation }) => {
  const wardOptions = wardData.map((w) => w.ward_name);

  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(wardOptions);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setShowDropdown(true);

    if (value.trim() === "") {
      setFilteredOptions(wardOptions);
    } else {
      const filtered = wardOptions.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  };

  const handleOptionSelect = (option) => {
    console.log(option)
    setSelectedWard(option);
    setSelectedManholeLocation("");
    setInputValue(option);
    setShowDropdown(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!wardOptions.includes(inputValue)) {
        setInputValue("");
        setSelectedWard("");
      }
      setShowDropdown(false);
    }, 150);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue || selectedWard || ""}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => {
          setFilteredOptions(wardOptions);
          setShowDropdown(true);
        }}
        placeholder="Select Ward"
        className="w-full text-[16px] hover:shadow-md cursor-pointer hover:shadow-gray-100 py-2 border-0.5 border-gray-500 outline-1 rounded-sm bg-white hover:bg-gray-50 px-3 max-w-[180px]"
        // className="text-sm py-2 px-3 w-full border border-gray-500 rounded-sm outline-none hover:shadow-md hover:bg-gray-50"
      />

      {showDropdown && (
        filteredOptions.length > 0 ? (
          <ul className="absolute w-full bg-white border border-gray-300 rounded-sm mt-1 max-h-40 overflow-y-auto shadow-md z-1000">
            {filteredOptions.map((option, i) => (
              <li
                key={option + i}
                onMouseDown={() => handleOptionSelect(option)}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${
                  selectedWard === option ? "bg-gray-100" : ""
                }`}
              >
                {option}
              </li>
            ))}
          </ul>
        ) : (
          inputValue.trim() !== "" && (
            <div className="absolute w-full bg-white border border-gray-300 rounded-sm mt-1 p-2 text-gray-500 shadow-md z-10">
              No data found
            </div>
          )
        )
      )}
    </div>
  );
};

export default FilterableWardSelect;
