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

export function isMorePath(pathname: string): boolean {
  return MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
