import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
} from "date-fns";
import { useGetCurrentDateTime } from "./hooks/useGetCurrentDateTime";
import { Sidebar } from "./components/Sidebar";
import { CalendarHeader } from "./components/CalendarHeader";
import { MonthGrid } from "./components/MonthGrid";
import { WeekGrid } from "./components/WeekGrid";
import { DayGrid } from "./components/DayGrid";
import AuthPage from "./pages/AuthPage"; // Import your auth page component
import { useCalendarItems } from "./hooks/useCalendarItems";
import { api } from "./lib/api";
import type { CalendarItemDeleteKind, CalendarTask } from "./types/calendar";
import { isTaskCompleted } from "./utils/calendarDates";
import {
  CalendarItemDialog,
  type CalendarItemKind,
} from "./components/CalendarItemDialog";

export const App = () => {
  const today = useGetCurrentDateTime();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("token"),
  );

  // Navigation & Selection States
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<Date[]>([new Date()]);
  const [selectionAnchor, setSelectionAnchor] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<"month" | "week" | "day">(
    "month",
  );
  const [dialogKind, setDialogKind] = useState<CalendarItemKind | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    kind: CalendarItemDeleteKind;
    id: string;
    title: string;
  } | null>(null);

  // Listen to token changes or state updates
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  // Grid calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  let calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Force 6 rows (42 cells) consistency if month has only 5 weeks
  if (calendarDays.length === 35) {
    const extraEnd = addDays(calendarDays[calendarDays.length - 1], 7);
    calendarDays = eachDayOfInterval({ start: gridStart, end: extraEnd });
  }

  const visibleMonthEnd = calendarDays[calendarDays.length - 1] ?? gridEnd;
  const itemRangeStart =
    activeView === "month"
      ? gridStart
      : activeView === "week"
        ? startOfWeek(selectedDate, { weekStartsOn: 0 })
        : selectedDate;
  const itemRangeEnd =
    activeView === "month"
      ? visibleMonthEnd
      : activeView === "week"
        ? endOfWeek(selectedDate, { weekStartsOn: 0 })
        : selectedDate;

  const { events, tasks, birthdays, loading, error, reload } = useCalendarItems(
    itemRangeStart,
    itemRangeEnd,
    isAuthenticated,
  );

  const handleToggleTask = async (task: CalendarTask, occurrenceDate?: Date) => {
    const isCompleted =
      task.recurrenceRule && occurrenceDate
        ? !isTaskCompleted(task, occurrenceDate)
        : !task.isCompleted;
    await api.patch(`/tasks/${task.id}`, {
      isCompleted,
      ...(task.recurrenceRule && occurrenceDate
        ? { occurrenceDate: format(occurrenceDate, "yyyy-MM-dd") }
        : {}),
    });
    await reload();
  };

  const handleDeleteItem = (
    kind: CalendarItemDeleteKind,
    id: string,
    title: string,
  ) => setPendingDelete({ kind, id, title });

  const confirmDeleteItem = async () => {
    if (!pendingDelete) return;
    const resource = pendingDelete.kind === "birthday" ? "birthdays" : `${pendingDelete.kind}s`;
    await api.delete(`/${resource}/${pendingDelete.id}`);
    setPendingDelete(null);
    await reload();
  };

  const handleWeekDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedDays([date]);
    setSelectionAnchor(date);
  };

  // Navigation handlers
  const moveCalendarPeriod = (direction: -1 | 1) => {
    if (activeView === "month") {
      setCurrentMonth((month) =>
        direction < 0 ? subMonths(month, 1) : addMonths(month, 1),
      );
      return;
    }

    const nextDate =
      activeView === "week"
        ? direction < 0
          ? subWeeks(selectedDate, 1)
          : addWeeks(selectedDate, 1)
        : direction < 0
          ? subDays(selectedDate, 1)
          : addDays(selectedDate, 1);
    setSelectedDate(nextDate);
    setSelectedDays([nextDate]);
    setSelectionAnchor(nextDate);
    setCurrentMonth(nextDate);
  };

  const handlePreviousPeriod = () => moveCalendarPeriod(-1);
  const handleNextPeriod = () => moveCalendarPeriod(1);
  const handleTodayClick = () => {
    setCurrentMonth(today);
    setSelectedDate(today);
    setSelectedDays([today]);
    setSelectionAnchor(today);
  };

  const handleMonthDateSelect = (
    date: Date,
    modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => {
    setSelectedDate(date);

    if (modifiers.shiftKey) {
      const start = selectionAnchor < date ? selectionAnchor : date;
      const end = selectionAnchor < date ? date : selectionAnchor;
      setSelectedDays(
        calendarDays.filter((day) => isWithinInterval(day, { start, end })),
      );
      return;
    }

    if (modifiers.ctrlKey || modifiers.metaKey) {
      setSelectedDays((current) =>
        current.some((day) => day.getTime() === date.getTime())
          ? current.filter((day) => day.getTime() !== date.getTime())
          : [...current, date],
      );
      setSelectionAnchor(date);
      return;
    }

    setSelectedDays([date]);
    setSelectionAnchor(date);
  };

  // If not authenticated, render the Auth view
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      <Sidebar
        onTodayClick={handleTodayClick}
        onAddItem={setDialogKind}
        selectedDate={selectedDate}
        events={events}
        tasks={tasks}
        birthdays={birthdays}
        onToggleTask={(task, occurrenceDate) =>
          void handleToggleTask(task, occurrenceDate)
        }
        onDeleteItem={handleDeleteItem}
      />

      <main className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <button
          onClick={handleLogout}
          className="absolute right-3 top-2 z-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 mt-3 mr-3 text-xs font-medium text-gray-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          Sign out
        </button>

        <div className="flex min-h-0 flex-1 p-2 lg:p-3">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-none flex-col rounded-2xl bg-gray-100 p-3 lg:p-4">
            {loading && (
              <p className="mb-1 text-xs text-gray-500">Loading calendar items…</p>
            )}
            {error && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <span>{error}</span>
                <button type="button" onClick={() => void reload()} className="underline">Retry</button>
              </div>
            )}
            <CalendarHeader
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              activeView={activeView}
              setActiveView={setActiveView}
              onPrevMonth={handlePreviousPeriod}
              onNextMonth={handleNextPeriod}
            />

            {/* Conditionally Render Based on Active View */}
            {activeView === "month" && (
              <>
                <div className="grid grid-cols-7 gap-2 font-semibold text-right pr-4 text-sm text-gray-600 uppercase tracking-wider py-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day}>{day}</div>
                    ),
                  )}
                </div>

                <MonthGrid
                  days={calendarDays}
                  currentMonth={currentMonth}
                  today={today}
                  selectedDays={selectedDays}
                  events={events}
                  tasks={tasks}
                  birthdays={birthdays}
                  onToggleTask={(task, occurrenceDate) =>
                    void handleToggleTask(task, occurrenceDate)
                  }
                  onDeleteItem={handleDeleteItem}
                  onSelectDate={handleMonthDateSelect}
                />
              </>
            )}

            {activeView === "week" && (
              <WeekGrid
                selectedDate={selectedDate}
                today={today}
                onSelectDate={handleWeekDateSelect}
                events={events}
                tasks={tasks}
                birthdays={birthdays}
                onToggleTask={(task, occurrenceDate) =>
                  void handleToggleTask(task, occurrenceDate)
                }
                onDeleteItem={handleDeleteItem}
              />
            )}

            {activeView === "day" && (
              <DayGrid
                selectedDate={selectedDate}
                today={today}
                events={events}
                tasks={tasks}
                birthdays={birthdays}
                onToggleTask={(task, occurrenceDate) =>
                  void handleToggleTask(task, occurrenceDate)
                }
                onDeleteItem={handleDeleteItem}
              />
            )}
          </div>
        </div>
      </main>
      {dialogKind && (
        <CalendarItemDialog
          key={`${dialogKind}-${selectedDate.toISOString()}`}
          kind={dialogKind}
          selectedDates={
            (dialogKind === "event" || dialogKind === "task") &&
            selectedDays.length > 0
              ? selectedDays
              : [selectedDate]
          }
          onClose={() => setDialogKind(null)}
          onCreated={reload}
        />
      )}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M4.5 6h11M8 6V4.5h4V6m-6 0 .6 9h6.8l.6-9M8.5 8.5v4.5m3-4.5v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-gray-900">Delete this {pendingDelete.kind}?</h2>
            <p className="mt-2 wrap-break-word text-sm text-gray-600">“{pendingDelete.title}” will be permanently removed.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => void confirmDeleteItem()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Delete</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
