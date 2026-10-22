export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const DAY = 86_400_000;
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** "sent today", "sent 3 days ago" */
export function sentLabel(iso: string, now = Date.now()): string {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  return days < 1 ? "sent today" : `sent ${plural(days, "day")} ago`;
}

/** "Joined today", "Joined 5 days ago", "Joined 3 weeks ago" */
export function joinedLabel(iso: string, now = Date.now()): string {
  const days = Math.floor((now - Date.parse(iso)) / DAY);
  if (days < 1) return "Joined today";
  return days < 14 ? `Joined ${plural(days, "day")} ago` : `Joined ${plural(Math.floor(days / 7), "week")} ago`;
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
