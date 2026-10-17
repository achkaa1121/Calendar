import { ApiError } from "./apiError.js";
import { parseDateOnly } from "./dateOnly.js";

const frequencyValues = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
type Frequency = (typeof frequencyValues)[number];

export const normalizeRecurrenceRule = (
  value: unknown,
  startDate: string,
): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ApiError("Invalid recurrence rule", 400);
  }

  const parts = new Map<string, string>();
  for (const part of value.toUpperCase().split(";")) {
    const [key, ...values] = part.split("=");
    if (!key || values.length !== 1 || !values[0] || parts.has(key)) {
      throw new ApiError("Invalid recurrence rule", 400);
    }
    parts.set(key, values[0]);
  }

  const frequency = parts.get("FREQ");
  const intervalText = parts.get("INTERVAL");
  const untilText = parts.get("UNTIL");
  if (
    parts.size !== 1 + Number(parts.has("INTERVAL")) + Number(parts.has("UNTIL")) ||
    !frequencyValues.includes(frequency as Frequency)
  ) {
    throw new ApiError("Invalid recurrence rule", 400);
  }

  const interval = intervalText === undefined ? 1 : Number(intervalText);
  if (!Number.isInteger(interval) || interval < 1 || interval > 365) {
    throw new ApiError("Invalid recurrence interval", 400);
  }

  let until: string | null = null;
  if (untilText !== undefined) {
    if (!/^\d{8}$/.test(untilText)) {
      throw new ApiError("Recurrence end date must use YYYYMMDD", 400);
    }
    const parsedUntil = parseDateOnly(
      `${untilText.slice(0, 4)}-${untilText.slice(4, 6)}-${untilText.slice(6, 8)}`,
    );
    const parsedStartDate = parseDateOnly(startDate);
    if (!parsedUntil || !parsedStartDate || parsedUntil < parsedStartDate) {
      throw new ApiError("Recurrence end date must be on or after the start date", 400);
    }
    until = untilText;
  }

  return [
    `FREQ=${frequency}`,
    ...(interval === 1 ? [] : [`INTERVAL=${interval}`]),
    ...(until ? [`UNTIL=${until}`] : []),
  ].join(";");
};

export const recurrenceOccursOnDate = (
  startDate: string,
  targetDate: string,
  rule: string | null,
) => {
  if (!rule) return startDate === targetDate;
  const fields = new Map(
    rule.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value] as const;
    }),
  );
  const frequency = fields.get("FREQ");
  const interval = Number(fields.get("INTERVAL") ?? 1);
  const until = fields.get("UNTIL");
  const normalizedUntil = until
    ? `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`
    : null;
  if (targetDate < startDate || (normalizedUntil && targetDate > normalizedUntil)) {
    return false;
  }
  const start = parseDateOnly(startDate);
  const target = parseDateOnly(targetDate);
  if (!start || !target) return false;

  const daysApart = Math.round((target.getTime() - start.getTime()) / 86_400_000);
  if (frequency === "DAILY") return daysApart % interval === 0;
  if (frequency === "WEEKLY") return daysApart % (interval * 7) === 0;
  if (frequency === "MONTHLY") {
    const monthsApart =
      (target.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      target.getUTCMonth() - start.getUTCMonth();
    return monthsApart % interval === 0 && target.getUTCDate() === start.getUTCDate();
  }
  if (frequency === "YEARLY") {
    return (
      (target.getUTCFullYear() - start.getUTCFullYear()) % interval === 0 &&
      target.getUTCMonth() === start.getUTCMonth() &&
      target.getUTCDate() === start.getUTCDate()
    );
  }
  return false;
};
