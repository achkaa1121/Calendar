import type {
  CalendarBirthday,
  CalendarEvent,
  CalendarTask,
} from "../types/calendar";

export const isBirthdayOnDate = (birthday: CalendarBirthday, date: Date) => {
  return birthday.month === date.getMonth() + 1 && birthday.day === date.getDate();
};

export const calendarDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const storedDateKey = (value: string) => value.slice(0, 10);

const dateOrdinal = (key: string) => {
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

const dateKeyFromOrdinal = (ordinal: number) => {
  const date = new Date(ordinal * 86_400_000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

const recurrenceMatches = (
  startDate: string,
  date: string,
  rule: string | null,
) => {
  if (!rule) return startDate === date;
  const parts = Object.fromEntries(
    rule.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const frequency = parts.FREQ;
  const interval = Number(parts.INTERVAL ?? 1);
  const until = parts.UNTIL
    ? `${parts.UNTIL.slice(0, 4)}-${parts.UNTIL.slice(4, 6)}-${parts.UNTIL.slice(6, 8)}`
    : null;
  if (
    !["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(frequency ?? "") ||
    !Number.isInteger(interval) ||
    interval < 1 ||
    date < startDate ||
    (until !== null && date > until)
  ) {
    return false;
  }

  const [startYear = 0, startMonth = 1, startDay = 1] = startDate
    .split("-")
    .map(Number);
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  if (frequency === "DAILY") {
    return (dateOrdinal(date) - dateOrdinal(startDate)) % interval === 0;
  }
  if (frequency === "WEEKLY") {
    return (dateOrdinal(date) - dateOrdinal(startDate)) % (interval * 7) === 0;
  }
  if (frequency === "MONTHLY") {
    const monthsApart = (year - startYear) * 12 + month - startMonth;
    return monthsApart % interval === 0 && day === startDay;
  }
  return (year - startYear) % interval === 0 && month === startMonth && day === startDay;
};

export const eventOccurrenceOnDate = (event: CalendarEvent, date: Date) => {
  const key = calendarDateKey(date);
  const start = storedDateKey(event.startDate);
  const end = storedDateKey(event.endDate);
  if (!event.recurrenceRule) {
    return start <= key && end >= key ? { startDate: start, endDate: end } : null;
  }

  const durationDays = Math.max(0, dateOrdinal(end) - dateOrdinal(start));
  const targetOrdinal = dateOrdinal(key);
  for (let offset = 0; offset <= durationDays; offset += 1) {
    const occurrenceStart = dateKeyFromOrdinal(targetOrdinal - offset);
    if (recurrenceMatches(start, occurrenceStart, event.recurrenceRule)) {
      return {
        startDate: occurrenceStart,
        endDate: dateKeyFromOrdinal(dateOrdinal(occurrenceStart) + durationDays),
      };
    }
  }
  return null;
};

export const eventOccursOnDate = (event: CalendarEvent, date: Date) =>
  eventOccurrenceOnDate(event, date) !== null;

export const eventStartsOnDate = (event: CalendarEvent, date: Date) =>
  eventOccurrenceOnDate(event, date)?.startDate === calendarDateKey(date);

export const taskDueOnDate = (task: CalendarTask, date: Date) =>
  task.dueDate !== null &&
  recurrenceMatches(
    storedDateKey(task.dueDate),
    calendarDateKey(date),
    task.recurrenceRule,
  );

export const isTaskCompleted = (task: CalendarTask, date?: Date) =>
  task.recurrenceRule && date
    ? task.completedDates?.includes(calendarDateKey(date)) ?? false
    : task.isCompleted;

export const getAgeTurning = (birthday: CalendarBirthday, year: number) =>
  birthday.birthYear === null ? null : year - birthday.birthYear;

export const formatBirthdayAge = (birthday: CalendarBirthday, year: number) => {
  const age = getAgeTurning(birthday, year);
  return age === null ? "" : ` · turns ${age}`;
};

export const formatTaskTimes = (task: CalendarTask) => {
  if (task.startTime && task.dueTime) return `${task.startTime}–${task.dueTime}`;
  if (task.startTime) return `starts ${task.startTime}`;
  if (task.dueTime) return `due ${task.dueTime}`;
  return "";
};

export const formatEventTimes = (event: CalendarEvent) => {
  if (event.isAllDay) return "All day";
  if (event.startTime && event.endTime) {
    return `${event.startTime}–${event.endTime}`;
  }
  return event.startTime ?? "";
};
