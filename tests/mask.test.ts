import {
  it,
  expect,
  describe,
} from 'vitest'

import {
  EMPTY_STRING,
} from '../utils/consts'

import {
  splitText,
} from '../utils/dom'

import {
  BRLFormatter,
  maskCEP,
  maskDate,
  toUpperCase,
  maskCPFNumber,
  maskPhoneNumber,
} from '../utils/mask'

describe('[toUpperCase]', () => {
  it('validação do método de transformação de string para caixa alta', () => {
    const value = 'Talho Carnes'
    const reversedValue = splitText(value, EMPTY_STRING).reverse().join(EMPTY_STRING)

    expect(toUpperCase(value)).toBe(value.toUpperCase())

    expect(toUpperCase(reversedValue)).toBe(reversedValue.toUpperCase())
  })
})

describe('[maskPhoneNumber]', () => {
  it('valida o funcionamento incremental do método que aplica máscara em telefones', () => {
    expect(maskPhoneNumber('')).toBe('')
    expect(maskPhoneNumber('8')).toBe('(8')
    expect(maskPhoneNumber('81')).toBe('(81')
    expect(maskPhoneNumber('819')).toBe('(81) 9')
    expect(maskPhoneNumber('8198')).toBe('(81) 98')
    expect(maskPhoneNumber('81985')).toBe('(81) 985')
    expect(maskPhoneNumber('819854')).toBe('(81) 9854')
    expect(maskPhoneNumber('8198549')).toBe('(81) 9854-9')
    expect(maskPhoneNumber('81985493')).toBe('(81) 9854-93')
    expect(maskPhoneNumber('8198549352')).toBe('(81) 9854-9352')
    expect(maskPhoneNumber('81985493529')).toBe('(81) 98549-3529')
  })
})

describe('[maskCPFNumber]', () => {
  it('valida o funcionamento incremental do método responsável pela aplicação de máscara em CPFs', () => {
    expect(maskCPFNumber('')).toBe('')
    expect(maskCPFNumber('0')).toBe('0')
    expect(maskCPFNumber('08')).toBe('08')
    expect(maskCPFNumber('087')).toBe('087')
    expect(maskCPFNumber('0872')).toBe('087.2')
    expect(maskCPFNumber('08722')).toBe('087.22')
    expect(maskCPFNumber('087225')).toBe('087.225')
    expect(maskCPFNumber('0872250')).toBe('087.225.0')
    expect(maskCPFNumber('08722502')).toBe('087.225.02')
    expect(maskCPFNumber('087225020')).toBe('087.225.020')
    expect(maskCPFNumber('0872250202')).toBe('087.225.020-2')
    expect(maskCPFNumber('08722502025')).toBe('087.225.020-25')
  })
})

describe('[maskCEP]', () => {
  it('valida o funcionamento incremental do método responsável pela aplicação de máscara em CEPs', () => {
    expect(maskCEP('')).toBe('')
    expect(maskCEP('2')).toBe('2')
    expect(maskCEP('29')).toBe('29')
    expect(maskCEP('291')).toBe('291')
    expect(maskCEP('2916')).toBe('2916')
    expect(maskCEP('29163')).toBe('29163')
    expect(maskCEP('291635')).toBe('29163-5')
    expect(maskCEP('2916354')).toBe('29163-54')
    expect(maskCEP('29163541')).toBe('29163-541')
  })
})

describe('[maskDate]', () => {
  it('valida o funcionamento incremental do método responsável pela aplicação de máscara em datas', () => {
    expect(maskDate('')).toBe('')
    expect(maskDate('2')).toBe('2')
    expect(maskDate('20')).toBe('20')
    expect(maskDate('201')).toBe('20/1')
    expect(maskDate('2011')).toBe('20/11')
    expect(maskDate('20112')).toBe('20/11/2')
    expect(maskDate('201120')).toBe('20/11/20')
    expect(maskDate('2011202')).toBe('20/11/202')
    expect(maskDate('20112025')).toBe('20/11/2025')
  })
})

describe('[BRLFormatter]', () => {
  it('valida o funcionamento do método responsável pela transformação de valores em Strings monetárias em BRL', () => {
    expect(BRLFormatter.format(0)).toBe('R$\u00A00,00')
    expect(BRLFormatter.format(1)).toBe('R$\u00A01,00')
    expect(BRLFormatter.format(10)).toBe('R$\u00A010,00')
    expect(BRLFormatter.format(1234.56)).toBe('R$\u00A01.234,56')
    expect(BRLFormatter.format(999999.99)).toBe('R$\u00A0999.999,99')
    expect(BRLFormatter.format(-20)).toBe('-R$\u00A020,00')
    expect(BRLFormatter.format(-1234.56)).toBe('-R$\u00A01.234,56')
  })
})


