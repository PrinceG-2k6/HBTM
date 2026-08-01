/** Tiny className merger — avoids a clsx/tailwind-merge dependency */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
