import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/authConfig.js";
import { prisma } from "../prisma.js";
import { ApiError } from "../utils/apiError.js";
import { loginSchema, parseInput, registerSchema } from "../utils/validation.js";

const issueSession = (user: { id: string; email: string; name: string | null }) => ({
  token: jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" }),
  user: { id: user.id, email: user.email, name: user.name },
});

export const registerUser = async (
  email: string,
  password: string,
  name: string,
) => {
  ({ email, password, name } = parseInput(registerSchema, { email, password, name }));
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) throw new ApiError("Email already in use", 400);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      name: name.trim(),
    },
  });
  return issueSession(user);
};

export const loginUser = async (email: string, password: string) => {
  ({ email, password } = parseInput(loginSchema, { email, password }));
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError("Invalid credentials", 400);
  }
  return issueSession(user);
};
