import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export const TimeTrackerRadial: React.FC = () => {
  const [seconds, setSeconds] = useState(9300); // 2 hrs 35 mins
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = 72; // 72% of target focus achieved

  return (
    <div className="flex flex-col items-center justify-between h-full">
      <div className="relative w-36 h-36 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="8"
            className="text-amber-100"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * progressPercent) / 100}
            strokeLinecap="round"
            className="text-amber-400 transition-all duration-500"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl tracking-tight text-gray-900">
            {formatTime(seconds).substring(0, 5)}
          </span>
          <span className="text-2xs text-gray-500 uppercase tracking-wider mt-0.5">
            Work Time
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-800 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <button
          onClick={() => setSeconds(9300)}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
