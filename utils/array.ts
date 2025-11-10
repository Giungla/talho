
export function pushIf <T extends any> (condition: any, list: T[], value: T) {
  if (!condition) return -1

  return list.push(value)
}

export function includes <T> (
  source: T[] | string,
  search: T extends string ? string : T
): boolean {
  return source.includes(search as any)
}

export function isEquals (valueA: unknown, valueB: unknown): boolean {
  return valueA == valueB
}

export function isStrictEquals (valueA: unknown, valueB: unknown): boolean {
  return valueA === valueB
}
