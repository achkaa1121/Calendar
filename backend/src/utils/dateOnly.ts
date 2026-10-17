export const parseDateOnly = (value: unknown): Date | null => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }
  return parsedDate;
};

export const currentDateOnly = () => new Date().toISOString().slice(0, 10);

// PostgreSQL DATE values arrive through the pg adapter as local-midnight Dates.
// Serialize their local calendar components so JSON cannot shift them by timezone.
export const formatDateOnly = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
