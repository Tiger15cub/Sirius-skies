export function findInIterable<T>(
  iterable: Iterable<T>,
  predicate: (element: T) => boolean
): T | undefined {
  for (const element of iterable) {
    if (predicate(element)) {
      return element;
    }
  }
  return undefined;
}
