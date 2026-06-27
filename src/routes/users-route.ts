import { Elysia, t } from "elysia";
import { registerUser, loginUser, getUserByToken, logoutUser } from "../services/users-services";

export const usersRoute = new Elysia()
  .post("/api/user", async ({ body, set }) => {
    try {
      await registerUser(body);
      return { data: "OK" };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .post("/api/user/login", async ({ body, set }) => {
    try {
      const token = await loginUser(body);
      return { data: token };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    })
  })
  .get("/api/user", async ({ headers, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authHeader.substring(7); // "Bearer " is 7 chars long

    try {
      const user = await getUserByToken(token);
      return { data: user };
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        set.status = 401;
      } else {
        set.status = 500;
      }
      return { error: error.message };
    }
  })
  .delete("/api/user/logout", async ({ headers, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authHeader.substring(7);

    try {
      await logoutUser(token);
      return { data: "OK" };
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        set.status = 401;
      } else {
        set.status = 500;
      }
      return { error: error.message };
    }
  });
