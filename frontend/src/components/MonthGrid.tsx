import { isSameMonth, isSameDay } from "date-fns";
import type { CalendarBirthday, CalendarEvent, CalendarItemDeleteKind, CalendarTask } from "../types/calendar";
import { DeleteItemButton } from "./DeleteItemButton";
import {
  formatBirthdayAge,
  formatEventTimes,
  formatTaskTimes,
  eventOccursOnDate,
  eventStartsOnDate,
  isBirthdayOnDate,
  isTaskCompleted,
  taskDueOnDate,
} from "../utils/calendarDates";

interface MonthGridProps {
  days: Date[];
  currentMonth: Date;
  today: Date;
  selectedDays: Date[];
  events: CalendarEvent[];
  tasks: CalendarTask[];
  birthdays: CalendarBirthday[];
  onToggleTask: (task: CalendarTask, occurrenceDate?: Date) => void;
  onDeleteItem: (kind: CalendarItemDeleteKind, id: string, title: string) => void;
  onSelectDate: (
    date: Date,
    modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  days,
  currentMonth,
  today,
  selectedDays,
  events,
  tasks,
  birthdays,
  onToggleTask,
  onDeleteItem,
  onSelectDate,
}) => {
  return (
    <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-hidden rounded-xl border-l border-t border-gray-200">
      {days.map((day) => {
        const isCurrentMonthDay = isSameMonth(day, currentMonth);
        const isTodayDay = isSameDay(day, today);
        const isSelected = selectedDays.some((date) => isSameDay(day, date));
        const dayEvents = events.filter((event) => eventOccursOnDate(event, day));
        const dayTasks = tasks.filter((task) => taskDueOnDate(task, day));
        const dayBirthdays = birthdays.filter((birthday) =>
          isBirthdayOnDate(birthday, day),
        );

        return (
          <div
            key={day.toISOString()}
            onClick={(event) =>
              onSelectDate(day, {
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
              })
            }
            className={`flex min-h-0 flex-col select-none overflow-hidden border-b border-r border-gray-200 p-1.5 text-left cursor-pointer transition-colors ${
              isSelected
                ? "bg-blue-600 text-white" // Takes top priority when selected
                : !isCurrentMonthDay
                  ? "bg-gray-50 text-gray-400 hover:bg-gray-100" // Outside current month
                  : "bg-white text-gray-900 hover:bg-blue-50/50" // Inside current month (default)
            }`}
          >
            {/* Day Number Header */}
            <div className="flex justify-between items-center">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-none transition-all ${
                  isTodayDay
                    ? `bg-blue-600 text-white ${isSelected ? "" : "shadow-sm"}`
                    : isSelected
                      ? "text-white"
                      : ""
                }`}
              >
                {day.getDate()}
              </span>
            </div>

            {/* Event Pills Container */}
            <div className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain text-left">
              {dayEvents.map((item) => (
                <div key={item.id} className={`flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] leading-3 ${isSelected ? "border-sky-200 bg-sky-200 text-sky-950" : "border-blue-200/80 bg-blue-50 text-blue-950"}`}>
                  <span className="min-w-0 flex-1 truncate" title={`${item.title} · ${item.isAllDay ? "All day" : formatEventTimes(item)}`}>
                    <span className="font-semibold">{item.isAllDay ? "All day" : eventStartsOnDate(item, day) ? formatEventTimes(item) : `Continues${formatEventTimes(item) ? ` · ${formatEventTimes(item)}` : ""}`}</span>
                    <span> · {item.title}</span>
                  </span>
                  <DeleteItemButton kind="event" title={item.title} id={item.id} onDelete={(kind, id) => onDeleteItem(kind, id, item.title)} className="h-4 w-4 text-blue-700" />
                </div>
              ))}
              {dayTasks.map((item) => (
                <div key={item.id} className={`flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] leading-3 ${isSelected ? "border-amber-200 bg-amber-200 text-amber-950" : "border-amber-200/80 bg-amber-50 text-amber-950"}`}>
                  <input type="checkbox" checked={isTaskCompleted(item, day)} aria-label={`Complete ${item.title}`} onClick={(event) => event.stopPropagation()} onChange={() => onToggleTask(item, day)} className="h-3 w-3 shrink-0 accent-amber-600" />
                  <span className={`min-w-0 flex-1 truncate ${isTaskCompleted(item, day) ? "line-through opacity-60" : ""}`}>
                    {formatTaskTimes(item) && <span className="font-semibold">{formatTaskTimes(item)} · </span>}{item.title}
                  </span>
                  <DeleteItemButton kind="task" title={item.title} id={item.id} onDelete={(kind, id) => onDeleteItem(kind, id, item.title)} className="h-4 w-4 text-amber-700" />
                </div>
              ))}
              {dayBirthdays.map((item) => (
                <div key={item.id} className={`flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] leading-3 ${isSelected ? "border-rose-200 bg-rose-200 text-rose-950" : "border-pink-200/80 bg-pink-50 text-pink-950"}`}>
                  <span className="min-w-0 flex-1 truncate">🎂 {item.name}{formatBirthdayAge(item, day.getFullYear())}</span>
                  <DeleteItemButton kind="birthday" title={item.name} id={item.id} onDelete={(kind, id) => onDeleteItem(kind, id, item.name)} className="h-4 w-4 text-pink-700" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
