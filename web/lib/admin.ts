// Add the email(s) that should have admin panel access.
// This MUST match the list in firestore.rules (isAdmin() function) —
// this file only gates the UI; the rules file is what actually enforces it.
export const ADMIN_EMAILS = ["youradmin@example.com"];

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email);
}
