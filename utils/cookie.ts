
import {
  type ICookieOptions,
  type ISplitCookieObject, Nullable,
} from '../global'

import {
  pushIf,
  splitText,
  objectSize,
  replaceDuplicatedSpaces, EMPTY_STRING,
} from './index'

export const COOKIE_SEPARATOR = '; '

export function getCookie (name: string): string | false {
  const selectedCookie = splitText(replaceDuplicatedSpaces(document.cookie), COOKIE_SEPARATOR)
    .find(cookie => {
      const { name: cookieName } = splitCookie(cookie)

      return cookieName === name
    })

  return selectedCookie
    ? splitCookie(selectedCookie).value
    : false
}

export function splitCookie (cookie: string): ISplitCookieObject<string | false> {
  const [name, ...value] = splitText(cookie, '=')

  return {
    name,
    value: objectSize(value) > 0
      ? decodeURIComponent(value.join('='))
      : false,
  }
}

export function setCookie (name: string, value: string | number | boolean, options: ICookieOptions = {}): string {
  if (objectSize(name) === 0) {
    throw new Error("'setCookie' should receive a valid cookie name")
  }

  if (!['string', 'number', 'boolean'].includes(typeof value) || objectSize(value.toString()) === 0) {
    throw new Error("'setCookie' should receive a valid cookie value")
  }

  const cookieOptions: string[] = [`${name}=${encodeURIComponent(value)}`]

  pushIf(
    options?.expires && options?.expires instanceof Date,
    cookieOptions,
    `expires=` + options.expires?.toUTCString(),
  )

  pushIf(
    options.maxAge,
    cookieOptions,
    `maxAge=${options.maxAge}`,
  )

  pushIf(
    options?.sameSite && typeof options?.sameSite === 'string',
    cookieOptions,
    `SameSite=${options?.sameSite}`,
  )

  pushIf(
    options?.path,
    cookieOptions,
    `path=${options?.path}`,
  )

  pushIf(
    options?.domain,
    cookieOptions,
    `domain=${options?.domain}`,
  )

  pushIf(
    options?.httpOnly,
    cookieOptions,
    'HttpOnly',
  )

  pushIf(
    options?.secure,
    cookieOptions,
    'Secure',
  )

  const _buildCookie = cookieOptions.join(COOKIE_SEPARATOR)

  document.cookie = _buildCookie

  return _buildCookie
}
