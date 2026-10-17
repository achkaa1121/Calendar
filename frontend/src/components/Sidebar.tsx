import React from "react";
import { format } from "date-fns";
import type { CalendarBirthday, CalendarEvent, CalendarTask } from "../types/calendar";
import type { CalendarItemDeleteKind } from "../types/calendar";
import { DeleteItemButton } from "./DeleteItemButton";
import {
  eventOccurrenceOnDate,
  formatEventTimes,
  formatTaskTimes,
  isTaskCompleted,
  taskDueOnDate,
} from "../utils/calendarDates";

interface SidebarProps {
  onTodayClick: () => void;
  onAddItem: (kind: "event" | "task" | "birthday") => void;
  selectedDate: Date;
  events: CalendarEvent[];
  tasks: CalendarTask[];
  birthdays: CalendarBirthday[];
  onToggleTask: (task: CalendarTask, occurrenceDate?: Date) => void;
  onDeleteItem: (kind: CalendarItemDeleteKind, id: string, title: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onTodayClick,
  onAddItem,
  selectedDate,
  events,
  tasks,
  birthdays,
  onToggleTask,
  onDeleteItem,
}) => {
  const dayEvents = events
    .map((event) => ({ event, occurrence: eventOccurrenceOnDate(event, selectedDate) }))
    .filter((item) => item.occurrence !== null);
  const dayTasks = tasks.filter((task) => taskDueOnDate(task, selectedDate));
  const dayBirthdays = birthdays.filter(
    (birthday) => birthday.month === selectedDate.getMonth() + 1 && birthday.day === selectedDate.getDate(),
  );

  return (
    <aside className="w-72 bg-white flex flex-col shrink-0 border-r border-gray-200 min-h-0">
      {/* App Branding */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          📅
        </div>
        <h1 className="font-bold text-xl text-gray-900 tracking-tight">
          Calendar
        </h1>
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <button
          onClick={onTodayClick}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
        >
          Jump to Today
        </button>
      </div>

      <div className="px-4 pb-4">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Create</p>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            ["event", "Event", "bg-blue-50 text-blue-700 hover:bg-blue-100"],
            ["task", "Task", "bg-amber-50 text-amber-700 hover:bg-amber-100"],
            ["birthday", "Birthday", "bg-pink-50 text-pink-700 hover:bg-pink-100"],
          ] as const).map(([kind, label, styles]) => (
            <button
              key={kind}
              type="button"
              onClick={() => onAddItem(kind)}
              className={`rounded-lg px-1.5 py-2 text-xs font-semibold transition-colors ${styles}`}
            >
              + {label}
            </button>
          ))}
        </div>
      </div>

      <section className="flex-1 min-h-0 overflow-y-auto px-4 pb-4" aria-label="Selected day items">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          {format(selectedDate, "EEEE, MMM d")}
        </h2>

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Birthdays</h3>
        {dayBirthdays.length > 0 ? (
          <ul className="mb-5 space-y-2">
            {dayBirthdays.map((birthday) => (
              <li key={birthday.id} className="flex items-center gap-2 rounded-lg border border-pink-100 bg-pink-50/70 px-3 py-2">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm">🎂</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-pink-950">{birthday.name}</p>
                  {birthday.birthYear !== null && <p className="mt-0.5 text-xs font-medium text-pink-700">Turns {selectedDate.getFullYear() - birthday.birthYear}</p>}
                </div>
                <DeleteItemButton kind="birthday" title={birthday.name} id={birthday.id} onDelete={(kind, id) => onDeleteItem(kind, id, birthday.name)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-5 text-sm text-gray-500">No birthdays</p>
        )}

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Events</h3>
        {dayEvents.length ? (
          <ul className="mb-5 space-y-2">
            {dayEvents.map(({ event, occurrence }) => (
              <li key={event.id} className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2">
                <div className="flex min-w-0 items-start justify-between gap-1">
                  <p className="min-w-0 text-sm font-medium text-blue-950">{event.title}</p>
                  <DeleteItemButton kind="event" title={event.title} id={event.id} onDelete={(kind, id) => onDeleteItem(kind, id, event.title)} />
                </div>
                <p className="mt-1 text-xs font-semibold text-blue-700">
                  {event.isAllDay
                    ? "All day"
                    : `${formatEventTimes(event)}${occurrence?.startDate !== occurrence?.endDate ? " · multi-day" : ""}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-5 text-sm text-gray-500">No events</p>
        )}

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Tasks</h3>
        {dayTasks.length ? (
          <ul className="space-y-2">
            {dayTasks.map((task) => {
              const completed = isTaskCompleted(task, selectedDate);
              return (
                <li key={task.id} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={completed}
                    aria-label={`Complete ${task.title}`}
                    onChange={() => onToggleTask(task, selectedDate)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium text-amber-950 ${completed ? "line-through opacity-60" : ""}`}>{task.title}</p>
                    {formatTaskTimes(task) && <p className="mt-1 text-xs font-semibold text-amber-700">{formatTaskTimes(task)}</p>}
                  </div>
                  <DeleteItemButton kind="task" title={task.title} id={task.id} onDelete={(kind, id) => onDeleteItem(kind, id, task.title)} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No tasks</p>
        )}
      </section>
    </aside>
  );
};
