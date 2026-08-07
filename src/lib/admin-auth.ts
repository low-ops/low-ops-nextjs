export function isAdminRole(role?: string | null): boolean {
  if (!role) {
    return false;
  }

  return role
    .split(",")
    .map((entry) => entry.trim())
    .includes("admin");
}
