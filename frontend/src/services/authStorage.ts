/**
 * Session storage management according to DC-HU2, DS-HU2-login, and DS-HU2-logout.
 */

const TOKEN_KEY = "secct_token";
const ROLE_KEY = "secct_role";
const EMAIL_KEY = "secct_email";
const USER_ID_KEY = "secct_user_id";

export interface AuthSession {
  accessToken: string;
  roleCode: string;
  email: string;
  id: number;
}

/**
 * Saves authenticated user session in localStorage (PL-2.12).
 */
export function saveSession(session: {
  accessToken: string;
  roleCode: string;
  email: string;
  id: number;
}): void {
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  localStorage.setItem(ROLE_KEY, session.roleCode);
  localStorage.setItem(EMAIL_KEY, session.email);
  localStorage.setItem(USER_ID_KEY, String(session.id));
}

/**
 * Convenience helper to save only the token.
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Retrieves the stored JWT token (PI-04).
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Retrieves the stored role code (PISCICULTOR / ADMINISTRADOR).
 */
export function getRoleCode(): string | null {
  return localStorage.getItem(ROLE_KEY);
}

/**
 * Retrieves the stored user email.
 */
export function getUserEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

/**
 * Retrieves the stored user ID.
 */
export function getUserId(): number | null {
  const raw = localStorage.getItem(USER_ID_KEY);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Retrieves full active session if present.
 */
export function getSession(): AuthSession | null {
  const token = getToken();
  if (!token) return null;
  return {
    accessToken: token,
    roleCode: getRoleCode() ?? "",
    email: getUserEmail() ?? "",
    id: getUserId() ?? 0,
  };
}

/**
 * Checks if a session is currently active.
 */
export function isAuthenticated(): boolean {
  return getToken() !== null && getToken() !== "";
}

/**
 * Explicit session removal function demanded by DC-HU2, DS-HU2-logout, and PL-2.23.
 */
export function removeLocalToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

/**
 * Backward compatibility alias for clearToken.
 */
export function clearToken(): void {
  removeLocalToken();
}
