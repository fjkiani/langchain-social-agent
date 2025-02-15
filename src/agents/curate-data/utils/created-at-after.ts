/**
 * Returns true if the createdAt date is after a reference date
 * @param createdAt The createdAt date in ISO 8601 format
 * @param referenceDate The reference date to compare against
 * @returns true if the createdAt date is after a reference date, false otherwise
 */
export function createdAtAfter(createdAt: string, referenceDate: Date) {
  return new Date(createdAt).getTime() > referenceDate.getTime();
}
