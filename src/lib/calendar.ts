/**
 * Dates and calendars for invented worlds.
 *
 * Writing dates in your Markdown files
 *   date: "412"          the year 412
 *   date: "-80"          80 years before your calendar's year 1
 *   date: "412-03"       third month of 412
 *   date: "412-03-14"    14th day of the third month of 412
 *   date: "~300"         about the year 300
 * There is no year zero: year -1 is followed by year 1.
 *
 * How they are shown comes from `calendar` in world/world.yml:
 * the labels for years before and after year 1, whether the label goes before
 * or after the number ("TA 3019" or "3019 AS"), and your own month names.
 */

export type Precision = "day" | "month" | "year" | "approximate";

export interface WorldDate {
  year: number;
  month: number | null;
  day: number | null;
  precision: Precision;
}

export interface Calendar {
  /** Label for year 1 onwards, e.g. "AS" (After the Sundering). Empty for none. */
  after: string;
  /** Label for years before year 1, e.g. "BS". Empty for "-80". */
  before: string;
  position: "suffix" | "prefix";
  months: string[];
}

export const DEFAULT_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const defaultCalendar: Calendar = { after: "", before: "BCE", position: "suffix", months: DEFAULT_MONTHS };

export function parseDate(input: string | number, cal: Calendar = defaultCalendar): WorldDate {
  const s = String(input).trim();
  const approx = s.startsWith("~");
  const m = /^(-?\d+)(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(approx ? s.slice(1) : s);
  if (!m) throw new Error(`"${input}" is not a date. Write it like "412", "-80", "412-03", "412-03-14" or "~300".`);
  const year = Number(m[1]);
  if (year === 0) throw new Error(`There is no year zero ("${input}"). Year -1 is followed by year 1.`);
  const month = m[2] ? Number(m[2]) : null;
  const day = m[3] ? Number(m[3]) : null;
  if (approx && (month || day)) throw new Error(`"${input}": an approximate date ("~") can only be a year.`);
  if (month !== null && (month < 1 || month > cal.months.length))
    throw new Error(`"${input}": month ${month} doesn't exist. Your calendar has ${cal.months.length} months.`);
  if (day !== null && (day < 1 || day > 60)) throw new Error(`"${input}": day ${day} is out of range.`);
  return { year, month, day, precision: approx ? "approximate" : day ? "day" : month ? "month" : "year" };
}

/** A number that sorts dates in order: 412-03-14 comes after 412-03 and before 413. */
export function sortKey(d: WorldDate, cal: Calendar = defaultCalendar): number {
  const months = cal.months.length || 12;
  const m = (d.month ?? 1) - 1;
  const day = (d.day ?? 1) - 1;
  // year -1 sits directly before year 1 on the axis
  const y = d.year > 0 ? d.year - 1 : d.year;
  return y + (m + day / 61) / months;
}

/** Position of a year on a continuous axis (no gap where year zero would be). */
export const axisYear = (year: number) => (year > 0 ? year - 1 : year);
export const yearFromAxis = (a: number) => {
  const f = Math.floor(a);
  return f >= 0 ? f + 1 : f;
};

export function formatYear(year: number, cal: Calendar = defaultCalendar): string {
  const n = Math.abs(year);
  const label = year < 0 ? cal.before : cal.after;
  if (!label) return year < 0 ? `−${n}` : `${n}`;
  return cal.position === "prefix" ? `${label} ${n}` : `${n} ${label}`;
}

export function formatDate(d: WorldDate, cal: Calendar = defaultCalendar): string {
  const y = formatYear(d.year, cal);
  const month = d.month ? cal.months[d.month - 1] : null;
  switch (d.precision) {
    case "day":
      return `${d.day} ${month} ${y}`;
    case "month":
      return `${month} ${y}`;
    case "approximate":
      return `c. ${y}`;
    default:
      return y;
  }
}

/** "14 Thaw – 2 Seedfall 412 AS", "c. 300 – 412 AS", "80 BS – 3 AS". */
export function formatRange(start: WorldDate, end: WorldDate | null | undefined, cal: Calendar = defaultCalendar): string {
  if (!end) return formatDate(start, cal);
  if (start.year === end.year && start.precision === "day" && end.precision === "day" && start.month === end.month)
    return `${start.day}–${end.day} ${cal.months[start.month! - 1]} ${formatYear(start.year, cal)}`;
  if (start.year === end.year && start.month && end.month) {
    const a = start.day ? `${start.day} ${cal.months[start.month - 1]}` : cal.months[start.month - 1];
    const b = end.day ? `${end.day} ${cal.months[end.month - 1]}` : cal.months[end.month - 1];
    return `${a} – ${b} ${formatYear(start.year, cal)}`;
  }
  if (start.year === end.year) return formatDate(start, cal);
  // Drop the repeated era label when both ends share it: "412–420 AS"
  const sameSide = (start.year < 0) === (end.year < 0);
  const yearsOnly = (start.precision === "year" || start.precision === "approximate") && (end.precision === "year" || end.precision === "approximate");
  if (sameSide && yearsOnly && cal.position === "suffix") {
    const label = start.year < 0 ? cal.before : cal.after;
    const a = `${start.precision === "approximate" ? "c. " : ""}${Math.abs(start.year)}`;
    const b = `${end.precision === "approximate" ? "c. " : ""}${Math.abs(end.year)}`;
    return label ? `${a}–${b} ${label}` : `${formatYear(start.year, cal)}–${Math.abs(end.year)}`;
  }
  return `${formatDate(start, cal)} – ${formatDate(end, cal)}`;
}

/** Short label for cards: years only. */
export function yearLabel(start: WorldDate, end: WorldDate | null | undefined, cal: Calendar = defaultCalendar): string {
  const s = { ...start, month: null, day: null, precision: start.precision === "approximate" ? "approximate" : "year" } as WorldDate;
  const e = end ? ({ ...end, month: null, day: null, precision: end.precision === "approximate" ? "approximate" : "year" } as WorldDate) : null;
  return formatRange(s, e && e.year !== s.year ? e : null, cal);
}

/**
 * Reads a year typed into search or the timeline's "go to year" box:
 * "412", "-80", "80 BS", "AS 412", "TA 3019".
 */
export function parseYearQuery(raw: string, cal: Calendar = defaultCalendar): number | null {
  const q = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const esc = (s: string) => s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let m = /^(-|−)?(\d{1,6})$/.exec(q);
  if (m) return Number(m[2]) * (m[1] ? -1 : 1) || null;
  for (const [label, sign] of [[cal.before, -1], [cal.after, 1]] as const) {
    if (!label) continue;
    const l = esc(label);
    m = new RegExp(`^(?:${l} ?(\\d{1,6})|(\\d{1,6}) ?${l})$`).exec(q);
    if (m) return Number(m[1] ?? m[2]) * sign || null;
  }
  return null;
}
