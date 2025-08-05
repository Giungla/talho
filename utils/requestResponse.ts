
import type {
  HttpMethod,
  FunctionErrorPattern,
  FunctionSucceededPattern,
} from "../global"

import {
  getCookie,
  setCookie,
  timestampDays
} from "./index"

export const AUTH_COOKIE_NAME = '__Host-Talho-AuthToken'
export const TALHO_SESSION_COOKIE_NAME = '__Host-Talho-Session-Cookie'
export const TALHO_SESSION_HEADER_NAME = 'X-Talho-Session'

export function postErrorResponse (this: Headers | void, message: string): FunctionErrorPattern {
  const session = this?.get(TALHO_SESSION_HEADER_NAME)

  if (session) {
    setCookie(TALHO_SESSION_COOKIE_NAME, session, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(Date.now() + timestampDays(90)),
    })
  }

  return {
    message,
    succeeded: false
  }
}

export function postSuccessResponse <T> (this: Headers | void, response: T): FunctionSucceededPattern<T> {
  const session = this?.get(TALHO_SESSION_HEADER_NAME)

  if (session) {
    setCookie(TALHO_SESSION_COOKIE_NAME, session, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(Date.now() + timestampDays(90)),
    })
  }

  return {
    data: response,
    succeeded: true
  }
}

export function buildRequestOptions (headers: [string, string][] = [], method: HttpMethod = 'GET'): Pick<RequestInit, 'method' | 'headers'> {
  const _headers = new Headers({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  })

  for (const [header, value] of headers) {
    _headers.set(header, value)
  }

  const cookieSession = getCookie(TALHO_SESSION_COOKIE_NAME)

  if (cookieSession) {
    _headers.set(TALHO_SESSION_HEADER_NAME, cookieSession)
  }

  const authCookie = getCookie(AUTH_COOKIE_NAME)

  if (authCookie) {
    _headers.set('Authorization', authCookie)
  }

  return {
    method,
    headers: _headers,
  }
}
