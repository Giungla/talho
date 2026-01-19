import {
  it,
  vi,
  expect,
  describe,
  beforeAll,
  afterAll,
} from 'vitest'

import {
  NULL_VALUE,
  trim,
  isNull,
  isArray,
  hasClass,
  stringify,
  splitText,
  regexTest,
  numberOnly,
  focusInput,
  objectSize,
  attachEvent,
  addAttribute,
  getAttribute,
  hasAttribute,
  querySelector,
  normalizeText,
  scrollIntoView,
  removeAttribute,
  toggleAttribute,
  buildURL,
  addClass,
  removeClass,
  toggleClass,
  safeParseJson,
  changeTextContent,
  replaceDuplicatedSpaces,
} from '../utils/dom'

describe('[isArray]', () => {
  it('valida o funcionamento do método responsável pela checagem de array', () => {
    expect(isArray([])).toBe(true)
    expect(isArray('')).toBe(false)
    expect(isArray(null)).toBe(false)
    expect(isArray(undefined)).toBe(false)
    expect(isArray(false)).toBe(false)
    expect(isArray(true)).toBe(false)
    expect(isArray(1)).toBe(false)
  })
})

describe('[addAttribute]', () => {
  it('deve adicionar o atributo ao elemento', () => {
    const el = document.createElement('div')

    addAttribute(el, 'data-test', 'ok')

    expect(el.getAttribute('data-test')).toBe('ok')
  })

  it('deve sobrescrever o valor de um atributo existente', () => {
    const el = document.createElement('div')
    el.setAttribute('data-id', '123')

    addAttribute(el, 'data-id', '456')

    expect(el.getAttribute('data-id')).toBe('456')
  })

  it('não deve lançar erro quando o elemento for null', () => {
    expect(() => addAttribute(null as any, 'data-x', '1')).not.toThrow()
  })

  it('não deve chamar setAttribute quando element for null', () => {
    const spy = vi.spyOn(Element.prototype, 'setAttribute')

    addAttribute(null as any, 'data-x', 'value')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('deve funcionar com atributos nativos do DOM', () => {
    const el = document.createElement('button')

    addAttribute(el, 'role', 'tab')
    addAttribute(el, 'id', 'meu-botao')

    expect(el.getAttribute('role')).toBe('tab')
    expect(el.getAttribute('id')).toBe('meu-botao')
  })

  it('deve adicionar atributos data-* corretamente', () => {
    const el = document.createElement('div')

    addAttribute(el, 'data-active', 'true')

    expect(el.dataset.active).toBe('true')
  })

  it('deve aceitar valor vazio', () => {
    const el = document.createElement('div')

    addAttribute(el, 'data-empty', '')

    expect(el.getAttribute('data-empty')).toBe('')
  })

  it('deve adicionar atributo em diferentes tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)
      addAttribute(el, 'data-type', tag)
      expect(el.getAttribute('data-type')).toBe(tag)
    })
  })
})

describe('[removeAttribute]', () => {
  it('remove o atributo do elemento quando existir', () => {
    const el = document.createElement('div')
    el.setAttribute('data-test', '123')

    removeAttribute(el, 'data-test')

    expect(el.hasAttribute('data-test')).toBe(false)
  })

  it('não lança erro caso o elemento seja null', () => {
    expect(() => removeAttribute(null as any, 'data-test')).not.toThrow()
  })

  it('não chama removeAttribute quando element for null', () => {
    const spy = vi.spyOn(Element.prototype, 'removeAttribute')

    removeAttribute(null as any, 'data-x')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('não altera nada quando o atributo não existir', () => {
    const el = document.createElement('div')

    removeAttribute(el, 'data-foo')

    expect(el.hasAttribute('data-foo')).toBe(false)
  })

  it('remove atributos nativos do DOM', () => {
    const el = document.createElement('button')
    el.setAttribute('disabled', '')

    removeAttribute(el, 'disabled')

    expect(el.hasAttribute('disabled')).toBe(false)
  })

  it('remove atributos customizados data-*', () => {
    const el = document.createElement('div')
    el.setAttribute('data-id', '999')

    removeAttribute(el, 'data-id')

    expect(el.dataset.id).toBeUndefined()
  })

  it('funciona em diversos tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)
      el.setAttribute('data-remove', 'x')

      removeAttribute(el, 'data-remove')

      expect(el.hasAttribute('data-remove')).toBe(false)
    })
  })
})

