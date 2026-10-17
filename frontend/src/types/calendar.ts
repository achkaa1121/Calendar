export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  recurrenceRule: string | null;
}

export interface CalendarTask {
  id: string;
  title: string;
  dueDate: string | null;
  startTime: string | null;
  dueTime: string | null;
  isCompleted: boolean;
  recurrenceRule: string | null;
  completedDates: string[];
}

export interface CalendarBirthday {
  id: string;
  name: string;
  month: number;
  day: number;
  birthYear: number | null;
}

export type CalendarItemDeleteKind = "event" | "task" | "birthday";
