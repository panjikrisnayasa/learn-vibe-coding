import { describe, expect, it, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "./users-route";
import { db } from "../db/db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

describe("Users Routes Integration Tests", () => {
  const app = new Elysia().use(usersRoute);
  const testEmail = `route-test-${Date.now()}@example.com`;
  const testPassword = "securepassword123";
  const testName = "Route Test User";

  afterAll(async () => {
    const userResult = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    if (userResult.length > 0) {
      const userId = userResult[0]!.id;
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("should successfully register, login, and get current user data via HTTP", async () => {
    // 1. Register the test user
    const registerRes = await app.handle(
      new Request("http://localhost/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          password: testPassword,
        }),
      })
    );
    expect(registerRes.status).toBe(200);

    // 2. Login to retrieve session token
    const loginRes = await app.handle(
      new Request("http://localhost/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
    );
    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as { data: string };
    const token = loginData.data;
    expect(token).toBeDefined();

    // 3. Request user data using the token in the Authorization header
    const userRes = await app.handle(
      new Request("http://localhost/api/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(userRes.status).toBe(200);
    const userData = (await userRes.json()) as { data: any };
    expect(userData.data).toBeDefined();
    expect(userData.data.name).toBe(testName);
    expect(userData.data.email).toBe(testEmail);
    expect(userData.data.id).toBeDefined();
    expect(userData.data.created_at).toBeDefined();
  });

  it("should return 401 Unauthorized for GET /api/user with an invalid token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/user", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token-value",
        },
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 Unauthorized for GET /api/user with missing Authorization header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/user", {
        method: "GET",
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("should successfully log out a user and restrict access to GET /api/user", async () => {
    // 1. Login to get token
    const loginRes = await app.handle(
      new Request("http://localhost/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
    );
    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as { data: string };
    const token = loginData.data;

    // 2. Perform Logout
    const logoutRes = await app.handle(
      new Request("http://localhost/api/user/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(logoutRes.status).toBe(200);
    const logoutData = (await logoutRes.json()) as { data: string };
    expect(logoutData.data).toBe("OK");

    // 3. Try to get user profile with the deleted token (should be 401)
    const userRes = await app.handle(
      new Request("http://localhost/api/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(userRes.status).toBe(401);
  });

  it("should return 401 Unauthorized for DELETE /api/user/logout with an invalid token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/user/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer invalid-token-value",
        },
      })
    );
    expect(res.status).toBe(401);
  });

  it("should return 401 Unauthorized for DELETE /api/user/logout with missing Authorization header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/user/logout", {
        method: "DELETE",
      })
    );
    expect(res.status).toBe(401);
  });
});
