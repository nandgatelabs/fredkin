/** Routes that belong under the More flow (highlight header control). */
export const MORE_PATHS = [
  "/more",
  "/accounts",
  "/categories",
  "/budgets",
  "/preferences",
  "/data",
  "/help",
  "/reset",
  "/backup",
  "/export-csv",
  "/import-csv",
  "/about-doc",
] as const;

/**
 * Stack screens opened from the native More drawer (not tab destinations).
 * Back from the root of this stack should reopen the drawer.
 */
export const MORE_STACK_PATHS = [
  "/preferences",
  "/data",
  "/help",
  "/reset",
  "/backup",
  "/export-csv",
  "/import-csv",
  "/about-doc",
] as const;

export function isMorePath(pathname: string): boolean {
  return MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isMoreStackPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "";
  return MORE_STACK_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
