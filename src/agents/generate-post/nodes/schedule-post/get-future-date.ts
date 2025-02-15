import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Calculates a future date by adding seconds to a base date and formats it as MM/DD HH:MM AM/PM PST
 * @param afterSeconds - Number of seconds to add to the base date
 * @returns string representing the future date in format MM/DD HH:MM AM/PM PST
 */
export function getFutureDate(afterSeconds: number): string {
  const baseDate = new Date();
  const futureDate = new Date(baseDate.getTime() + afterSeconds * 1000);

  // Convert to PST
  const pstDate = toZonedTime(futureDate, "America/Los_Angeles");

  // Format the date
  return format(pstDate, "MM/dd hh:mm a").toUpperCase() + " PST";
}
