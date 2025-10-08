const RobotCard = () => {
    return (
        <div
                  key={idx}
                  onClick={() => openRoboCardPopUp(item)}
                  className="cursor-pointer bg-white border border-gray-200 rounded-xl  px-2 h-80 max-w hover:shadow-lg hover:shadow-[#1A8BA850] hover:scale-101 transition-all duration-110"
                >
                  <div className="flex flex-row">
                    <img
                      src="/images/Robo.jpg"
                      alt="Device"
                      className="w-40 h-40 mt-3 object-cover rounded-lg mb-4"
                    />
                    <div className="flex text-sm pl-2 text-gray-600 text-start items-center">
                      <div className="space-y-2">
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <Bot className="inline-block w-4 h-4 mr-1 mb-1" />
                          </span>
                          Device ID: {item?.device_id || "-"}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <Calendar className="inline-block w-3 h-4 mr-2 mb-1" />
                          </span>
                          Last operation:{" "}
                          {new Date(item?.timestamp).toLocaleDateString() ||
                            "-"}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <FireExtinguisher className="inline-block w-4 h-4 mr-1 mb-1" />
                          </span>
                          Gas status:{" "}
                          {item.gas_status
                            ? item.gas_status.charAt(0).toUpperCase() +
                              item.gas_status.slice(1).toLowerCase()
                            : "N/A"}
                        </p>
                        <p className="flex items-center mb-2">
                          <span className="text-lg">
                            <MapPin className="inline-block w-4 h-4 mr-1 mb-1" />
                          </span>
                          Ward: {item.ward}
                        </p>
                      </div>
                    </div>
                  </div>
                  <hr className="my-4 mx-4 text-gray-400 " />
                  <div className="px-15 py-2">
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="text-2xl ">
                          {item?.waste_collected_kg || "- "}Kgs
                        </p>
                        <p className="text-xs text-gray-500">Waste Collected</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl ">
                          {item?.operationsCount || "- "}
                        </p>
                        <p className="text-xs text-gray-500">Operations</p>
                      </div>
                    </div>
                  </div>
                </div>
    )
};

export default RobotCard;
