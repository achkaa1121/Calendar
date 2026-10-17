import { prisma } from "../prisma.js";
import { ApiError } from "../utils/apiError.js";

export const listBirthdays = (userId: string) =>
  prisma.birthday.findMany({
    where: { userId },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });

export const createBirthday = async (userId: string, body: unknown) => {
  const { name, month, day, birthYear } = (body ?? {}) as Record<string, unknown>;
  const daysInMonth =
    Number.isInteger(month) && typeof month === "number" && month >= 1 && month <= 12
      ? new Date(Date.UTC(2000, month, 0)).getUTCDate()
      : 0;
  const parsedBirthYear = birthYear === undefined || birthYear === null ? null : birthYear;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    typeof day !== "number" ||
    day < 1 ||
    day > daysInMonth ||
    (parsedBirthYear !== null &&
      (typeof parsedBirthYear !== "number" ||
        !Number.isInteger(parsedBirthYear) ||
        parsedBirthYear < 1 ||
        parsedBirthYear > new Date().getFullYear()))
  ) {
    throw new ApiError("Invalid birthday details", 400);
  }
  return prisma.birthday.create({
    data: {
      userId,
      name: name.trim(),
      month: month as number,
      day,
      birthYear: parsedBirthYear as number | null,
    },
  });
};

export const removeBirthday = async (userId: string, birthdayId: string) => {
  const result = await prisma.birthday.deleteMany({
    where: { id: birthdayId, userId },
  });
  if (result.count === 0) throw new ApiError("Birthday not found", 404);
};
