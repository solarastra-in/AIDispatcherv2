/**
 * src/server/businessException.ts
 *
 * Directly answers "if something is not configured or not configured
 * correctly, a business exception should be thrown and errors should
 * not be eaten." A concrete finding motivated this: server.ts's local-
 * proxy call path currently does `catch (proxyErr) { console.warn(...) }`
 * and silently falls through to a different execution path — the user
 * gets no indication their configured subscription proxy failed.
 *
 * This is the replacement pattern: a typed exception with a machine-
 * readable code (for the frontend to branch on) and a human-readable
 * message (safe to show directly to the user), thrown — never logged
 * and swallowed.
 */

export type BusinessExceptionCode =
  | "PROVIDER_NOT_CONFIGURED"
  | "LOCAL_PROXY_UNREACHABLE"
  | "SMTP_NOT_CONFIGURED"
  | "SMTP_NOT_VERIFIED"
  | "FIRESTORE_WRITE_FAILED"
  | "FIRESTORE_READ_FAILED"
  | "INVALID_CREDENTIAL_STATE";

export class BusinessException extends Error {
  code: BusinessExceptionCode;
  httpStatus: number;

  constructor(code: BusinessExceptionCode, message: string, httpStatus = 400) {
    super(message);
    this.name = "BusinessException";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * Express error-handling middleware — the one place BusinessException
 * gets translated into an HTTP response. Register this LAST, after all
 * routes: `app.use(businessExceptionHandler)`. Any BusinessException
 * thrown anywhere in a route handler (including inside an async handler
 * wrapped to forward to `next(err)`) lands here with its real code and
 * message intact — never collapsed into a generic 500.
 */
export function businessExceptionHandler(err: any, req: any, res: any, next: any) {
  if (err instanceof BusinessException) {
    return res.status(err.httpStatus).json({ error: err.message, code: err.code });
  }
  // Non-business errors (genuine bugs, unexpected exceptions) still get a
  // real response with the real message — never a swallowed silent 200,
  // and never a generic "something went wrong" that hides what happened.
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err?.message || "Internal server error", code: "UNHANDLED_ERROR" });
}
