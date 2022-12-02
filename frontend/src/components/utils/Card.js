import React from "react";

const Card = ({ children, full }) => (
  <div
    className={`${
      full ? "w-full" : "max-w-sm"
    } flex h-full grow flex-col divide-slate-300 divide-y bg-slate-100 rounded-lg border border-gray-200 shadow-md`}
  >
    {children}
  </div>
);

const CardHead = ({ children, tight }) => (
  <div
    className={`${
      tight ? "min-h-[50px]" : "py-4 min-h-[80px]"
    } px-6 w-full flex gap-4 justify-between items-center`}
  >
    {children}
  </div>
);

const CardContent = ({ children, white, tight }) => (
  <div className={`${tight ? "p-3" : "p-6"} space-y-3 flex-grow flex-col ${white ? "bg-white" : ""}`}>{children}</div>
);

const CardFoot = ({ children }) => <div className="p-6">{children}</div>;

export { Card, CardHead, CardContent, CardFoot };
