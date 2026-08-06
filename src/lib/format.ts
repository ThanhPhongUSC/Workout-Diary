import { format } from 'date-fns';

/** Project-wide date display format, e.g. "1st Sep 2025". */
export function formatDate(date: Date) {
  return format(date, 'do MMM yyyy');
}

/** Time of day for a logged workout, e.g. "18:30". */
export function formatTime(date: Date) {
  return format(date, 'HH:mm');
}
