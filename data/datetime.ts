export function formatDayLabel(key: string) {
  const date = fromDateKey(key);
  if (key === todayKey()) return "Today";
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
