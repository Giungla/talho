import {
  it,
  vi,
  expect,
  describe,
} from 'vitest'

import {
  isCPFValid,
  isDateValid,
  textTestRegex,
  validatePasswordParts,
} from '../utils/validation'

describe('[textTestRegex]', () => {
  it('retorna uma função', () => {
    const fn = textTestRegex('hello')

    expect(typeof fn).toBe('function')
  })

  it('retorna true quando o regex casa com o texto', () => {
    const matcher = textTestRegex('banana')

    expect(matcher(/ana/)).toBe(true)
  })

  it('retorna false quando o regex não casa com o texto', () => {
    const matcher = textTestRegex('banana')

    expect(matcher(/xyz/)).toBe(false)
  })

  it('funciona com regex case-insensitive', () => {
    const matcher = textTestRegex('VueJs')

    const result = matcher(/vuejs/i)

    expect(result).toBe(true)
  })

  it('funciona com regex que não possui correspondência', () => {
    const matcher = textTestRegex('test')

    expect(matcher(/123/)).toBe(false)
  })

  it('suporta caracteres especiais no regex', () => {
    const matcher = textTestRegex('hello-world')

    expect(matcher(/hello\-world/)).toBe(true)
  })
})

describe('[validatePasswordParts]', () => {
  it('detecta corretamente cada parte da senha', () => {
    const result = validatePasswordParts('Aa1!abcd')

    expect(result).toEqual({
      hasNumber: true,
      hasLowercase: true,
      hasUppercase: true,
      hasMinLength: true,
      hasSpecialChar: true,
    })
  })

  it('retorna false para todas as verificações quando a senha é vazia', () => {
    const result = validatePasswordParts('')

    expect(result).toEqual({
      hasNumber: false,
      hasLowercase: false,
      hasUppercase: false,
      hasMinLength: false,
      hasSpecialChar: false,
    })
  })

  it('detecta ausência de números', () => {
    const result = validatePasswordParts('Abcdef!@#')

    expect(result.hasNumber).toBe(false)
  })

  it('detecta ausência de minúsculas', () => {
    const result = validatePasswordParts('ABC123!@#')

    expect(result.hasLowercase).toBe(false)
  })

  it('detecta ausência de maiúsculas', () => {
    const result = validatePasswordParts('abc123!@#')

    expect(result.hasUppercase).toBe(false)
  })

  it('detecta ausência de especiais', () => {
    const result = validatePasswordParts('Aa123456')

    expect(result.hasSpecialChar).toBe(false)
  })

  it('detecta ausência de tamanho mínimo', () => {
    const result = validatePasswordParts('Aa1!a')

    expect(result.hasMinLength).toBe(false)
  })

  it('funciona corretamente quando há apenas um tipo de caractere', () => {
    const result = validatePasswordParts('aaaaaaaa')

    expect(result).toEqual({
      hasNumber: false,
      hasLowercase: true,
      hasUppercase: false,
      hasMinLength: true,
      hasSpecialChar: false,
    })
  })

  it('funciona com senhas contendo apenas números', () => {
    const result = validatePasswordParts('12345678')

    expect(result).toEqual({
      hasNumber: true,
      hasLowercase: false,
      hasUppercase: false,
      hasMinLength: true,
      hasSpecialChar: false,
    })
  })
})

describe('[isCPFValid]', () => {
  // CPFs válidos (comuns em exemplos públicos)
  const validCpfs = [
    '52998224725',
    '16899535009',
    '98765432100',
    '11144477735',
    '93541134780',
  ]

  validCpfs.forEach(cpf => {
    it(`retorna true para CPF válido: ${cpf}`, () => {
      expect(isCPFValid(cpf)).toBe(true)
    })
  })

  // CPFs válidos com máscara
  const validMaskedCpfs = [
    '529.982.247-25',
    '168.995.350-09',
    '987.654.321-00',
  ]

  validMaskedCpfs.forEach(cpf => {
    it(`retorna true para CPF válido com máscara: ${cpf}`, () => {
      expect(isCPFValid(cpf)).toBe(true)
    })
  })

  it('retorna false para CPFs com caracteres inválidos', () => {
    expect(isCPFValid('111.444.777-3X')).toBe(false)
    expect(isCPFValid('ABC.DEF.GHI-JK')).toBe(false)
  })

  it('retorna false para CPF com tamanho menor que 11', () => {
    expect(isCPFValid('123')).toBe(false)
  })

  it('retorna false para CPF com tamanho maior que 11', () => {
    expect(isCPFValid('1234567890123')).toBe(false)
  })

  it('retorna false quando todos os dígitos são iguais', () => {
    const repeatedCpfs = [
      '00000000000',
      '11111111111',
      '22222222222',
      '33333333333',
      '44444444444',
      '55555555555',
      '66666666666',
      '77777777777',
      '88888888888',
      '99999999999',
    ]

    repeatedCpfs.forEach(cpf => {
      expect(isCPFValid(cpf)).toBe(false)
    })
  })

  it('retorna false para CPF com dígitos verificadores incorretos', () => {
    // Troca os últimos 2 dígitos de um CPF válido
    expect(isCPFValid('52998224799')).toBe(false)
    expect(isCPFValid('16899535000')).toBe(false)
  })

  it('retorna false para CPF parcialmente válido mas com DV errado', () => {
    expect(isCPFValid('52998224721')).toBe(false)
    expect(isCPFValid('11144477730')).toBe(false)
  })

  it('retorna true para entradas com espaços extras', () => {
    expect(isCPFValid(' 52998224725 ')).toBe(true)
  })

  it('retorna false para strings vazias', () => {
    expect(isCPFValid('')).toBe(false)
  })

  it('retorna false para valor não numérico após numberOnly', () => {
    expect(isCPFValid('xxxxx')).toBe(false)
  })

  it('valida corretamente a lógica dos dígitos verificadores', () => {
    const cpf = '11144477735' // válido

    expect(isCPFValid(cpf)).toBe(true)

    // Removendo só o último dígito verificador
    expect(isCPFValid('11144477730')).toBe(false)

    // Alterando apenas o penúltimo DV
    expect(isCPFValid('11144477715')).toBe(false)
  })
})

describe('[isDateValid]', () => {
  it('retorna true para uma data válida', () => {
    expect(isDateValid('20/12/2023')).toBe(true)
    expect(isDateValid('01/01/2000')).toBe(true)
    expect(isDateValid('29/02/2020')).toBe(true) // ano bissexto
  })

  it('retorna false para datas impossíveis', () => {
    expect(isDateValid('31/02/2023')).toBe(false)
    expect(isDateValid('32/01/2023')).toBe(false)
    expect(isDateValid('00/01/2023')).toBe(false)
    expect(isDateValid('15/13/2023')).toBe(false)
  })

  it('retorna false quando o formato não possui 3 partes', () => {
    expect(isDateValid('2023/01')).toBe(false)
    expect(isDateValid('2023')).toBe(false)
    expect(isDateValid('')).toBe(false)
  })

  it('retorna false para valores totalmente inválidos', () => {
    expect(isDateValid('abc/def/ghi')).toBe(false)
    expect(isDateValid('!!/??/@@@@')).toBe(false)
  })

  it('retorna false para anos inválidos', () => {
    expect(isDateValid('10/10/abcd')).toBe(false)
    expect(isDateValid('10/10/-200')).toBe(false)
  })

  it('retorna false quando a data montada é "Invalid Date"', () => {
    // Isso cobre qualquer caso estranho que ainda gere uma string inválida
    expect(isDateValid('99/99/9999')).toBe(false)
  })
})
