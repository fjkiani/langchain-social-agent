export function getUniqueArrayItems<T>(existing: T[], toAdd: T[]): T[] {
  const existingSet = new Set(existing);
  return toAdd.filter((item) => !existingSet.has(item));
}
