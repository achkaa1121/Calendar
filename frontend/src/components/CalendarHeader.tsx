import { endOfWeek, format, isSameMonth, startOfWeek } from "date-fns";

interface CalendarHeaderProps {
  currentMonth: Date;
  selectedDate: Date;
  activeView: "month" | "week" | "day";
  setActiveView: (view: "month" | "week" | "day") => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  selectedDate,
  activeView,
  setActiveView,
  onPrevMonth,
  onNextMonth,
}) => {
  const periodLabel =
    activeView === "month"
      ? format(currentMonth, "MMMM yyyy")
      : activeView === "day"
        ? format(selectedDate, "PPP")
        : (() => {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
            if (isSameMonth(weekStart, weekEnd)) {
              return `${format(weekStart, "MMM d")} – ${format(weekEnd, "d, yyyy")}`;
            }
            return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
          })();
  const views: { id: "month" | "week" | "day"; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
  ];

  return (
    <div className="grid grid-cols-3 items-center mb-4">
      {/* View Switcher */}
      <div className="flex gap-1 justify-start">
        {views.map((v) => {
          const isActive = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Centered Month Changer */}
      <div className="flex justify-center items-center gap-3">
        <button
          onClick={onPrevMonth}
          className="px-3 py-1 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-lg font-bold"
          title="Previous Month"
        >
          ‹
        </button>
        <span className="text-lg font-semibold text-gray-800 min-w-36 text-center">
          {periodLabel}
        </span>
        <button
          onClick={onNextMonth}
          className="px-3 py-1 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-lg font-bold"
          title="Next Month"
        >
          ›
        </button>
      </div>

      {/* Spacer Column */}
      <div></div>
    </div>
  );
};
