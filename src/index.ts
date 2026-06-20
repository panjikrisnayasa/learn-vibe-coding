import { Elysia } from "elysia";
import { db } from "./db/db";
import { users } from "./db/schema";

const app = new Elysia()
  .get("/", () => ({ message: "Hello World from Elysia + Bun!" }))
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return { success: true, data: allUsers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
