import { prisma } from "../prisma.js";
import { ApiError } from "../utils/apiError.js";
import { birthdaySchema, idSchema, parseInput } from "../utils/validation.js";

export const listBirthdays = (userId: string) =>
  prisma.birthday.findMany({
    where: { userId },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });

export const createBirthday = async (userId: string, body: unknown) => {
  const { name, month, day, birthYear } = parseInput(birthdaySchema, body);
  return prisma.birthday.create({
    data: {
      userId,
      name: name.trim(),
      month,
      day,
      birthYear: birthYear ?? null,
    },
  });
};

export const removeBirthday = async (userId: string, birthdayId: string) => {
  birthdayId = parseInput(idSchema, birthdayId);
  const result = await prisma.birthday.deleteMany({
    where: { id: birthdayId, userId },
  });
  if (result.count === 0) throw new ApiError("Birthday not found", 404);
};
