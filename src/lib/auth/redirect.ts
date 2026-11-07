// Only allow same-site relative redirects (prevents open redirects).
export function safeNext(next: unknown): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/dashboard";
}
