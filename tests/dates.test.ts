import {
  it,
  vi,
  expect,
  describe,
  afterAll,
  beforeAll,
  afterEach,
  beforeEach,
} from 'vitest'

import {
  SECONDS_IN_A_DAY,
  formatDate,
  timestampDays,
  timestampDate,
} from '../utils/dates'

describe('[timestampDays]', () => {
  it('retorna o timestamp correto para 1 dia', () => {
    expect(timestampDays(1)).toBe(SECONDS_IN_A_DAY * 1000)
  })

  it('retorna o timestamp correto para múltiplos dias', () => {
    expect(timestampDays(5)).toBe(SECONDS_IN_A_DAY * 1000 * 5)
  })

  it('retorna 0 quando days = 0', () => {
    expect(timestampDays(0)).toBe(0)
  })

  it('retorna valor negativo quando days é negativo', () => {
    expect(timestampDays(-3)).toBe(SECONDS_IN_A_DAY * 1000 * -3)
  })

  it('funciona com números decimais', () => {
    expect(timestampDays(1.5)).toBe(SECONDS_IN_A_DAY * 1000 * 1.5)
  })
})

describe('[formatDate]', () => {
  let originalTZ: string | undefined

  beforeAll(() => {
    // Força timezone consistente
    originalTZ = process.env.TZ
    process.env.TZ = 'UTC'
  })

  afterAll(() => {
    process.env.TZ = originalTZ
  })

  it('formata uma data válida corretamente no padrão pt-BR', () => {
    const result = formatDate('2023-02-01')
    expect(result).toBe('01/02/23')
  })

  it('funciona com datas contendo horário', () => {
    const result = formatDate('2023-12-25T15:30:00Z')
    expect(result).toBe('25/12/23')
  })

  it('funciona com datas no formato YYYY/MM/DD', () => {
    const result = formatDate('2023/08/10')
    expect(result).toBe('10/08/23')
  })

  it('retorna "Invalid Date" formatado quando a data é inválida', () => {
    // new Date('invalid') retorna "Invalid Date"
    const result = formatDate('invalid-date')

    // toLocaleDateString tenta formatar, mas browsers/JS tendem a cuspir "Invalid Date"
    expect(result).toBe('Invalid Date')
  })

  it('formata corretamente datas com ano de 4 dígitos para ano de 2 dígitos', () => {
    const result = formatDate('1999-01-01')
    expect(result).toBe('01/01/99')
  })

  it('não altera o fuso do valor, apenas formata', () => {
    const result = formatDate('2023-10-05T23:59:59Z')
    // Em UTC não vira dia seguinte
    expect(result).toBe('05/10/23')
  })

  it('formata corretamente datas com meses/dias de 1 dígito', () => {
    const result = formatDate('2023-5-9')
    expect(result).toBe('09/05/23')
  })
})

describe('[timestampDate]', () => {
  beforeEach(() => {
    // Congela o fuso/hora local para evitar variações entre máquinas
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // it('formata corretamente um timestamp conhecido', () => {
  //   // 2023-03-01 15:30:45 UTC
  //   const ts = Date.UTC(2023, 2, 1, 15, 30, 45)
  //
  //   const result = timestampDate(ts)
  //
  //   // O locale "pt-BR" retorna no formato: dd/mm/yy, hh:mm:ss
  //   // Dependendo do fuso, ajustar ao esperado local:
  //   // UTC 2023-03-01 15:30:45 → Brasil (UTC-3): 01/03/23, 12:30:45
  //   expect(result).toBe('01/03/23, 12:30:45')
  // })

  // it('formata corretamente timestamp zero (Unix epoch)', () => {
  //   // 1970-01-01 UTC → Brasil ainda em 1969 dependendo do fuso (UTC-3)
  //   const ts = 0
  //
  //   const result = timestampDate(ts)
  //
  //   // Brasil (UTC-3): 31/12/69, 21:00:00
  //   expect(result).toBe('31/12/69, 21:00:00')
  // })

  // it('formata corretamente valores grandes (ano futuro)', () => {
  //   const future = Date.UTC(2050, 5, 10, 8, 10, 5)
  //
  //   const result = timestampDate(future)
  //
  //   // UTC → Brasil (UTC-3): 10/06/50, 05:10:05
  //   expect(result).toBe('10/06/50, 05:10:05')
  // })

  it('aceita timestamps numéricos extremos (Number.MAX_SAFE_INTEGER dentro do range de Date)', () => {
    const ts = 8640000000000000 - 1 // limite máximo aceitável pelo Date

    const result = timestampDate(ts)

    expect(typeof result).toBe('string')
  })
})
