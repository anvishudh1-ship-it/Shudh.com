import { Calendar, MapPin } from "lucide-react";

const MaintainenceCard = (props) => {
  const { MaintainenceInfo} = props;
  const each = MaintainenceInfo;

  return (
    <li
      className="maintainence-card w-full aspect-auto rounded-lg overflow-hidden bg-gray-50 shadow-sm self-start shadow-gray-200 hover:shadow-lg hover:shadow-blue-200 hover:scale-102 transition-all duration-200"
    >
      <img src={each.imageUrl ? each.imageUrl : 'images/gas testing.png'} className="w-full object-cover aspect-square object-center" alt={each.title + each.id} />
      <div className="p-3 flex flex-col justify-start align-middle gap-3">
        <span className="w-full text-left flex items-center justify-between align-middle gap-1">
          <h5 className="font-[500] text-md">{each.title}</h5>
          <span
            className="rounded-lg p-4 py-1.5 text-white text-sm h-auto self-center"
            style={{ backgroundColor: each.priorityColor }}
          >
            {each.priority}
          </span>
        </span>
        <div className="flex items-center gap-1 text-[12px] font-[400] text-[#657086]">
          <MapPin size={18} color="grey"/>
          <p>{each.location}</p>
        </div>
        <div className="flex items-center gap-1 text-[12px] font-[400] text-[#657086]">
          <Calendar size={18} color="grey"/>
          <p>{each.dateTime}</p>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-[400] w-max bg-blue-500 mt-2 py-2 px-3 text-white rounded-md">
          <Calendar size={18} color="white"/>
          Scheduled
        </span>
      </div>
    </li>
  );
};

export default MaintainenceCard;
