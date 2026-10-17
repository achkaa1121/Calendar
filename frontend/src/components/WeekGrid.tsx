import { addDays, startOfWeek } from "date-fns";
import type { CalendarBirthday, CalendarEvent, CalendarItemDeleteKind, CalendarTask } from "../types/calendar";
import { CalendarTimeline } from "./CalendarTimeline";

interface WeekGridProps {
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  tasks: CalendarTask[];
  birthdays: CalendarBirthday[];
  onToggleTask: (task: CalendarTask, occurrenceDate?: Date) => void;
  onDeleteItem: (kind: CalendarItemDeleteKind, id: string, title: string) => void;
}

export const WeekGrid = ({
  selectedDate,
  today,
  onSelectDate,
  events,
  tasks,
  birthdays,
  onToggleTask,
  onDeleteItem,
}: WeekGridProps) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <CalendarTimeline
      dates={dates}
      selectedDate={selectedDate}
      today={today}
      events={events}
      tasks={tasks}
      birthdays={birthdays}
      onSelectDate={onSelectDate}
      onToggleTask={onToggleTask}
      onDeleteItem={onDeleteItem}
    />
  );
};
