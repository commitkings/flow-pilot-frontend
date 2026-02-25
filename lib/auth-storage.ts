export type StoredUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessName: string;
  verified: boolean;
  onboarded: boolean;
};

const USERS_KEY = "flowpilot_users";
const CURRENT_USER_KEY = "flowpilot_current_user";
const PENDING_EMAIL_KEY = "flowpilot_pending_verification_email";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getUsers(): StoredUser[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

export function saveUsers(users: StoredUser[]) {
  if (!isBrowser()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return getUsers().find((user) => user.email.toLowerCase() === normalized);
}

export function upsertUser(next: StoredUser) {
  const users = getUsers();
  const index = users.findIndex(
    (user) => user.email.toLowerCase() === next.email.toLowerCase()
  );

  if (index >= 0) {
    users[index] = next;
  } else {
    users.push(next);
  }

  saveUsers(users);
}

export function setCurrentUserEmail(email: string) {
  if (!isBrowser()) return;
  localStorage.setItem(CURRENT_USER_KEY, email.trim().toLowerCase());
}

export function getCurrentUserEmail() {
  if (!isBrowser()) return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function clearCurrentUserEmail() {
  if (!isBrowser()) return;
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser() {
  const email = getCurrentUserEmail();
  if (!email) return null;
  return findUserByEmail(email) ?? null;
}

export function setPendingVerificationEmail(email: string) {
  if (!isBrowser()) return;
  localStorage.setItem(PENDING_EMAIL_KEY, email.trim().toLowerCase());
}

export function getPendingVerificationEmail() {
  if (!isBrowser()) return null;
  return localStorage.getItem(PENDING_EMAIL_KEY);
}

export function clearPendingVerificationEmail() {
  if (!isBrowser()) return;
  localStorage.removeItem(PENDING_EMAIL_KEY);
}
