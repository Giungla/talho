import {
  regexTest,
  numberOnly,
  objectSize,
  splitText,
} from './dom'

import {
  EMPTY_STRING, isStrictEquals,
  SLASH_STRING,
} from './index'

export const CPF_VERIFIERS_INDEXES = [10, 11]

export function textTestRegex (value: string): ((value: RegExp) => boolean) {
  return (regex: RegExp) => regexTest(regex, value)
}

export function validatePasswordParts (password: string) {
  const testRegex = textTestRegex(password)

  return {
    hasNumber: testRegex(/\d/),
    hasLowercase: testRegex(/[a-z]/),
    hasUppercase: testRegex(/[A-Z]/),
    hasMinLength: testRegex(/.{8,}/),
    hasSpecialChar: testRegex(/[!@#$%^&*()_+{}\[\]:;<>,.?\/~\\-]/),
  }
}

export function isCPFValid (cpf: string): boolean {
  cpf = numberOnly(cpf)

  if (objectSize(cpf) !== 11 || regexTest(/^(\d)\1{10}$/, cpf)) return false

  const verifiers = CPF_VERIFIERS_INDEXES.map((verifierDigit, verifierIndex) => {
    const lastIndex = verifierIndex ? 10 : 9;

    const sum = [...cpf.slice(0, lastIndex)]
      .map(Number)
      .reduce((acc, cur, index) => acc + cur * (verifierDigit - index), 0)

    const result = 11 - (sum % 11)

    return result > 9
      ? 0
      : result
  })

  return cpf.endsWith(verifiers.join(EMPTY_STRING))
}

export function isDateValid (date: string): boolean {
  const [
    day,
    month,
    fullYear
  ] = splitText(date, SLASH_STRING)

  const parsedDate = new Date(`${fullYear}-${month}-${day}T00:00:00`)

  if (isStrictEquals(parsedDate.toString(), 'Invalid Date')) return false

  const isSameDay   = isStrictEquals(parsedDate.getUTCDate(), Number(day))
  const isSameMonth = isStrictEquals(parsedDate.getUTCMonth() + 1, Number(month))
  const isSameYear  = isStrictEquals(parsedDate.getUTCFullYear(), Number(fullYear))

  return isSameDay && isSameMonth && isSameYear
}
