# Feature: Get Logged-in User Data API

## Overview
Create an API endpoint to retrieve the data of the currently logged-in user using their session token.

**Endpoint:** `GET /api/user`

**Request Header Example:**
```json
{
    "Authorization": "Bearer <token>"
}
```

**Response Success Example:**
```json
{
    "data": {
        "id": 1,
        "name": "Test User",
        "email": "[EMAIL_ADDRESS]",
        "created_at": "2026-01-01T00:00:00.000Z"
    }
}
```

**Response Error Example (401 Unauthorized):**
```json
{
    "error": "Unauthorized"
}
```

## Folder & File Structure
- **Routes:** `src/routes/users-route.ts` (contains routing for ElysiaJS)
- **Services:** `src/services/users-services.ts` (contains business logic)

---

## Step-by-Step Implementation Guide

### Step 1: Implement the Business Logic (Service)
**Target File:** `src/services/users-services.ts`

1. Create and export a new asynchronous function, for example: `export const getUserByToken = async (token: string) => { ... }`.
2. Inside this function, query the database to find the session and user associated with the `token`.
   - Use Drizzle ORM to `db.select()` from the `sessions` table.
   - Use `.innerJoin(users, eq(users.id, sessions.userId))` to join the `users` table.
   - Use `.where(eq(sessions.token, token))` to filter by the provided token.
   - Use `.limit(1)` since tokens are unique.
3. If the query returns no result (meaning the token is invalid or does not exist), throw an error: `throw new Error("Unauthorized");`.
4. If a result is found, return the user object formatted to match the expected response data. Ensure the `createdAt` field from the DB is mapped to `created_at` in the output if needed (or let the route handler map it).

### Step 2: Implement the API Route (ElysiaJS)
**Target File:** `src/routes/users-route.ts` (Create if it doesn't exist)

1. Import `Elysia` from `"elysia"`.
2. Import the `getUserByToken` service you created in Step 1.
3. Define your Elysia route instance (e.g., `export const usersRoute = new Elysia();`).
4. Add a `GET` endpoint for `/api/user` using `.get("/api/user", async ({ headers, set }) => { ... })`.
5. **Extract the token:**
   - Retrieve the `Authorization` header (`headers.authorization`).
   - Check if it exists and starts with `"Bearer "`. If not, set the response status to `401` (`set.status = 401`) and return `{ error: "Unauthorized" }`.
   - Strip the `"Bearer "` prefix from the header value to extract the actual token string.
6. **Call the Service:**
   - Inside a `try...catch` block, call `getUserByToken(token)`.
   - If successful, return the success response structure: `{ data: user }`.
   - In the `catch` block, check if the error message is `"Unauthorized"`. If so, set `set.status = 401` and return `{ error: "Unauthorized" }`. 

### Step 3: Register the Route
**Target File:** `src/index.ts`

1. If `users-route.ts` is newly created and not yet registered, import it into your main app entry point (`src/index.ts`).
2. Attach it to your main Elysia app using `.use(usersRoute)`.

### Step 4: Write Unit Tests (Highly Recommended)
**Target File:** `src/services/users-services.test.ts`

1. Add a test case for `getUserByToken` testing a valid token, expecting it to return the user data.
2. Add a test case for `getUserByToken` using an invalid token, expecting it to reject and throw the "Unauthorized" error.
