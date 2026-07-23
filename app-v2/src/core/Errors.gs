/**
 * Errors.gs — error codes + AppError (see docs-v2/05 §Errors).
 */
const ERR = {
  INTERNAL: 'E_INTERNAL',
  VALIDATION: 'E_VALIDATION',
  NOT_FOUND: 'E_NOT_FOUND',
  UNAUTHORIZED: 'E_UNAUTHORIZED',
  FORBIDDEN: 'E_FORBIDDEN',
  DUPLICATE: 'E_DUPLICATE',
  QUOTA: 'E_QUOTA'
};

/** Throwable application error carrying a code. */
function AppError(code, message) {
  const e = new Error(message || code);
  e.isAppError = true;
  e.code = code;
  return e;
}
