import { describe, expect, it, afterAll } from "bun:test";
import { registerUser, loginUser, getUserByToken } from "./users-services";
import { db } from "../db/db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

describe("User Services", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "securepassword123";
  const testName = "Test User";

  afterAll(async () => {
    // Clean up the test user and sessions from the database
    const userResult = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    if (userResult.length > 0) {
      const userId = userResult[0]!.id;
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("should successfully register a new user", async () => {
    await registerUser({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    const userResult = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    expect(userResult.length).toBe(1);
    expect(userResult[0]!.name).toBe(testName);
  });

  it("should fail to register a user with an existing email", async () => {
    expect(
      registerUser({
        name: testName,
        email: testEmail,
        password: testPassword,
      })
    ).rejects.toThrow("Email already registered");
  });

  it("should successfully log in with correct credentials", async () => {
    const token = await loginUser({
      email: testEmail,
      password: testPassword,
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    // Check if session is stored
    const sessionResult = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    expect(sessionResult.length).toBe(1);
  });

  it("should fail to log in with an incorrect password", async () => {
    expect(
      loginUser({
        email: testEmail,
        password: "wrongpassword",
      })
    ).rejects.toThrow("Email or password is wrong");
  });

  it("should fail to log in with a non-existent email", async () => {
    expect(
      loginUser({
        email: "nonexistent@example.com",
        password: testPassword,
      })
    ).rejects.toThrow("Email or password is wrong");
  });

  describe("getUserByToken", () => {
    it("should successfully retrieve user by valid token", async () => {
      const token = await loginUser({
        email: testEmail,
        password: testPassword,
      });

      expect(token).toBeDefined();

      const user = await getUserByToken(token);
      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.name).toBe(testName);
      expect(user.id).toBeDefined();
      expect(user.created_at).toBeDefined();
    });

    it("should fail to retrieve user with invalid token", async () => {
      expect(getUserByToken("invalid-token-123")).rejects.toThrow("Unauthorized");
    });

    it("should fail to retrieve user with empty token", async () => {
      expect(getUserByToken("")).rejects.toThrow("Unauthorized");
    });
  });
});
