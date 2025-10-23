
export const SECONDS_IN_A_DAY = 86400

export function timestampDays (days: number): number {
  return SECONDS_IN_A_DAY * 1000 * days
}

export function formatDate (date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function timestampDate (timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