describe('[getAttribute]', () => {
  it('retorna o valor do atributo quando existir', () => {
    const el = document.createElement('div')
    el.setAttribute('data-test', 'abc')

    const result = getAttribute(el, 'data-test')

    expect(result).toBe('abc')
  })

  it('retorna NULL_VALUE quando element for null', () => {
    const result = getAttribute(null as any, 'data-test')
    expect(result).toBe(NULL_VALUE)
  })

  it('não chama getAttribute quando element for null', () => {
    const spy = vi.spyOn(Element.prototype, 'getAttribute')

    getAttribute(null as any, 'data-test')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('retorna NULL_VALUE quando o atributo não existir', () => {
    const el = document.createElement('div')

    const result = getAttribute(el, 'data-x')

    expect(result).toBe(NULL_VALUE)
  })

  it('funciona com atributos nativos', () => {
    const el = document.createElement('button')
    el.setAttribute('disabled', '')

    const result = getAttribute(el, 'disabled')

    // atributos booleanos retornam string vazia quando presentes
    expect(result).toBe('')
  })

  it('funciona com atributos data-*', () => {
    const el = document.createElement('div')
    el.setAttribute('data-id', '123')

    const result = getAttribute(el, 'data-id')

    expect(result).toBe('123')
  })

  it('funciona em diferentes tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)
      el.setAttribute('data-type', tag)

      const result = getAttribute(el, 'data-type')

      expect(result).toBe(tag)
    })
  })
})

describe('[hasAttribute]', () => {
  it('retorna true quando o atributo existir', () => {
    const el = document.createElement('div')
    el.setAttribute('data-test', '123')

    const result = hasAttribute(el, 'data-test')

    expect(result).toBe(true)
  })

  it('retorna false quando o atributo não existir', () => {
    const el = document.createElement('div')

    const result = hasAttribute(el, 'data-missing')

    expect(result).toBe(false)
  })

  it('retorna false quando element for null', () => {
    const result = hasAttribute(null as any, 'data-test')
    expect(result).toBe(false)
  })

  it('não chama hasAttribute quando element for null', () => {
    const spy = vi.spyOn(Element.prototype, 'hasAttribute')

    hasAttribute(null as any, 'data-x')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('funciona com atributos nativos', () => {
    const el = document.createElement('button')
    el.setAttribute('disabled', '')

    expect(hasAttribute(el, 'disabled')).toBe(true)
  })

  it('funciona com atributos data-*', () => {
    const el = document.createElement('div')
    el.setAttribute('data-id', 'abc')

    expect(hasAttribute(el, 'data-id')).toBe(true)
  })

  it('funciona em diferentes tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)
      el.setAttribute('data-tag', tag)

      expect(hasAttribute(el, 'data-tag')).toBe(true)
    })
  })
})

describe('[hasClass]', () => {
  it('retorna true quando a classe existir no elemento', () => {
    const el = document.createElement('div')
    el.classList.add('active')

    expect(hasClass(el, 'active')).toBe(true)
  })

  it('retorna false quando a classe não existir', () => {
    const el = document.createElement('div')

    expect(hasClass(el, 'missing')).toBe(false)
  })

  it('retorna false quando element for null', () => {
    expect(hasClass(null as any, 'active')).toBe(false)
  })

  it('chama classList.contains quando o elemento é válido', () => {
    const el = document.createElement('div')
    el.classList.add('test')

    const spy = vi.spyOn(el.classList, 'contains')

    const result = hasClass(el, 'test')

    expect(result).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('test')

    spy.mockRestore()
  })

  it('funciona com múltiplas classes no elemento', () => {
    const el = document.createElement('div')
    el.className = 'btn primary large'

    expect(hasClass(el, 'primary')).toBe(true)
    expect(hasClass(el, 'btn')).toBe(true)
    expect(hasClass(el, 'large')).toBe(true)
  })

  it('retorna false para partes de nome de classe (verificação exata)', () => {
    const el = document.createElement('div')
    el.className = 'button'

    expect(hasClass(el, 'but')).toBe(false)
    expect(hasClass(el, 'utton')).toBe(false)
  })

  it('funciona em diferentes tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)
      el.classList.add('my-class')

      expect(hasClass(el, 'my-class')).toBe(true)
    })
  })
})

