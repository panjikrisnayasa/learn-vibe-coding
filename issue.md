# User Login Feature Implementation Plan

## Overview
Implement a user login feature using ElysiaJS and Drizzle ORM. This includes a new `sessions` database table, business logic for validating credentials and generating a UUID session token, and a REST API route to handle login requests.

## Technology Stack
- **Framework:** ElysiaJS
- **ORM:** Drizzle ORM (MySQL dialect)
- **Password Verification:** `bcryptjs` (already installed)
- **UUID Generation:** Node.js built-in `crypto.randomUUID()` — no extra package needed

---

## 1. Database Schema (`src/db/schema.ts`)

Add a new `sessions` table to the existing schema file.

**Requirements:**
- Table Name: `sessions`
- Fields:
  - `id`: Integer, Primary Key, Auto Increment
  - `token`: Varchar(255), Not Null — stores the UUID token generated on login
  - `userId`: Integer — foreign key referencing `users.id`
  - `createdAt`: Timestamp, Default Current Timestamp

**Implementation Steps:**
1. Open `src/db/schema.ts`.
2. Import `int` from `drizzle-orm/mysql-core` in addition to the existing imports.
3. Below the existing `users` table definition, add the `sessions` table. Example structure:
   ```typescript
   export const sessions = mysqlTable("sessions", {
     id: serial("id").primaryKey(),
     token: varchar("token", { length: 255 }).notNull(),
     userId: int("user_id"),
     createdAt: timestamp("created_at").defaultNow(),
   });
   ```
4. Run Drizzle Kit to apply the new schema to the database:
   ```bash
   bunx drizzle-kit push
   ```

---

## 2. Service Layer (`src/services/users-services.ts`)

Add a new `loginUser` function to the **existing** `users-services.ts` file.

> **Do NOT create a new file.** Add the login function to the existing service file alongside the existing `registerUser` function.

**Requirements:**
- Accept `email` and `password` from the caller.
- Find the user by their email address.
- If no user is found, throw an error: `"Email or password is wrong"`.
- Compare the provided plain-text password against the stored bcrypt hash using `bcrypt.compare()`.
- If the password does not match, throw an error: `"Email or password is wrong"`.
  > **Important:** Use the same generic error message for both "user not found" and "wrong password" to avoid leaking information about which emails are registered.
- Generate a UUID token using `crypto.randomUUID()`.
- Insert a new record into the `sessions` table with the token and the user's `id`.
- Return the generated token string.

**Implementation Steps:**
1. Open `src/services/users-services.ts`.
2. Import the `sessions` table from `../db/schema`.
3. Write and export a new async function `loginUser({ email, password })`.
4. Implement the logic described above step by step.

---

## 3. Route Layer (`src/routes/users-route.ts`)

Add a new route handler to the **existing** `users-route.ts` file.

> **Do NOT create a new file.** Add the login route to the existing route file alongside the existing `POST /api/user` route.

**Requirements:**
- Endpoint: `POST /api/user/login`
- Request body fields: `email` (string), `password` (string)
- Responses:
  - **Success:** `{ "data": "<uuid-token>" }`
  - **Error:** `{ "error": "Email or password is wrong" }` with HTTP status `400`

**Implementation Steps:**
1. Open `src/routes/users-route.ts`.
2. Import the `loginUser` function from `../services/users-services`.
3. Add a new `.post("/api/user/login", ...)` handler to the existing Elysia instance (chain it after the existing route).
4. Validate the request body using Elysia's `t.Object`:
   ```typescript
   body: t.Object({
     email: t.String({ format: "email" }),
     password: t.String(),
   })
   ```
5. Inside the handler, use a `try...catch` block:
   - Call `loginUser(body)` and store the returned token.
   - On success, return `{ data: token }`.
   - On error, set `set.status = 400` and return `{ error: error.message }`.

---

## 4. No Changes Needed to `src/index.ts`

The `usersRoute` is already registered in `src/index.ts`. Since the new route is added to the same Elysia instance in `users-route.ts`, no changes to `src/index.ts` are required.

---

## Example Usage Test

Send a POST request to the server (e.g., via Postman, curl, or Bruno):

**Endpoint:** `POST http://localhost:3000/api/user/login`

**Body (JSON):**
```json
{
    "email": "john.doe@example.com",
    "password": "password"
}
```

**Expected Success Response:**
```json
{
    "data": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Expected Error Response (wrong credentials):**
```json
{
    "error": "Email or password is wrong"
}
```
