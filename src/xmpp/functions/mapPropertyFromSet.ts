export function mapPropertyFromSet<T, K extends keyof T>(
  set: Set<T>,
  property: K
): Array<T[K]> {
  return Array.from(set).map((element) => element[property]);
}