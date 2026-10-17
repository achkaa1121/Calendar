import { useState, type FormEvent } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import axios from "axios";
import { api } from "../lib/api";
import { TimeInput, type TimeFormat } from "./TimeInput";

export type CalendarItemKind = "event" | "task" | "birthday";

interface CalendarItemDialogProps {
  kind: CalendarItemKind;
  selectedDates: Date[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const localDate = (date: Date) => format(date, "yyyy-MM-dd");
type RecurrenceFrequency = "" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export const CalendarItemDialog = ({
  kind,
  selectedDates,
  onClose,
  onCreated,
}: CalendarItemDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [birthdayMonth, setBirthdayMonth] = useState(() =>
    String((selectedDates[0] ?? new Date()).getMonth() + 1),
  );
  const [birthdayDay, setBirthdayDay] = useState(() =>
    String((selectedDates[0] ?? new Date()).getDate()),
  );
  const [birthYear, setBirthYear] = useState("");
  const [eventSchedule, setEventSchedule] = useState<"span" | "eachDay">("eachDay");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("24");
  const [repeatFrequency, setRepeatFrequency] =
    useState<RecurrenceFrequency>("");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const orderedSelectedDates = [...selectedDates].sort((a, b) => +a - +b);
  const selectedDatesAreConsecutive = orderedSelectedDates.every(
    (date, index) =>
      index === 0 ||
      differenceInCalendarDays(date, orderedSelectedDates[index - 1]) === 1,
  );
  const hasPastSelectedDate = selectedDates.some(
    (date) => localDate(date) < localDate(new Date()),
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (kind !== "birthday" && hasPastSelectedDate) {
        setError("Tasks and events cannot be added to past dates.");
        return;
      }
      if (
        kind !== "birthday" &&
        repeatUntil &&
        selectedDates.some((date) => localDate(date) > repeatUntil)
      ) {
        setError("Repeat until must be on or after every selected date.");
        return;
      }
      const recurrenceRule = repeatFrequency
        ? `FREQ=${repeatFrequency}${repeatUntil ? `;UNTIL=${repeatUntil.replaceAll("-", "")}` : ""}`
        : null;
      if (kind === "birthday") {
        const month = Number(birthdayMonth);
        const day = Number(birthdayDay);
        const daysInMonth = new Date(Date.UTC(2000, month, 0)).getUTCDate();
        if (day < 1 || day > daysInMonth) {
          setError("That month does not have that day.");
          return;
        }
        await api.post("/birthdays", {
          name: title.trim(),
          month,
          day,
          birthYear: birthYear ? Number(birthYear) : null,
        });
      } else if (kind === "task") {
        if (taskStartTime && taskDueTime && taskDueTime <= taskStartTime) {
          setError("Due time must be later than the start time.");
          return;
        }
        await Promise.all(
          selectedDates.map((date) =>
            api.post("/tasks", {
              title: title.trim(),
              dueDate: localDate(date),
              startTime: taskStartTime || null,
              dueTime: taskDueTime || null,
              recurrenceRule,
            }),
          ),
        );
      } else {
        if (orderedSelectedDates.length > 1 && !selectedDatesAreConsecutive) {
          setError(
            "Events can only be added to consecutive selected days. Tasks can use non-consecutive days.",
          );
          return;
        }
        if (
          !allDay &&
          eventSchedule === "eachDay" &&
          endTime <= startTime
        ) {
          setError("End time must be later than start time.");
          return;
        }
        const createEvent = (date: Date, endDate = date) => {
          return api.post("/events", {
            title: title.trim(),
            description: description.trim() || undefined,
            startDate: localDate(date),
            endDate: localDate(endDate),
            startTime: allDay ? null : startTime,
            endTime: allDay ? null : endTime,
            isAllDay: allDay,
            recurrenceRule,
          });
        };
        if (eventSchedule === "span" && orderedSelectedDates.length > 1) {
          const first = orderedSelectedDates[0];
          const last = orderedSelectedDates[orderedSelectedDates.length - 1];
          await createEvent(first, last);
        } else {
          await Promise.all(orderedSelectedDates.map((date) => createEvent(date)));
        }
      }
      await onCreated();
      onClose();
    } catch (error: unknown) {
      const responseError = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      setError(
        responseError ||
          (axios.isAxiosError(error) && !error.response
            ? "Could not reach the server. Check that the backend is running and try again."
            : "Could not save this item. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const heading = kind === "birthday" ? "Add birthday" : `Add ${kind}`;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{heading}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {kind === "birthday"
                ? "Enter the month and day. Birth year is optional; add it to show the age they turn."
                : hasPastSelectedDate
                  ? "Tasks and events cannot be added to past dates. Select only today or future dates."
                  : kind === "task"
                  ? `A task will be created on each selected day (${selectedDates.map((date) => format(date, "MMM d")).join(", ")}). Days do not need to be consecutive.`
                  : selectedDates.length > 1
                    ? selectedDatesAreConsecutive
                      ? "Choose one event spanning the selected dates or a separate event each day. Event dates must be consecutive."
                      : "These dates are not consecutive, so an event cannot be created for them. Choose consecutive dates or create tasks instead."
                    : `This event is for ${format(selectedDates[0] ?? new Date(), "PPP")}.`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          {kind === "birthday" ? "Name" : "Title"}
          <input
            required
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        {kind === "birthday" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-700">
              Birth month
              <select
                required
                value={birthdayMonth}
                onChange={(event) => setBirthdayMonth(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {format(new Date(2000, index, 1), "MMMM")}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Birth day
              <input
                type="number"
                required
                min="1"
                max="31"
                value={birthdayDay}
                onChange={(event) => setBirthdayDay(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="col-span-2 text-sm font-medium text-gray-700">
              Year born (optional)
              <input
                type="number"
                min="1"
                max={new Date().getFullYear()}
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
        )}

        {((kind === "event" && !allDay) || kind === "task") && (
          <label className="block text-sm font-medium text-gray-700">
            Time format
            <select
              value={timeFormat}
              onChange={(event) =>
                setTimeFormat(event.target.value as TimeFormat)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="24">24-hour</option>
              <option value="12">12-hour (AM/PM)</option>
            </select>
          </label>
        )}

        {kind === "event" && (
          <>
            {selectedDates.length > 1 && (
              <fieldset className="space-y-2 rounded-lg border border-gray-200 p-3">
                <legend className="px-1 text-sm font-medium text-gray-700">
                  How should these dates work?
                </legend>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="eventSchedule"
                    checked={eventSchedule === "span"}
                    onChange={() => setEventSchedule("span")}
                  />
                  <span>One event: start on the first day and end on the last day.</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="eventSchedule"
                    checked={eventSchedule === "eachDay"}
                    onChange={() => setEventSchedule("eachDay")}
                  />
                  <span>Separate event each day, using the same times on every day.</span>
                </label>
              </fieldset>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(event) => setAllDay(event.target.checked)}
              />
              All day
            </label>
            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <TimeInput
                  label="Start time"
                  value={startTime}
                  onChange={setStartTime}
                  format={timeFormat}
                  required
                />
                <TimeInput
                  label="End time"
                  value={endTime}
                  onChange={setEndTime}
                  format={timeFormat}
                  required
                />
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700">
              Description (optional)
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </>
        )}

        {(kind === "event" || kind === "task") && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-gray-700">
              Repeat
              <select
                value={repeatFrequency}
                onChange={(event) =>
                  setRepeatFrequency(event.target.value as RecurrenceFrequency)
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="">Does not repeat</option>
                <option value="DAILY">Every day</option>
                <option value="WEEKLY">Every week</option>
                <option value="MONTHLY">Every month</option>
                <option value="YEARLY">Every year</option>
              </select>
            </label>
            {repeatFrequency && (
              <label className="block text-sm font-medium text-gray-700">
                Repeat until (optional)
                <input
                  type="date"
                  min={selectedDates.length ? localDate(orderedSelectedDates[0]) : undefined}
                  value={repeatUntil}
                  onChange={(event) => setRepeatUntil(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                />
              </label>
            )}
          </div>
        )}

        {kind === "task" && (
          <div className="grid grid-cols-2 gap-3">
            <TimeInput
              label="Start time (optional)"
              value={taskStartTime}
              onChange={setTaskStartTime}
              format={timeFormat}
            />
            <TimeInput
              label="Due time (optional)"
              value={taskDueTime}
              onChange={setTaskDueTime}
              format={timeFormat}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};
