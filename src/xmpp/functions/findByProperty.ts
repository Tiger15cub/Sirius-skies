export function findByProperty<T>(
  iterable: Iterable<T>,
  property: keyof T,
  value: any
): T | undefined {
  for (const element of iterable) {
    if (element[property] === value) {
      return element;
    }
  }
  return undefined;
}
