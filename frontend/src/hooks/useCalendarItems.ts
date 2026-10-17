import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type {
  CalendarBirthday,
  CalendarEvent,
  CalendarTask,
} from "../types/calendar";
import { calendarDateKey } from "../utils/calendarDates";

export const useCalendarItems = (start: Date, end: Date, enabled = true) => {
  const startDate = calendarDateKey(start);
  const endDate = calendarDateKey(end);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [birthdays, setBirthdays] = useState<CalendarBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    const params = { start: startDate, end: endDate };
    return Promise.all([
        api.get<CalendarEvent[]>("/events", { params }),
        api.get<CalendarTask[]>("/tasks"),
        api.get<CalendarBirthday[]>("/birthdays", { params }),
    ]);
  }, [startDate, endDate]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError("");
    try {
      const [eventResponse, taskResponse, birthdayResponse] = await fetchItems();
      setEvents(eventResponse.data);
      setTasks(taskResponse.data);
      setBirthdays(birthdayResponse.data);
    } catch {
      setError("Could not load calendar items. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchItems]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchItems()
      .then(([eventResponse, taskResponse, birthdayResponse]) => {
        if (cancelled) return;
        setEvents(eventResponse.data);
        setTasks(taskResponse.data);
        setBirthdays(birthdayResponse.data);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load calendar items. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, fetchItems]);

  return { events, tasks, birthdays, loading, error, reload };
};
