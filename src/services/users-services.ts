import { db } from "../db/db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function registerUser({ name, email, password }: typeof users.$inferInsert) {
  if (!name || !email || !password) {
    throw new Error("Missing required fields");
  }

  // Check if email already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });
}

export async function loginUser({ email, password }: { email: string; password: string }) {
  // Find user by email
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (result.length === 0) {
    throw new Error("Email or password is wrong");
  }

  const user = result[0]!

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Email or password is wrong");
  }

  // Generate UUID token
  const token = crypto.randomUUID();

  // Insert session record
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
}