describe('[toggleAttribute]', () => {
  it('retorna false quando element for null', () => {
    expect(toggleAttribute(null as any, 'data-test')).toBe(false)
  })

  it('não chama toggleAttribute do DOM quando element for null', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el, 'toggleAttribute')

    toggleAttribute(null as any, 'data-test')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('adiciona o atributo quando ele não existe (force undefined)', () => {
    const el = document.createElement('div')

    const result = toggleAttribute(el, 'data-active')

    expect(result).toBe(true)
    expect(el.hasAttribute('data-active')).toBe(true)
  })

  it('remove o atributo quando ele já existe (force undefined)', () => {
    const el = document.createElement('div')
    el.setAttribute('data-active', '')

    const result = toggleAttribute(el, 'data-active')

    expect(result).toBe(false)
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('força adicionar quando force = true', () => {
    const el = document.createElement('div')

    const result = toggleAttribute(el, 'data-test', true)

    expect(result).toBe(true)
    expect(el.hasAttribute('data-test')).toBe(true)
  })

  it('força remover quando force = false', () => {
    const el = document.createElement('div')
    el.setAttribute('data-test', '')

    const result = toggleAttribute(el, 'data-test', false)

    expect(result).toBe(false)
    expect(el.hasAttribute('data-test')).toBe(false)
  })

  it('propaga erros lançados por element.toggleAttribute', () => {
    const el = document.createElement('div')
    const forcedError = new Error('forced error')

    const spy = vi.spyOn(el, 'toggleAttribute').mockImplementation(() => {
      throw forcedError
    })

    expect(() => toggleAttribute(el, 'data-test')).toThrow(forcedError)

    spy.mockRestore()
  })

  it('funciona com diversos tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)

      const resultAdd = toggleAttribute(el, 'data-x')
      expect(resultAdd).toBe(true)
      expect(el.hasAttribute('data-x')).toBe(true)

      const resultRemove = toggleAttribute(el, 'data-x')
      expect(resultRemove).toBe(false)
      expect(el.hasAttribute('data-x')).toBe(false)
    })
  })
})

describe('[addClass]', () => {
  it('adiciona uma classe ao elemento', () => {
    const el = document.createElement('div')

    addClass(el, 'active')

    expect(el.classList.contains('active')).toBe(true)
  })

  it('adiciona múltiplas classes ao mesmo tempo', () => {
    const el = document.createElement('div')

    addClass(el, 'a', 'b', 'c')

    expect(el.classList.contains('a')).toBe(true)
    expect(el.classList.contains('b')).toBe(true)
    expect(el.classList.contains('c')).toBe(true)
  })

  it('não lança erro quando element for null', () => {
    expect(() => addClass(null as any, 'a')).not.toThrow()
  })

  it('não chama classList.add quando element for null', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el.classList, 'add')

    addClass(null as any, 'test')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('não duplica classe caso ela já exista', () => {
    const el = document.createElement('div')
    el.classList.add('item')

    addClass(el, 'item')

    expect(el.className).toBe('item')
  })

  it('propaga erros lançados por classList.add', () => {
    const el = document.createElement('div')
    const forcedError = new Error('forced error')

    const spy = vi.spyOn(el.classList, 'add').mockImplementation(() => {
      throw forcedError
    })

    expect(() => addClass(el, 'test')).toThrow(forcedError)

    spy.mockRestore()
  })

  it('funciona com diferentes tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)

      addClass(el, 'ready')

      expect(el.classList.contains('ready')).toBe(true)
    })
  })

  it('ignora chamadas com lista vazia de classes', () => {
    const el = document.createElement('div')

    addClass(el)

    expect(el.className).toBe('')
  })
})

describe('[removeClass]', () => {
  it('remove uma classe existente', () => {
    const el = document.createElement('div')
    el.classList.add('active')

    removeClass(el, 'active')

    expect(el.classList.contains('active')).toBe(false)
  })

  it('remove múltiplas classes ao mesmo tempo', () => {
    const el = document.createElement('div')
    el.classList.add('a', 'b', 'c')

    removeClass(el, 'a', 'c')

    expect(el.classList.contains('a')).toBe(false)
    expect(el.classList.contains('c')).toBe(false)
    expect(el.classList.contains('b')).toBe(true)
  })

  it('não lança erro quando element for null', () => {
    expect(() => removeClass(null as any, 'x')).not.toThrow()
  })

  it('não chama classList.remove quando element for null', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el.classList, 'remove')

    removeClass(null as any, 'x')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('não lança erro ao remover classes que não existem', () => {
    const el = document.createElement('div')
    el.classList.add('a')

    expect(() => removeClass(el, 'b', 'c')).not.toThrow()

    expect(el.classList.contains('a')).toBe(true)
  })

  it('propaga erros lançados por classList.remove', () => {
    const el = document.createElement('div')
    const forcedError = new Error('forced error')

    const spy = vi.spyOn(el.classList, 'remove').mockImplementation(() => {
      throw forcedError
    })

    expect(() => removeClass(el, 'x')).toThrow(forcedError)

    spy.mockRestore()
  })

  it('funciona em diferentes tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)
      el.classList.add('target')

      removeClass(el, 'target')

      expect(el.classList.contains('target')).toBe(false)
    })
  })

  it('ignora chamadas sem nenhuma classe', () => {
    const el = document.createElement('div')
    el.classList.add('x')

    removeClass(el)

    expect(el.classList.contains('x')).toBe(true)
  })
})

