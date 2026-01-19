
import {
  it,
  vi,
  expect,
  describe,
} from 'vitest'

import {
  pushIf,
  includes,
  isEquals,
  isStrictEquals,
} from '../utils/array'
import {EMPTY_STRING} from "../utils/consts";

describe('[pushIf]', () => {
  it('retorna -1 e não altera a lista quando a condição for falsy', () => {
    const list = [1, 2, 3]

    const result = pushIf(false, list, 999)

    expect(result).toBe(-1)
    expect(list).toEqual([1, 2, 3]) // lista permanece igual
  })

  it('adiciona o valor e retorna o novo tamanho quando a condição for truthy', () => {
    const list = [1, 2, 3]

    const result = pushIf(true, list, 999)

    expect(result).toBe(4)
    expect(list).toEqual([1, 2, 3, 999])
  })

  it('funciona com listas vazias', () => {
    const list: number[] = []

    const result = pushIf(true, list, 10)

    expect(result).toBe(1)
    expect(list).toEqual([10])
  })

  it('não empurra quando condition for undefined ou null', () => {
    const list = ['a']

    expect(pushIf(undefined, list, 'x')).toBe(-1)
    expect(pushIf(null, list, 'y')).toBe(-1)

    expect(list).toEqual(['a']) // nada foi adicionado
  })

  it('aceita qualquer tipo de valor para "value"', () => {
    const list: any[] = []

    pushIf(true, list, { id: 1 })
    pushIf(true, list, [1, 2])
    pushIf(true, list, 'text')
    pushIf(true, list, 123)
    pushIf(true, list, false)

    expect(list).toEqual([
      { id: 1 },
      [1, 2],
      'text',
      123,
      false
    ])
  })

  it('retorna -1 quando condition for 0 (falsy)', () => {
    const list: any[] = []

    const result = pushIf(0, list, 'x')

    expect(result).toBe(-1)
    expect(list).toEqual([])
  })

  it('adiciona valor quando condition for um número não-zero (truthy)', () => {
    const list: string[] = []

    const result = pushIf(5, list, 'ok')

    expect(result).toBe(1)
    expect(list).toEqual(['ok'])
  })
})

describe('[includes]', () => {
  it('retorna true quando o array contém o valor', () => {
    const result = includes([1, 2, 3], 2)
    expect(result).toBe(true)
  })

  it('retorna false quando o array não contém o valor', () => {
    const result = includes([1, 2, 3], 4)
    expect(result).toBe(false)
  })

  it('funciona com arrays de strings', () => {
    const result = includes(['a', 'b', 'c'], 'b')
    expect(result).toBe(true)
  })

  it('retorna false para tipo incompatível', () => {
    // @ts-expect-error forçando tipo incompatível só para testar runtime
    const result = includes(['1', '2'], 1)
    expect(result).toBe(false)
  })

  it('funciona com strings (inclui substring)', () => {
    const result = includes('hello world', 'world')
    expect(result).toBe(true)
  })

  it('retorna false quando substring não existe', () => {
    const result = includes('hello world', 'banana')
    expect(result).toBe(false)
  })

  it('funciona com string vazia', () => {
    const result = includes(EMPTY_STRING, EMPTY_STRING)
    expect(result).toBe(true)
  })

  it('funciona com array vazio', () => {
    const list: any[] = []

    const result = includes(list, 'any')

    expect(result).toBe(false)
  })

  it('usa o método nativo .includes internamente — array', () => {
    const arr = [1, 2, 3]
    const spy = vi.spyOn(arr, 'includes')

    includes(arr, 3)

    expect(spy).toHaveBeenCalledWith(3)

    spy.mockRestore()
  })

  it('usa o método nativo .includes internamente — string', () => {
    const str = 'hello'
    const spy = vi.spyOn(String.prototype, 'includes')

    includes(str, 'h')

    expect(spy).toHaveBeenCalledWith('h')

    spy.mockRestore()
  })
})

describe('[isEquals]', () => {
  it('retorna true para valores estritamente iguais', () => {
    expect(isEquals(10, 10)).toBe(true)
    expect(isEquals('abc', 'abc')).toBe(true)
    expect(isEquals(true, true)).toBe(true)
  })

  it('retorna false para valores completamente diferentes', () => {
    expect(isEquals(10, 20)).toBe(false)
    expect(isEquals('a', 'b')).toBe(false)
    expect(isEquals(true, false)).toBe(false)
  })

  it('usa comparação solta e retorna true para valores equivalentes', () => {
    expect(isEquals(1, '1')).toBe(true)
    expect(isEquals(0, false)).toBe(true)
    expect(isEquals('', false)).toBe(true)
    expect(isEquals(null, undefined)).toBe(true)
  })

  it('retorna false para NaN, mesmo com comparação solta', () => {
    expect(isEquals(NaN, NaN)).toBe(false)
  })

  it('retorna true para objetos idênticos (mesma referência)', () => {
    const obj = { a: 1 }
    expect(isEquals(obj, obj)).toBe(true)
  })

  it('retorna false para objetos com conteúdo igual mas referência diferente', () => {
    expect(isEquals({ a: 1 }, { a: 1 })).toBe(false)
  })

  it('funciona com arrays', () => {
    const arr = [1, 2]
    expect(isEquals(arr, arr)).toBe(true)
    expect(isEquals([1, 2], [1, 2])).toBe(false)
  })

  it('funciona com valores undefined e null (comparação solta)', () => {
    expect(isEquals(undefined, null)).toBe(true)
  })
})

describe('[isStrictEquals]', () => {
  it('retorna true para valores estritamente iguais (===)', () => {
    expect(isStrictEquals(10, 10)).toBe(true)
    expect(isStrictEquals('abc', 'abc')).toBe(true)
    expect(isStrictEquals(true, true)).toBe(true)
    expect(isStrictEquals(null, null)).toBe(true)
    expect(isStrictEquals(undefined, undefined)).toBe(true)
  })

  it('retorna false para valores de tipos diferentes', () => {
    expect(isStrictEquals(1, '1')).toBe(false)
    expect(isStrictEquals(true, 1)).toBe(false)
    expect(isStrictEquals(null, undefined)).toBe(false)
  })

  it('retorna false para objetos diferentes, mesmo que tenham o mesmo conteúdo', () => {
    expect(isStrictEquals({ a: 1 }, { a: 1 })).toBe(false)
    expect(isStrictEquals([1, 2], [1, 2])).toBe(false)
  })

  it('retorna true quando ambas as referências de objeto são iguais', () => {
    const ref = { msg: 'ok' }
    expect(isStrictEquals(ref, ref)).toBe(true)
  })

  it('retorna false para NaN (comportamento nativo do ===)', () => {
    expect(isStrictEquals(NaN, NaN)).toBe(false)
  })

  it('retorna true para mesma função referencialmente', () => {
    const fn = () => 123
    expect(isStrictEquals(fn, fn)).toBe(true)
  })

  it('retorna false para funções distintas, mesmo com a mesma estrutura', () => {
    expect(isStrictEquals(() => 1, () => 1)).toBe(false)
  })
})
