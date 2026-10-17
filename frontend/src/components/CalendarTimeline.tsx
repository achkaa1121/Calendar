import { format } from "date-fns";
import type { CSSProperties } from "react";
import type {
  CalendarBirthday,
  CalendarEvent,
  CalendarItemDeleteKind,
  CalendarTask,
} from "../types/calendar";
import { DeleteItemButton } from "./DeleteItemButton";
import {
  calendarDateKey,
  eventOccurrenceOnDate,
  eventOccursOnDate,
  formatBirthdayAge,
  formatEventTimes,
  formatTaskTimes,
  isBirthdayOnDate,
  isTaskCompleted,
  taskDueOnDate,
} from "../utils/calendarDates";

interface CalendarTimelineProps {
  dates: Date[];
  selectedDate: Date;
  today: Date;
  events: CalendarEvent[];
  tasks: CalendarTask[];
  birthdays: CalendarBirthday[];
  onSelectDate?: (date: Date) => void;
  onToggleTask: (task: CalendarTask, occurrenceDate?: Date) => void;
  onDeleteItem: (kind: CalendarItemDeleteKind, id: string, title: string) => void;
}

interface TimelineEntry {
  id: string;
  kind: "event" | "task" | "birthday";
  title: string;
  startMinute: number;
  endMinute: number;
  label: string;
  allDay?: boolean;
  task?: CalendarTask;
  birthday?: CalendarBirthday;
  occurrenceDate?: Date;
  lane: number;
  laneCount: number;
}

