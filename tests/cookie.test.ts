import {
  it,
  vi,
  expect,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest'

import {
  COOKIE_SEPARATOR,
  getCookie,
  setCookie,
  splitCookie,
} from '../utils/cookie'

describe('[getCookie]', () => {
  let originalCookieDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    if (!originalCookieDescriptor) {
      originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
    }

    // resetar cookies entre os testes
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    })
  })

  afterAll(() => {
    // restaura o comportamento original
    if (originalCookieDescriptor) {
      Object.defineProperty(Document.prototype, 'cookie', originalCookieDescriptor)
    }
  })

  it('retorna o valor de um cookie existente', () => {
    document.cookie = 'session=abc123'

    const result = getCookie('session')

    expect(result).toBe('abc123')
  })

  it('retorna false quando o cookie não existir', () => {
    document.cookie = 'session=abc123'

    const result = getCookie('token')

    expect(result).toBe(false)
  })

  it('funciona com múltiplos cookies', () => {
    document.cookie = 'a=1; b=2; c=3'

    expect(getCookie('a')).toBe('1')
    expect(getCookie('b')).toBe('2')
    expect(getCookie('c')).toBe('3')
  })

  it('não quebra com cookies com espaços extras', () => {
    document.cookie = 'a=1;   b=2;  c=3'

    expect(getCookie('b')).toBe('2')
  })

  it('retorna o valor correto mesmo quando existe um cookie com nome parecido', () => {
    document.cookie = 'id=123; user_id=456'

    expect(getCookie('id')).toBe('123')
    expect(getCookie('user_id')).toBe('456')
  })

  it('funciona com valores contendo caracteres especiais', () => {
    document.cookie = 'token=a-b_c.123~xyz'

    expect(getCookie('token')).toBe('a-b_c.123~xyz')
  })

  it('funciona com valores vazios', () => {
    document.cookie = 'empty='

    expect(getCookie('empty')).toBe('')
  })

  it('não lança erro com string vazia de cookies', () => {
    document.cookie = ''

    expect(getCookie('x')).toBe(false)
  })
})

describe('[splitCookie]', () => {
  it('divide um cookie simples em nome e valor', () => {
    const result = splitCookie('token=abc123')

    expect(result).toEqual({
      name: 'token',
      value: 'abc123'
    })
  })

  it('funciona quando o valor contém "=" (limite de 2 partes)', () => {
    const result = splitCookie('data=a=b=c')

    expect(result).toEqual({
      name: 'data',
      value: 'a=b=c'
    })
  })

  it('retorna value vazio se o cookie não tiver "="', () => {
    const result = splitCookie('sessionid')

    expect(result).toEqual({
      name: 'sessionid',
      value: false // o segundo item não existe
    })
  })

  it('retorna value vazio quando "=" está no final', () => {
    const result = splitCookie('user=')

    expect(result).toEqual({
      name: 'user',
      value: ''
    })
  })

  it('retorna name vazio quando "=" está no início', () => {
    const result = splitCookie('=value')

    expect(result).toEqual({
      name: '',
      value: 'value'
    })
  })

  it('mantém espaços e caracteres especiais', () => {
    const result = splitCookie('name=José Silva 123 @#!')

    expect(result).toEqual({
      name: 'name',
      value: 'José Silva 123 @#!'
    })
  })
})

describe('setCookie', () => {
  const originalCookie = global.document.cookie

  beforeAll(() => {
    // mock seguro para permitir escrita em document.cookie
    let cookieStore = ''
    vi.spyOn(document, 'cookie', 'set').mockImplementation((v: string) => {
      cookieStore = v
    })
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => cookieStore)
  })

  it('lança erro quando name é vazio', () => {
    expect(() => setCookie('', 'abc')).toThrow(
      "'setCookie' should receive a valid cookie name"
    )
  })

  it('lança erro quando value é vazio', () => {
    expect(() => setCookie('token', '')).toThrow(
      "'setCookie' should receive a valid cookie value"
    )
  })

  it('lança erro quando value NÃO é string | number | boolean', () => {
    // @ts-expect-error testando valor inválido
    expect(() => setCookie('token', {})).toThrow(
      "'setCookie' should receive a valid cookie value"
    )
  })

  it('cria cookie básico corretamente', () => {
    const result = setCookie('user', 'john')

    expect(result).toBe('user=john')
    expect(document.cookie).toBe('user=john')
  })

  it('cria cookie com valor numérico', () => {
    const result = setCookie('count', 10)

    expect(result).toBe('count=10')
  })

  it('cria cookie com valor booleano', () => {
    const result = setCookie('flag', true)

    expect(result).toBe('flag=true')
  })

  it('inclui expires quando fornecido', () => {
    const expires = new Date('2025-01-01T00:00:00Z')

    const result = setCookie('user', 'john', {
      expires
    })

    expect(result).toContain(`expires=${expires.toUTCString()}`)
  })

  it('inclui maxAge quando fornecido', () => {
    const result = setCookie('user', 'john', { maxAge: 3600 })

    expect(result).toContain('maxAge=3600')
  })

  it('inclui SameSite quando fornecido', () => {
    const result = setCookie('user', 'john', {
      sameSite: 'Strict'
    })

    expect(result).toContain('SameSite=Strict')
  })

  it('inclui path quando fornecido', () => {
    const result = setCookie('user', 'john', { path: '/' })

    expect(result).toContain('path=/')
  })

  it('inclui domain quando fornecido', () => {
    const result = setCookie('user', 'john', { domain: 'example.com' })

    expect(result).toContain('domain=example.com')
  })

  it('inclui HttpOnly quando fornecido', () => {
    const result = setCookie('user', 'john', { httpOnly: true })

    expect(result).toContain('HttpOnly')
  })

  it('inclui Secure quando fornecido', () => {
    const result = setCookie('user', 'john', { secure: true })

    expect(result).toContain('Secure')
  })

  it('monta a string completa com todas as opções', () => {
    const expires = new Date('2030-01-01T00:00:00Z')

    const result = setCookie('session', 'abc123', {
      expires,
      maxAge: 120,
      sameSite: 'Lax',
      path: '/',
      domain: 'site.com',
      httpOnly: true,
      secure: true,
    })

    expect(result).toBe(
      [
        'session=abc123',
        `expires=${expires.toUTCString()}`,
        'maxAge=120',
        'SameSite=Lax',
        'path=/',
        'domain=site.com',
        'HttpOnly',
        'Secure'
      ].join(COOKIE_SEPARATOR)
    )
  })

  it('escreve no document.cookie corretamente', () => {
    const result = setCookie('test', 'ok')

    expect(document.cookie).toBe(result)
  })
})