describe('[toggleClass]', () => {
  it('retorna false quando element for null', () => {
    expect(toggleClass(null as any, 'x')).toBe(false)
  })

  it('não chama classList.toggle quando element for null', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el.classList, 'toggle')

    toggleClass(null as any, 'x')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('adiciona a classe quando ela não existe (force undefined)', () => {
    const el = document.createElement('div')

    const result = toggleClass(el, 'active')

    expect(result).toBe(true)
    expect(el.classList.contains('active')).toBe(true)
  })

  it('remove a classe quando ela já existe (force undefined)', () => {
    const el = document.createElement('div')
    el.classList.add('active')

    const result = toggleClass(el, 'active')

    expect(result).toBe(false)
    expect(el.classList.contains('active')).toBe(false)
  })

  it('força adicionar quando force = true', () => {
    const el = document.createElement('div')

    const result = toggleClass(el, 'flag', true)

    expect(result).toBe(true)
    expect(el.classList.contains('flag')).toBe(true)
  })

  it('força remover quando force = false', () => {
    const el = document.createElement('div')
    el.classList.add('flag')

    const result = toggleClass(el, 'flag', false)

    expect(result).toBe(false)
    expect(el.classList.contains('flag')).toBe(false)
  })

  it('propaga erros lançados por classList.toggle', () => {
    const el = document.createElement('div')
    const forcedError = new Error('forced error')

    const spy = vi.spyOn(el.classList, 'toggle').mockImplementation(() => {
      throw forcedError
    })

    expect(() => toggleClass(el, 'x')).toThrow(forcedError)

    spy.mockRestore()
  })

  it('verifica se classList.toggle é chamado corretamente', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el.classList, 'toggle')

    toggleClass(el, 'hello')

    expect(spy).toHaveBeenCalledWith('hello', undefined)

    spy.mockRestore()
  })

  it('funciona com diferentes tipos de elementos', () => {
    const tags = ['div', 'span', 'button', 'input'] as const

    tags.forEach(tag => {
      const el = document.createElement(tag)

      const added = toggleClass(el, 'ready')
      const removed = toggleClass(el, 'ready')

      expect(added).toBe(true)
      expect(removed).toBe(false)
    })
  })
})

