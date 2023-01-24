import { Checkbox } from "./utils/Form";

import { cyrb53 } from "../utils/color";

const colors = ["bg-red-400", "bg-blue-400"];

const typeToColor = (type) => {
  switch (type) {
    case "lexical":
      return colors[0];
    case "semantic":
      return colors[1];
    case "extractive":
      return colors[0];
    case "abstractive":
      return colors[1];
    case "unknown":
      return "bg-black";
    default:
      return colors[cyrb53(type || "") % colors.length];
  }
};

const Bullet = ({ color }) => (
  <div className={`block w-[7px] h-[7px] shadow-gray-300 shadow-lg rounded-full ${color}`} />
);

const ModelText = ({ type, text, healthy = true }) => (
  <div className="flex items-center gap-4 overflow-hidden">
    <Bullet color={typeToColor(type)} />
    <span className="block overflow-hidden whitespace-nowrap text-ellipsis">
      <span title={text} className={healthy ? "" : "line-through"}>
        {text}
      </span>
      {!healthy && "(unhealthy)"}
    </span>
  </div>
);

const Model = ({ info, onClick, isSet }) => {
  let className = "flex items-center px-2 py-1 rounded-lg";
  const available = !info.disabled && info.healthy;
  if (info.disabled) className += " opacity-25";
  else if (!info.healthy) className += " opacity-60 bg-red-300";
  else className += " hover:bg-white";

  return (
    <button className={className} onClick={onClick}>
      <div className="min-w-[25px] flex justify-right items-center">
        {available && <Checkbox checked={isSet} bold />}
      </div>
      <ModelText
        type={info.metadata.type}
        text={info.name}
        healthy={info.disabled || info.healthy}
      />
    </button>
  );
};

const Legend = ({ types }) => (
  <div className="flex flex-wrap gap-2 text-slate-600">
    {types.map((type) => (
      <div key={type} className="flex gap-2 items-center whitespace-nowrap text-sm">
        <div className="flex items-center gap-1">
          <Bullet color={typeToColor(type)} />
          {type}
        </div>
      </div>
    ))}
  </div>
);
export { Model, Legend, ModelText };
