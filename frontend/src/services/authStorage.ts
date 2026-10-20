const tokenKey = "secct_token";

/** The login flow stores the JWT here; the batch requests read it. */
export function getToken(): string | null {
  return localStorage.getItem(tokenKey);
}

export function saveToken(token: string): void {
  localStorage.setItem(tokenKey, token);
}

export function clearToken(): void {
  localStorage.removeItem(tokenKey);
}
