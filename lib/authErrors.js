// Shared auth error codes. Kept in their own module (no server-only imports) so
// both the server (lib/auth.js) and client (login page) can reference the same
// string without the client bundling server code.

// Thrown by authorize() when no account exists for the given email, so the login
// page can route the user to register (instead of the generic credentials error).
export const NO_ACCOUNT_ERROR = "NO_ACCOUNT";
