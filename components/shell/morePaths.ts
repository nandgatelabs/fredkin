/** Routes that belong under the More drawer (highlight edge / header control). */
export const MORE_PATHS = [
  "/accounts",
  "/categories",
  "/budgets",
  "/preferences",
  "/data",
  "/help",
  "/reset",
] as const;

export function isMorePath(pathname: string): boolean {
  return MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
