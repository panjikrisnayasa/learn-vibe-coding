# Feature: User Logout API

## Overview
Create an API endpoint to log out the currently authenticated user. When a user logs out successfully, their session token must be deleted from the database.

**Endpoint:** `DELETE /api/user/logout`

**Request Header Example:**
```json
{
    "Authorization": "Bearer <token>"
}
```

**Response Success Example:**
```json
{
    "data": "OK"
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

1. Create and export a new asynchronous function: `export const logoutUser = async (token: string) => { ... }`.
2. Inside this function, verify if the session exists in the database.
   - Use Drizzle ORM to check the `sessions` table: `await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);`
3. If the query returns no result (the token is invalid or already deleted), throw an error: `throw new Error("Unauthorized");`.
4. If the session is found, delete it from the database:
   - `await db.delete(sessions).where(eq(sessions.token, token));`

### Step 2: Implement the API Route (ElysiaJS)
**Target File:** `src/routes/users-route.ts`

1. Import the `logoutUser` service you created in Step 1.
2. In your existing `usersRoute` Elysia instance, add a new `DELETE` endpoint using `.delete("/api/user/logout", async ({ headers, set }) => { ... })`.
3. **Extract the token:**
   - Retrieve the `Authorization` header (`headers.authorization`).
   - Check if the header exists and starts with `"Bearer "`. If not, set the response status to `401` (`set.status = 401`) and return `{ error: "Unauthorized" }`.
   - Strip the `"Bearer "` prefix from the header value to extract the token string (e.g., using `.substring(7)`).
4. **Call the Service:**
   - Inside a `try...catch` block, call `await logoutUser(token)`.
   - If the call succeeds, return the success response: `{ data: "OK" }`.
   - In the `catch` block, check if the error message is `"Unauthorized"`. If so, set `set.status = 401` and return `{ error: "Unauthorized" }`. 
   - If it's a different error, you can return a 500 status code.

### Step 3: Write Unit and Integration Tests (Highly Recommended)
**Target Files:** `src/services/users-services.test.ts` and `src/routes/users-route.test.ts`

1. **Service Tests:** Add a test case for `logoutUser` that provides a valid token and verifies the session is deleted from the DB. Add another test case expecting it to throw `"Unauthorized"` for an invalid token.
2. **Integration Tests:** Add an HTTP test calling `DELETE /api/user/logout` with a valid token (expecting a 200 OK) and another with an invalid/missing token (expecting a 401 Unauthorized).
