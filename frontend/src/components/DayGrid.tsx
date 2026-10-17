import type { CalendarBirthday, CalendarEvent, CalendarItemDeleteKind, CalendarTask } from "../types/calendar";
import { CalendarTimeline } from "./CalendarTimeline";

interface DayGridProps {
  selectedDate: Date;
  today: Date;
  events: CalendarEvent[];
  tasks: CalendarTask[];
  birthdays: CalendarBirthday[];
  onToggleTask: (task: CalendarTask, occurrenceDate?: Date) => void;
  onDeleteItem: (kind: CalendarItemDeleteKind, id: string, title: string) => void;
}

export const DayGrid = ({
  selectedDate,
  today,
  events,
  tasks,
  birthdays,
  onToggleTask,
  onDeleteItem,
}: DayGridProps) => (
  <CalendarTimeline
    dates={[selectedDate]}
    selectedDate={selectedDate}
    today={today}
    events={events}
    tasks={tasks}
    birthdays={birthdays}
    onToggleTask={onToggleTask}
    onDeleteItem={onDeleteItem}
  />
);
