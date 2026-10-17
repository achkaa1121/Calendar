export type TimeFormat = "24" | "12";

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  format: TimeFormat;
  required?: boolean;
}

const toStoredTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

const selectClassName =
  "min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

export const TimeInput = ({
  label,
  value,
  onChange,
  format,
  required = false,
}: TimeInputProps) => {
  const hasTime = value !== "";
  const [storedHour = 0, storedMinute = 0] = hasTime
    ? value.split(":").map(Number)
    : [0, 0];
  const hour12 = storedHour % 12 || 12;
  const period = storedHour >= 12 ? "PM" : "AM";
  const shownHour = format === "12" ? hour12 : storedHour;

  const updateTime = (selectedHour: number, minute: number, nextPeriod = period) => {
    const hour24 =
      format === "12"
        ? (selectedHour % 12) + (nextPeriod === "PM" ? 12 : 0)
        : selectedHour;
    onChange(toStoredTime(hour24, minute));
  };

  const handleHourChange = (nextValue: string) => {
    if (!nextValue) {
      onChange("");
      return;
    }
    updateTime(Number(nextValue), hasTime ? storedMinute : 0);
  };

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-medium text-gray-700">{label}</legend>
      <div className="flex gap-2">
        <select
          value={hasTime ? shownHour : ""}
          required={required}
          onChange={(event) => handleHourChange(event.target.value)}
          className={selectClassName}
          aria-label={`${label} hour`}
        >
          {!required && <option value="">No time</option>}
          {Array.from(
            { length: format === "12" ? 12 : 24 },
            (_, index) => {
              const hour = format === "12" ? index + 1 : index;
              return (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}
                </option>
              );
            },
          )}
        </select>
        <select
          value={hasTime ? storedMinute : ""}
          disabled={!hasTime}
          onChange={(event) =>
            updateTime(shownHour, Number(event.target.value))
          }
          className={selectClassName}
          aria-label={`${label} minute`}
        >
          {!hasTime && <option value="">--</option>}
          {Array.from({ length: 60 }, (_, minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, "0")}
            </option>
          ))}
        </select>
        {format === "12" && (
          <select
            value={period}
            disabled={!hasTime}
            onChange={(event) =>
              updateTime(shownHour, storedMinute, event.target.value)
            }
            className={selectClassName}
            aria-label={`${label} AM or PM`}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        )}
      </div>
    </fieldset>
  );
};