describe('[changeTextContent]', () => {
  it('altera o textContent quando o elemento é válido (string)', () => {
    const el = document.createElement('div')

    changeTextContent(el, 'hello')

    expect(el.textContent).toBe('hello')
  })

  it('converte number para string antes de setar', () => {
    const el = document.createElement('div')

    changeTextContent(el, 123)

    expect(el.textContent).toBe('123')
  })

  it('converte boolean para string antes de setar', () => {
    const el = document.createElement('div')

    changeTextContent(el, false)

    expect(el.textContent).toBe('false')
  })

  it('não lança erro quando element for null', () => {
    expect(() => changeTextContent(null as any, 'x')).not.toThrow()
  })

  it('não altera textContent quando element for null', () => {
    const el = document.createElement('div')
    el.textContent = 'original'

    const spy = vi.spyOn(el, 'textContent', 'set')

    changeTextContent(null as any, 'new')

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('aceita string vazia', () => {
    const el = document.createElement('div')

    changeTextContent(el, '')

    expect(el.textContent).toBe('')
  })

  it('aceita 0 e converte corretamente', () => {
    const el = document.createElement('div')

    changeTextContent(el, 0)

    expect(el.textContent).toBe('0')
  })

  it('aceita true e false (booleanos) convertidos corretamente', () => {
    const el = document.createElement('div')

    changeTextContent(el, true)
    expect(el.textContent).toBe('true')

    changeTextContent(el, false)
    expect(el.textContent).toBe('false')
  })

  it('sobrescreve textContent existente', () => {
    const el = document.createElement('div')
    el.textContent = 'old'

    changeTextContent(el, 'new')

    expect(el.textContent).toBe('new')
  })

  it('propaga erros se o setter de textContent lançar', () => {
    const el = document.createElement('div')
    const forcedError = new Error('forced error')

    const spy = vi.spyOn(el, 'textContent', 'set').mockImplementation(() => {
      throw forcedError
    })

    expect(() => changeTextContent(el, 'boom')).toThrow(forcedError)

    spy.mockRestore()
  })
})

describe('[buildURL]', () => {
  const originalLocation = global.location

  beforeAll(() => {
    Object.defineProperty(global, 'location', {
      configurable: true,
      value: {
        protocol: 'https:',
        hostname: 'example.com'
      }
    })
  })

  afterAll(() => {
    Object.defineProperty(global, 'location', {
      configurable: true,
      value: originalLocation
    })
  })

  it('constrói uma URL absoluta a partir de um path relativo', () => {
    const result = buildURL('/home')

    expect(result).toBe('https://example.com/home')
  })

  it('constrói corretamente quando o path não começa com /', () => {
    const result = buildURL('dashboard')

    expect(result).toBe('https://example.com/dashboard')
  })

  it('mantém barras corretamente entre base e path', () => {
    const result = buildURL('/api/v1/test')

    expect(result).toBe('https://example.com/api/v1/test')
  })

  it('adiciona parâmetros de query na URL', () => {
    const result = buildURL('/search', {
      q: 'banana',
      page: '2'
    })

    expect(result).toBe('https://example.com/search?q=banana&page=2')
  })

  it('sobrescreve parâmetros repetidos', () => {
    const result = buildURL('/items?sort=asc', {
      sort: 'desc'
    })

    expect(result).toBe('https://example.com/items?sort=desc')
  })

  it('funciona com path absoluto', () => {
    const result = buildURL('https://other.com/test')

    expect(result).toBe('https://other.com/test')
  })

  it('não adiciona query quando o objeto for vazio', () => {
    const result = buildURL('/no-query', {})

    expect(result).toBe('https://example.com/no-query')
  })

  it('mantém query string já existente no path e adiciona novas', () => {
    const result = buildURL('/products?category=books', {
      sort: 'asc'
    })

    expect(result).toBe('https://example.com/products?category=books&sort=asc')
  })

  it('lida com valores de query vazios corretamente', () => {
    const result = buildURL('/empty', {
      a: '',
      b: 'test'
    })

    expect(result).toBe('https://example.com/empty?a=&b=test')
  })

  it('converte automaticamente a URL final para string corretamente', () => {
    const result = buildURL('/string-test')

    expect(typeof result).toBe('string')
  })
})

describe('[stringify]', () => {
  it('serializa um objeto simples', () => {
    const obj = { a: 1, b: 'text' }

    const result = stringify(obj)

    expect(result).toBe(JSON.stringify(obj))
  })

  it('serializa objetos aninhados', () => {
    const obj = { user: { id: 1, name: 'John' } }

    const result = stringify(obj)

    expect(result).toBe('{"user":{"id":1,"name":"John"}}')
  })

  it('serializa arrays dentro do objeto', () => {
    const obj = { list: [1, 2, 3] }

    const result = stringify(obj)

    expect(result).toBe('{"list":[1,2,3]}')
  })

  it('serializa um objeto vazio', () => {
    const obj = {}

    const result = stringify(obj)

    expect(result).toBe('{}')
  })

  it('serializa valores numéricos dentro do objeto', () => {
    const obj = { value: 123 }

    const result = stringify(obj)

    expect(result).toBe('{"value":123}')
  })

  it('serializa valores booleanos dentro do objeto', () => {
    const obj = { flag: true }

    const result = stringify(obj)

    expect(result).toBe('{"flag":true}')
  })

  it('serializa datas como string ISO (comportamento nativo)', () => {
    const date = new Date('2020-01-01T00:00:00.000Z')
    const obj = { createdAt: date }

    const result = stringify(obj)

    expect(result).toBe(`{"createdAt":"${date.toISOString()}"}`)
  })

  it('propaga erros lançados por JSON.stringify', () => {
    const circular: any = {}
    circular.self = circular

    // JSON.stringify lança com referências circulares
    expect(() => stringify(circular)).toThrow()
  })

  it('espia e garante que JSON.stringify foi chamado corretamente', () => {
    const spy = vi.spyOn(JSON, 'stringify')
    const obj = { x: 1 }

    stringify(obj)

    expect(spy).toHaveBeenCalledWith(obj)

    spy.mockRestore()
  })
})

describe('[trim]', () => {
  it('remove espaços no início e no fim', () => {
    const result = trim('  hello  ')
    expect(result).toBe('hello')
  })

  it('não remove espaços internos', () => {
    const result = trim('  hello   world  ')
    expect(result).toBe('hello   world')
  })

  it('retorna string vazia quando a entrada é vazia', () => {
    expect(trim('')).toBe('')
  })

  it('retorna string vazia quando contém apenas espaços', () => {
    expect(trim('     ')).toBe('')
  })

  it('mantém caracteres especiais corretamente', () => {
    const result = trim('  ✨magic✨  ')
    expect(result).toBe('✨magic✨')
  })

  it('funciona normalmente com quebras de linha e tabs', () => {
    const result = trim('\n\t  text  \t\n')
    expect(result).toBe('text')
  })

  it('propaga erros lançados por value.trim', () => {
    const spy = vi.spyOn(String.prototype, 'trim').mockImplementation(() => {
      throw new Error('forced-error')
    })

    expect(() => trim('test')).toThrow('forced-error')

    spy.mockRestore()
  })

  it('chama o método trim internamente', () => {
    const spy = vi.spyOn(String.prototype, 'trim')

    trim(' hello ')

    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })
})

describe('[safeParseJson]', () => {
  it('retorna null quando value não for string', () => {
    expect(safeParseJson(null)).toBe(NULL_VALUE)
    expect(safeParseJson(undefined)).toBe(NULL_VALUE)
    expect(safeParseJson(123 as any)).toBe(NULL_VALUE)
    expect(safeParseJson(true as any)).toBe(NULL_VALUE)
  })

  it('faz parse corretamente de JSON válido', () => {
    const json = '{"a":1,"b":"text"}'

    const result = safeParseJson(json)

    expect(result).toEqual({ a: 1, b: 'text' })
  })

  it('faz parse de valores primitivos JSON', () => {
    expect(safeParseJson('123')).toBe(123)
    expect(safeParseJson('"hello"')).toBe('hello')
    expect(safeParseJson('true')).toBe(true)
    expect(safeParseJson('false')).toBe(false)
    expect(safeParseJson('null')).toBe(null)
  })

  it('retorna NULL_VALUE quando JSON.parse lançar erro', () => {
    expect(safeParseJson('invalid json')).toBe(NULL_VALUE)
    expect(safeParseJson('{a:1}')).toBe(NULL_VALUE)
  })

  it('retorna NULL_VALUE quando JSON for parcialmente inválido', () => {
    expect(safeParseJson('{"a":1,}')).toBe(NULL_VALUE)
  })

  it('espia se JSON.parse foi chamado quando value é string', () => {
    const spy = vi.spyOn(JSON, 'parse')

    safeParseJson('{"x":1}')

    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })

  it('não chama JSON.parse quando value não é string', () => {
    const spy = vi.spyOn(JSON, 'parse')

    safeParseJson(null)

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('permite tipagem genérica de retorno', () => {
    interface User { id: number; name: string }

    const json = '{"id":1,"name":"Alice"}'

    const result = safeParseJson<User>(json)

    expect(result).toEqual({ id: 1, name: 'Alice' })
  })
})

describe('[numberOnly]', () => {
  it('remove caracteres não numéricos', () => {
    expect(numberOnly('a1b2c3')).toBe('123')
  })

  it('mantém números intactos', () => {
    expect(numberOnly('98765')).toBe('98765')
  })

  it('remove espaços, letras e símbolos', () => {
    expect(numberOnly(' 1a 2#3! ')).toBe('123')
  })

  it('retorna string vazia quando não há números', () => {
    expect(numberOnly('abcd!@#')).toBe('')
  })

  it('funciona com números misturados com acentos e unicode', () => {
    expect(numberOnly('5é7ô9ç')).toBe('579')
  })
})

describe('[objectSize]', () => {
  it('retorna o tamanho de uma string', () => {
    expect(objectSize('abc')).toBe(3)
    expect(objectSize('')).toBe(0)
  })

  it('retorna o tamanho de um array', () => {
    expect(objectSize([1, 2, 3])).toBe(3)
    expect(objectSize([])).toBe(0)
  })

  it('funciona com arrays heterogêneos', () => {
    expect(objectSize([1, 'a', true, null])).toBe(4)
  })

  it('funciona com arrays de objetos', () => {
    expect(objectSize([{ a: 1 }, { b: 2 }])).toBe(2)
  })

  it('retorna o length correto mesmo com valores “falsy” dentro da lista', () => {
    expect(objectSize([0, false, '', undefined])).toBe(4)
  })
})

describe('[regexTest]', () => {
  it('retorna true quando o regex casa com o valor', () => {
    const result = regexTest(/abc/, '123abc456')
    expect(result).toBe(true)
  })

  it('retorna false quando o regex não casa com o valor', () => {
    const result = regexTest(/xyz/, '123abc456')
    expect(result).toBe(false)
  })

  it('aceita um regex retornado por função', () => {
    const mockFn = vi.fn(() => /hello/)
    const result = regexTest(mockFn, 'say hello')

    expect(result).toBe(true)
    expect(mockFn).toHaveBeenCalled()
  })

  it('retorna false quando a função de regex retorna uma regra que não casa', () => {
    const mockFn = vi.fn(() => /^\d+$/)
    const result = regexTest(mockFn, 'abc')

    expect(result).toBe(false)
  })

  it('propaga erros caso a função fornecida lance', () => {
    const fn = () => {
      throw new Error('forced error')
    }

    expect(() => regexTest(fn as any, 'test')).toThrow('forced error')
  })

  it('verifica que rule.test é chamado corretamente', () => {
    const rule = /abc/
    const spy = vi.spyOn(rule, 'test')

    regexTest(rule, 'abc123')

    expect(spy).toHaveBeenCalledWith('abc123')

    spy.mockRestore()
  })
})

describe('[normalizeText]', () => {
  it('remove acentos corretamente', () => {
    expect(normalizeText('café')).toBe('cafe')
    expect(normalizeText('ação')).toBe('acao')
    expect(normalizeText('âmêíõú')).toBe('ameiou')
  })

  it('remove caracteres invisíveis (zero-width spaces)', () => {
    const zeroWidthChars = '\u200B\u200C\u200D\uFEFF'
    expect(normalizeText('a' + zeroWidthChars + 'b')).toBe('ab')
  })

  it('remove U+2060 e U+034F', () => {
    expect(normalizeText('a\u2060b')).toBe('ab')
    expect(normalizeText('x\u034Fy')).toBe('xy')
  })

  it('mantém caracteres normais intactos', () => {
    expect(normalizeText('normal text')).toBe('normal text')
  })

  it('funciona com string vazia', () => {
    expect(normalizeText('')).toBe('')
  })

  it('remove acentos em textos longos e mistos', () => {
    const input = 'Olá, João! Você está bem? — Café com açúcar.'
    const output = 'Ola, Joao! Voce esta bem? — Cafe com acucar.'

    expect(normalizeText(input)).toBe(output)
  })

  it('não remove caracteres especiais não listados (ex: emojis)', () => {
    expect(normalizeText('👍 café')).toBe('👍 cafe')
  })
})

describe('[replaceDuplicatedSpaces]', () => {
  it('substitui dois ou mais espaços por um único espaço', () => {
    const input = 'Hello   world'
    const result = replaceDuplicatedSpaces(input)
    expect(result).toBe('Hello world')
  })

  it('mantém um único espaço entre palavras', () => {
    const input = 'Hello world'
    const result = replaceDuplicatedSpaces(input)
    expect(result).toBe('Hello world')
  })

  it('remove múltiplas ocorrências e normaliza todas para um espaço', () => {
    const input = 'A    B      C   D'
    const result = replaceDuplicatedSpaces(input)
    expect(result).toBe('A B C D')
  })

  it('funciona com tabs e espaços misturados (tabs contam como \\s)', () => {
    const input = 'A\t\t\t   B'
    const result = replaceDuplicatedSpaces(input)
    expect(result).toBe('A B')
  })

  it('funciona com espaços no início e no fim (não remove, apenas normaliza)', () => {
    const input = '   Hello   world   '
    const result = replaceDuplicatedSpaces(input)

    expect(result).toBe(' Hello world ')
  })

  it('retorna a mesma string quando não há espaços duplicados', () => {
    const input = 'ABC'
    const result = replaceDuplicatedSpaces(input)
    expect(result).toBe('ABC')
  })

  it('funciona com strings compostas apenas por espaços', () => {
    const input = '     '
    const result = replaceDuplicatedSpaces(input)
    expect(result).toBe(' ')
  })
})

describe('[focusInput]', () => {
  it('não chama focus quando o input for null', () => {
    const spy = vi.fn()

    focusInput(null as any, {})

    expect(spy).not.toHaveBeenCalled()
  })

  it('chama input.focus sem opções quando não fornecidas', () => {
    const input = document.createElement('input')
    const spy = vi.spyOn(input, 'focus')

    focusInput(input)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(undefined)

    spy.mockRestore()
  })

  it('chama input.focus com opções quando fornecidas', () => {
    const input = document.createElement('input')
    const spy = vi.spyOn(input, 'focus')

    const options: FocusOptions = { preventScroll: true }

    focusInput(input, options)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(options)

    spy.mockRestore()
  })

  it('propaga erros se input.focus lançar exceção', () => {
    const input = document.createElement('input')
    const forcedError = new Error('forced error')

    const spy = vi.spyOn(input, 'focus').mockImplementation(() => {
      throw forcedError
    })

    expect(() => focusInput(input)).toThrow(forcedError)

    spy.mockRestore()
  })
})

describe('[scrollIntoView]', () => {
  it('chama scrollIntoView com args corretos', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el, 'scrollIntoView')

    const args = { block: 'center', behavior: 'smooth' } as const

    scrollIntoView(el, args)

    expect(spy).toHaveBeenCalledWith(args)

    spy.mockRestore()
  })

  it('não chama scrollIntoView quando element for null', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el, 'scrollIntoView')

    scrollIntoView(null as any, { behavior: 'auto' })

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})

describe('[splitText]', () => {
  it('divide o texto usando um separador string', () => {
    const result = splitText('a,b,c', ',')

    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('divide o texto usando um separador RegExp', () => {
    const result = splitText('a  b   c', /\s+/)

    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('respeita o limite informado', () => {
    const result = splitText('a,b,c,d', ',', 2)

    expect(result).toEqual(['a', 'b'])
  })

  it('retorna um array com o texto inteiro quando o separador não existe', () => {
    const result = splitText('abc', ',')

    expect(result).toEqual(['abc'])
  })

  it('funciona com string vazia', () => {
    const result = splitText('', ',')

    expect(result).toEqual([''])
  })

  it('funciona com separador vazio', () => {
    const result = splitText('abc', '')

    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('funciona com limite 0 retornando array vazio', () => {
    const result = splitText('a,b,c', ',', 0)

    expect(result).toEqual([])
  })

  it('funciona com limite maior que o tamanho', () => {
    const result = splitText('a,b', ',', 10)

    expect(result).toEqual(['a', 'b'])
  })
})

describe('[isNull]', () => {
  it('retorna true quando o valor é null', () => {
    expect(isNull(null)).toBe(true)
  })

  it('retorna false para undefined', () => {
    expect(isNull(undefined)).toBe(false)
  })

  it('retorna false para string vazia', () => {
    expect(isNull('')).toBe(false)
  })

  it('retorna false para número', () => {
    expect(isNull(0)).toBe(false)
    expect(isNull(123)).toBe(false)
  })

  it('retorna false para booleanos', () => {
    expect(isNull(false)).toBe(false)
    expect(isNull(true)).toBe(false)
  })

  it('retorna false para objetos e arrays', () => {
    expect(isNull({})).toBe(false)
    expect(isNull([])).toBe(false)
  })
})

describe('[querySelector]', () => {
  it('retorna o elemento quando encontrado no document', () => {
    const div = document.createElement('div')
    div.id = 'test'
    document.body.appendChild(div)

    const result = querySelector('#test')

    expect(result).toBe(div)

    div.remove()
  })

  it('retorna null quando o elemento não existe', () => {
    const result = querySelector('#not-found')
    expect(result).toBeNull()
  })

  it('busca dentro de um node específico quando fornecido', () => {
    const container = document.createElement('div')
    const span = document.createElement('span')
    span.className = 'inside'
    container.appendChild(span)

    const result = querySelector('.inside', container)
    expect(result).toBe(span)
  })

  it('retorna NULL_VALUE (null) quando node = null', () => {
    const result = querySelector('.any', null)
    expect(result).toBe(NULL_VALUE)
  })

  it('não chama querySelector do document quando node = null', () => {
    const spy = vi.spyOn(document, 'querySelector')

    querySelector('.abc', null)

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('garante que o selector é passado como string', () => {
    const spy = vi.spyOn(document, 'querySelector')

    querySelector('div')

    expect(spy).toHaveBeenCalledWith('div')

    spy.mockRestore()
  })

  it('funciona com seletores por tag', () => {
    const el = document.createElement('button')
    document.body.appendChild(el)

    const result = querySelector('button')

    expect(result).toBe(el)

    el.remove()
  })

  it('retorna sempre o tipo correto baseado no selector genérico', () => {
    const input = document.createElement('input')
    input.id = 'my-input'
    document.body.appendChild(input)

    const result = querySelector<'input'>('#my-input')

    expect(result).toBeInstanceOf(HTMLInputElement)

    input.remove()
  })
})

describe('[attachEvent]', () => {
  it('não lança erro quando node for null', () => {
    expect(() => attachEvent(null as any, 'click', () => {})).not.toThrow()
  })

  it('não registra eventListener quando node for null', () => {
    const el = document.createElement('div')
    const spy = vi.spyOn(el, 'addEventListener')

    attachEvent(null as any, 'click', () => {})

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('registra o eventListener corretamente', () => {
    const el = document.createElement('div')
    const callback = vi.fn()
    const spy = vi.spyOn(el, 'addEventListener')

    attachEvent(el, 'click', callback)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('click', callback, undefined)

    spy.mockRestore()
  })

  it('dispara o callback quando o evento ocorre', () => {
    const el = document.createElement('div')
    const callback = vi.fn()

    attachEvent(el, 'click', callback)

    el.dispatchEvent(new Event('click'))

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('retorna uma função que remove o eventListener', () => {
    const el = document.createElement('div')
    const callback = vi.fn()

    const remove = attachEvent(el, 'click', callback)!

    const removeSpy = vi.spyOn(el, 'removeEventListener')

    remove && remove()

    expect(removeSpy).toHaveBeenCalledWith('click', callback, undefined)

    removeSpy.mockRestore()
  })

  it('o remove realmente impede que o callback dispare novamente', () => {
    const el = document.createElement('div')
    const callback = vi.fn()

    const remove = attachEvent(el, 'click', callback)!

    // dispara uma vez (antes de remover)
    el.dispatchEvent(new Event('click'))
    expect(callback).toHaveBeenCalledTimes(1)

    // remove listener
    remove && remove()

    // dispara de novo → não deve chamar
    el.dispatchEvent(new Event('click'))
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('registra o listener com opções quando fornecidas', () => {
    const el = document.createElement('div')
    const callback = vi.fn()
    const options = { once: true }

    const spy = vi.spyOn(el, 'addEventListener')

    attachEvent(el, 'click', callback, options)

    expect(spy).toHaveBeenCalledWith('click', callback, options)

    spy.mockRestore()
  })
})
