import {
  it,
  expect,
  describe,
  beforeEach,
} from 'vitest'

import {
  clamp,
  decimalRound,
} from '../utils/math'

import {
  AUTH_COOKIE_NAME,
  TALHO_SESSION_HEADER_NAME,
  TALHO_SESSION_COOKIE_NAME,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  EMPTY_STRING,
} from '../utils/consts'

describe('[clamp]', () => {
  it('retorna o valor quando ele está dentro do intervalo', () => {
    expect(clamp(0, 10, 5)).toBe(5)
  })

  it('retorna o valor mínimo quando value é menor que min', () => {
    expect(clamp(10, 20, 5)).toBe(10)
  })

  it('retorna o valor máximo quando value é maior que max', () => {
    expect(clamp(10, 20, 25)).toBe(20)
  })

  it('funciona quando value é exatamente o valor mínimo', () => {
    expect(clamp(10, 20, 10)).toBe(10)
  })

  it('funciona quando value é exatamente o valor máximo', () => {
    expect(clamp(10, 20, 20)).toBe(20)
  })

  it('funciona com valores negativos', () => {
    expect(clamp(-10, -2, -5)).toBe(-5)
  })

  it('retorna min quando max < min (Math.min/max comportamento nativo)', () => {
    // comportamento: Math.min(max, value) recebe max < min
    expect(clamp(10, 5, 7)).toBe(10)
  })

  it('funciona com valores decimais', () => {
    expect(clamp(0.5, 2.5, 1.2)).toBe(1.2)
  })

  it('arredonda corretamente dentro da lógica (não altera decimais)', () => {
    expect(clamp(1.1, 1.9, 1.5)).toBe(1.5)
  })
})

describe('[decimalRound]', () => {
  it('arredonda corretamente sem casas decimais (default)', () => {
    expect(decimalRound(1.2)).toBe(1)
    expect(decimalRound(1.5)).toBe(2)
    expect(decimalRound(1.7)).toBe(2)
  })

  it('arredonda corretamente com casas decimais específicas', () => {
    expect(decimalRound(1.2345, 2)).toBe(1.23)
    expect(decimalRound(1.2355, 2)).toBe(1.24)
    expect(decimalRound(1.2399, 2)).toBe(1.24)
  })

  it('arredonda números negativos corretamente', () => {
    expect(decimalRound(-1.234, 2)).toBe(-1.23)
    expect(decimalRound(-1.235, 2)).toBe(-1.24)
  })

  it('funciona com valores inteiros independentemente da precisão', () => {
    expect(decimalRound(10, 2)).toBe(10)
    expect(decimalRound(10, 5)).toBe(10)
  })

  it('arredonda corretamente quando decimalCount é zero', () => {
    expect(decimalRound(12.9, 0)).toBe(13)
    expect(decimalRound(12.1, 0)).toBe(12)
  })

  it('aceita decimalCount grande (precisão alta)', () => {
    expect(decimalRound(1.23456789, 6)).toBe(1.234568)
  })

  it('arredonda corretamente valores muito pequenos', () => {
    expect(decimalRound(0.00049, 3)).toBe(0)
    expect(decimalRound(0.00051, 3)).toBe(0.001)
  })

  it('retorna o próprio valor quando decimalCount é negativo (Math.pow aceita)', () => {
    // Math.pow(10, -2) = 0.01 →  value * 0.01 → round → / 0.01
    expect(decimalRound(1200, -2)).toBe(1200)
  })
})

describe('[buildRequestOptions]', () => {
  beforeEach(() => {
    // reset cookies para cada teste
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      writable: true,
      value: EMPTY_STRING,
    })
  })

  it('retorna método padrão como GET', () => {
    const result = buildRequestOptions()

    expect(result.method).toBe('GET')
  })

  it('define Accept e Content-Type como application/json', () => {
    const result = buildRequestOptions()

    const headers = result.headers as Headers

    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('sobrescreve cabeçalhos quando passados no array', () => {
    const result = buildRequestOptions([
      ['Content-Type', 'text/plain'],
      ['Accept', 'foo/bar']
    ])

    const headers = result.headers as Headers

    expect(headers.get('Content-Type')).toBe('text/plain')
    expect(headers.get('Accept')).toBe('foo/bar')
  })

  it('anexa o cookie de sessão quando presente', () => {
    document.cookie = `${TALHO_SESSION_COOKIE_NAME}=abc123`

    const result = buildRequestOptions()
    const headers = result.headers as Headers

    expect(headers.get(TALHO_SESSION_HEADER_NAME)).toBe('abc123')
  })

  it('não adiciona o header de sessão se o cookie não existir', () => {
    const result = buildRequestOptions()
    const headers = result.headers as Headers

    expect(headers.get(TALHO_SESSION_HEADER_NAME)).toBeNull()
  })

  it('anexa o authorization cookie quando presente', () => {
    document.cookie = `${AUTH_COOKIE_NAME}=token789`

    const result = buildRequestOptions()
    const headers = result.headers as Headers

    expect(headers.get('Authorization')).toBe('token789')
  })

  it('não adiciona Authorization quando cookie não existir', () => {
    const result = buildRequestOptions()
    const headers = result.headers as Headers

    expect(headers.get('Authorization')).toBeNull()
  })

  it('usa o método HTTP passado como parâmetro', () => {
    const result = buildRequestOptions([], 'POST')

    expect(result.method).toBe('POST')
  })

  it('preserva a ordem de precedence: cookies sobrescrevem headers manuais', () => {
    document.cookie = `${AUTH_COOKIE_NAME}=cookieValue`

    const result = buildRequestOptions([
      ['Authorization', 'manualValue']
    ])

    const headers = result.headers as Headers

    expect(headers.get('Authorization')).toBe('cookieValue') // cookie > manual
  })
})
