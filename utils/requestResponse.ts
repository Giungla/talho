
import type {
  HttpMethod,
  FunctionErrorPattern,
  FunctionSucceededPattern,
} from "../global"

import {
  buildURL,
  getCookie,
  setCookie,
  timestampDays
} from "./index"

export const UNAUTHENTICATED_RESPONSE_STATUS = 401

export const AUTH_COOKIE_NAME = '__Host-Talho-AuthToken'
export const TALHO_SESSION_COOKIE_NAME = '__Host-Talho-Session-Cookie'
export const TALHO_SESSION_HEADER_NAME = 'X-Talho-Session'

function handleResponseStatus (response?: Response): void {
  if (!response || response.status !== UNAUTHENTICATED_RESPONSE_STATUS) return

  location.href = buildURL('/acessos/entrar', {
    redirect_to: encodeURIComponent(location.pathname + location.search),
  })
}

export function handleSession (response?: Response): void {
  const session = response?.headers.get(TALHO_SESSION_HEADER_NAME)

  if (!session) return

  setCookie(TALHO_SESSION_COOKIE_NAME, session, {
    path: '/',
    secure: true,
    sameSite: 'Strict',
    expires: new Date(Date.now() + timestampDays(14)),
  })
}

export function postErrorResponse (this: Response | undefined, message: string): FunctionErrorPattern {
  handleSession(this)

  handleResponseStatus(this)

  return {
    message,
    succeeded: false
  }
}

export function postSuccessResponse <T> (this: Response | undefined, response: T): FunctionSucceededPattern<T> {
  handleSession(this)

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
