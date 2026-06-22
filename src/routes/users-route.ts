import { Elysia, t } from "elysia";
import { registerUser } from "../services/users-services";

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
  });
