import { format } from 'date-fns';

/** Project-wide date display format, e.g. "1st Sep 2025". */
export function formatDate(date: Date) {
  return format(date, 'do MMM yyyy');
}

/** Compact date for dense rows and metadata, e.g. "1 Sep". */
export function formatShortDate(date: Date) {
  return format(date, 'd MMM');
}

/** Weekday label for timeline rows, e.g. "Mon". */
export function formatWeekday(date: Date) {
  return format(date, 'EEE');
}

/** Time of day for a logged workout, e.g. "18:30". */
export function formatTime(date: Date) {
  return format(date, 'HH:mm');
}

/** Tonnage rounded to whole kilograms with thousands separators, e.g. "12,480". */
export function formatVolume(kg: number) {
  return Math.round(kg).toLocaleString('en-GB');
}

/** A logged weight, dropping trailing zeros: "60", "62.5", "Bodyweight" at 0. */
export function formatWeight(kg: number) {
  return kg === 0 ? 'Bodyweight' : `${Number(kg.toFixed(2))} kg`;
}