const minutesInDay = 24 * 60;
const hourHeight = 60;
const timeToMinutes = (time: string | null) => {
  if (!time) return 0;
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getEntriesForDate = (
  date: Date,
  events: CalendarEvent[],
  tasks: CalendarTask[],
  birthdays: CalendarBirthday[],
): TimelineEntry[] => {
  const dateKey = calendarDateKey(date);
  const entries: TimelineEntry[] = [];

  for (const event of events) {
    const occurrence = eventOccurrenceOnDate(event, date);
    if (!occurrence) continue;

    if (event.isAllDay) {
      entries.push({
        id: event.id,
        kind: "event",
        title: event.title,
        startMinute: 0,
        endMinute: minutesInDay,
        label: "All day",
        allDay: true,
        lane: 0,
        laneCount: 1,
      });
      continue;
    }

    const startsToday = occurrence.startDate === dateKey;
    const endsToday = occurrence.endDate === dateKey;
    const startMinute = startsToday ? timeToMinutes(event.startTime) : 0;
    const endMinute = endsToday ? timeToMinutes(event.endTime) : minutesInDay;
    if (endMinute <= startMinute) continue;

    entries.push({
      id: event.id,
      kind: "event",
      title: event.title,
      startMinute,
      endMinute,
      label:
        startsToday && endsToday
          ? formatEventTimes(event)
          : startsToday
            ? `Starts ${event.startTime ?? ""}`
            : endsToday
              ? `Ends ${event.endTime ?? ""}`
              : "Continues",
      lane: 0,
      laneCount: 1,
    });
  }

  for (const task of tasks) {
    if (!taskDueOnDate(task, date)) continue;

    if (!task.startTime && !task.dueTime) {
      entries.push({
        id: task.id,
        kind: "task",
        title: task.title,
        startMinute: 0,
        endMinute: minutesInDay,
        label: "All day",
        allDay: true,
        task,
        occurrenceDate: date,
        lane: 0,
        laneCount: 1,
      });
      continue;
    }

    const dueMinute = task.dueTime ? timeToMinutes(task.dueTime) : null;
    const startMinute = task.startTime
      ? timeToMinutes(task.startTime)
      : Math.max(0, (dueMinute ?? 60) - 60);
    const endMinute = dueMinute ?? Math.min(minutesInDay, startMinute + 60);
    if (endMinute <= startMinute) continue;

    entries.push({
      id: task.id,
      kind: "task",
      title: task.title,
      startMinute,
      endMinute,
      label: formatTaskTimes(task),
      task,
      occurrenceDate: date,
      lane: 0,
      laneCount: 1,
    });
  }

  for (const birthday of birthdays) {
    if (!isBirthdayOnDate(birthday, date)) continue;
    entries.push({
      id: birthday.id,
      kind: "birthday",
      title: `${birthday.name}${formatBirthdayAge(birthday, date.getFullYear())}`,
      startMinute: 0,
      endMinute: minutesInDay,
      label: "All day · Birthday",
      allDay: true,
      birthday,
      lane: 0,
      laneCount: 1,
    });
  }

  const timedEntries = entries.filter((entry) => !entry.allDay);
  timedEntries.sort(
    (a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute,
  );
  const laneEnds: number[] = [];
  for (const entry of timedEntries) {
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= entry.startMinute);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = entry.endMinute;
    entry.lane = lane;
  }
  for (const entry of timedEntries) entry.laneCount = laneEnds.length;

  const allDayEntries = entries.filter((entry) => entry.allDay);
  allDayEntries.forEach((entry, lane) => {
    entry.lane = lane;
    entry.laneCount = allDayEntries.length;
  });
  return entries;
};

const HourPill = ({
  entry,
  onToggleTask,
  onDeleteItem,
}: {
  entry: TimelineEntry;
  onToggleTask: (task: CalendarTask, occurrenceDate?: Date) => void;
  onDeleteItem: (kind: CalendarItemDeleteKind, id: string, title: string) => void;
}) => {
  const top = entry.startMinute * (hourHeight / 60);
  const height = Math.max(
    (entry.endMinute - entry.startMinute) * (hourHeight / 60),
    hourHeight / 2,
  );

  // Fixed syntax calculation here
  const style: CSSProperties = {
    top: `${top}px`,
    height: `${Math.min(height, minutesInDay - top)}px`,
    left: `${(entry.lane / entry.laneCount) * 100}%`,
    width: `${100 / entry.laneCount}%`,
    backgroundColor:
      entry.kind === "task"
        ? "#d97706"
        : entry.kind === "birthday"
          ? "#db2777"
          : "#2563eb",
  };
  const hoverColor =
    entry.kind === "task"
      ? "hover:bg-amber-700"
      : entry.kind === "birthday"
        ? "hover:bg-pink-700"
        : "hover:bg-blue-700";
  const className = `pointer-events-auto absolute overflow-hidden rounded-md px-1.5 py-1 text-left text-[10px] font-medium leading-tight text-white shadow-sm ${entry.allDay ? "z-0" : `z-10 ${hoverColor}`}`;

  return (
    <div
      className={className}
      style={style}
      title={`${entry.label} · ${entry.title}`}
    >
      {entry.task ? (
        <>
          <button
            type="button"
            onClick={() => onToggleTask(entry.task!, entry.occurrenceDate)}
            className={`block h-full w-full text-left ${isTaskCompleted(entry.task, entry.occurrenceDate) ? "line-through opacity-75" : ""}`}
            aria-label={`Toggle task ${entry.title}`}
          >
            <span className="block truncate pr-5">{entry.title}</span>
            <span className="block truncate text-white/80">{entry.label}</span>
          </button>
          <DeleteItemButton kind="task" title={entry.title} id={entry.id} onDelete={onDeleteItem} className="absolute right-1 top-1 h-5 w-5 text-white hover:bg-white/20 hover:text-white" />
        </>
      ) : entry.birthday ? (
        <>
          <span className="block truncate">🎂 {entry.title}</span>
          <span className="block truncate text-white/80">{entry.label}</span>
          <DeleteItemButton kind="birthday" title={entry.birthday.name} id={entry.birthday.id} onDelete={onDeleteItem} className="absolute right-1 top-1 h-5 w-5 text-white hover:bg-white/20 hover:text-white" />
        </>
      ) : (
        <>
          <span className="block truncate pr-5">{entry.title}</span>
          <span className="block truncate text-white/80">{entry.label}</span>
          <DeleteItemButton kind="event" title={entry.title} id={entry.id} onDelete={onDeleteItem} className="absolute right-1 top-1 h-5 w-5 text-white hover:bg-white/20 hover:text-white" />
        </>
      )}
    </div>
  );
};

export const CalendarTimeline = ({
  dates,
  selectedDate,
  today,
  events,
  tasks,
  birthdays,
  onSelectDate,
  onToggleTask,
  onDeleteItem,
}: CalendarTimelineProps) => {
  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `4rem repeat(${dates.length}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(24, ${hourHeight}px)`,
    height: `${minutesInDay}px`,
  };

  // Helper to check if a specific date has ANY items (events, tasks, or birthdays)
  const hasAnyItemsOnDate = (date: Date) => {
    const hasEvent = events.some((e) => eventOccursOnDate(e, date));
    const hasTask = tasks.some((t) => taskDueOnDate(t, date));
    const hasBirthday = birthdays.some((b) => isBirthdayOnDate(b, date));
    return hasEvent || hasTask || hasBirthday;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div
        className="grid shrink-0 border-b border-gray-200 bg-gray-50 text-center"
        style={{
          gridTemplateColumns: `4rem repeat(${dates.length}, minmax(0, 1fr))`,
        }}
      >
        <div className="flex items-center justify-center text-xs uppercase text-gray-400">
          Time
        </div>
        {dates.map((date) => {
          const dayHasItems = hasAnyItemsOnDate(date);
          return (
            <div
              key={calendarDateKey(date)}
              onClick={() => onSelectDate?.(date)}
              className={`min-w-0 px-1 py-2 transition-colors ${
                dayHasItems ? "bg-blue-50/40" : ""
              } ${onSelectDate ? "cursor-pointer hover:bg-gray-100" : ""}`}
            >
              <p className="text-xs uppercase text-gray-400">
                {format(date, "EEE")}
              </p>
              <p
                className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${calendarDateKey(date) === calendarDateKey(today) ? "bg-blue-600 text-white" : calendarDateKey(date) === calendarDateKey(selectedDate) ? "bg-blue-100 text-blue-800" : "text-gray-800"}`}
              >
                {format(date, "d")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div style={gridStyle}>
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              style={{ gridColumn: 1, gridRow: hour + 1 }}
              className="border-b border-r border-gray-100 bg-gray-50/30 px-2 py-1 text-right text-[10px] font-medium text-gray-400"
            >
              {format(new Date(2000, 0, 1, hour), "h a")}
            </div>
          ))}
          {dates.map((date, dateIndex) => {
            const entries = getEntriesForDate(date, events, tasks, birthdays);
            return (
              <div
                key={calendarDateKey(date)}
                style={{
                  gridColumn: dateIndex + 2,
                  gridRow: "1 / span 24",
                  height: `${minutesInDay}px`,
                }}
                className="relative"
              >
                <div
                  className="absolute inset-0 grid"
                  style={{ gridTemplateRows: "repeat(24, minmax(0, 1fr))" }}
                >
                  {Array.from({ length: 24 }, (_, hour) => {
                    const minute = hour * 60;
                    const hasEvent = entries.some(
                      (entry) =>
                        entry.kind === "event" &&
                        !entry.allDay &&
                        entry.startMinute < minute + 60 &&
                        entry.endMinute > minute,
                    );
                    const hasTask = entries.some(
                      (entry) =>
                        entry.kind === "task" &&
                        !entry.allDay &&
                        entry.startMinute < minute + 60 &&
                        entry.endMinute > minute,
                    );
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => onSelectDate?.(date)}
                        aria-label={`${format(date, "EEEE, MMMM d")} at ${format(new Date(2000, 0, 1, hour), "h a")}`}
                        className="border-b border-r border-gray-100 text-left transition-colors hover:brightness-95"
                        style={{
                          backgroundColor: hasEvent
                            ? "#dbeafe"
                            : hasTask
                              ? "#fef3c7"
                              : "transparent",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute inset-0">
                  {entries.map((entry) => (
                    <HourPill
                      key={`${entry.kind}-${entry.id}`}
                      entry={entry}
                      onToggleTask={onToggleTask}
                      onDeleteItem={onDeleteItem}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
