
import {
  type ICookieOptions,
  type FunctionErrorPattern,
  type ResponsePatternCallback,
  type FunctionSucceededPattern,
} from "../global"

import {
  timestampDays,
} from './dates'

import {
  buildURL,
} from './dom'

import {
  getCookie,
  setCookie,
} from './cookie'

import {
  CookieSameSite,
} from '../types/cookie'

import {
  SLASH_STRING,
} from './consts'

import {
  EnumHttpMethods,
  type HttpMethods,
} from '../types/http'

export const UNAUTHENTICATED_RESPONSE_STATUS = 401

export const AUTH_COOKIE_NAME = '__Host-Talho-AuthToken'
export const TALHO_SESSION_COOKIE_NAME = '__Host-Talho-Session-Cookie'
export const TALHO_SESSION_HEADER_NAME = 'X-Talho-Session'

export const GET = 'GET'
export const HEAD = 'HEAD'
export const POST = 'POST'
export const PUT = 'PUT'
export const PATCH = 'PATCH'
export const DELETE = 'DELETE'

export const BUILD_URL_DEFAULT_OPTION = {
  redirect_to: encodeURIComponent(location.pathname + location.search),
}

export const DEFAULT_SESSION_COOKIE_OPTIONS: ICookieOptions = {
  path: SLASH_STRING,
  secure: true,
  sameSite: CookieSameSite.STRICT,
  expires: new Date(Date.now() + timestampDays(14)),
}

function handleResponseStatus (response?: Response): void {
  if (!response || response.status !== UNAUTHENTICATED_RESPONSE_STATUS) return

  unAuthenticatedRedirect()
}

export function unAuthenticatedRedirect (path = '/acessos/entrar', redirectOptions: Record<string, string> = BUILD_URL_DEFAULT_OPTION): void {
  location.href = buildURL(path, redirectOptions)
}

export function handleSession (response?: Response): void {
  const session = response?.headers.get(TALHO_SESSION_HEADER_NAME)

  if (!session) return

  setCookie(
    TALHO_SESSION_COOKIE_NAME,
    session,
    DEFAULT_SESSION_COOKIE_OPTIONS,
  )
}

export function postErrorResponse (
  message: string,
  skipRedirectIfUnauthenticated?: boolean,
  callback?: ResponsePatternCallback,
): FunctionErrorPattern;
export function postErrorResponse (
  this: Response,
  message: string,
  skipRedirectIfUnauthenticated?: boolean,
  callback?: ResponsePatternCallback,
): FunctionErrorPattern;
export function postErrorResponse (
  this: Response | undefined,
  message: string,
  skipRedirectIfUnauthenticated: boolean = false,
  callback?: ResponsePatternCallback,
): FunctionErrorPattern {
  handleSession(this)

  if (!skipRedirectIfUnauthenticated) {
    handleResponseStatus(this)
  }

  callback?.()

  return {
    message,
    succeeded: false
  }
}

export function postSuccessResponse <T extends unknown> (
  response: T,
  callback?: ResponsePatternCallback,
): FunctionSucceededPattern<T>;
export function postSuccessResponse <T extends unknown> (
  this: Response,
  response: T,
  callback?: ResponsePatternCallback,
): FunctionSucceededPattern<T>;
export function postSuccessResponse <T extends unknown> (
  this: Response | undefined,
  response: T,
  callback?: ResponsePatternCallback,
): FunctionSucceededPattern<T> {
  handleSession(this)

  callback?.()

  return {
    data: response,
    succeeded: true
  }
}

export function buildRequestOptions (headers: [string, string][] = [], method: HttpMethods = EnumHttpMethods.GET): Pick<RequestInit, 'method' | 'headers'> {
  const applicationJson = 'application/json'

  const _headers = new Headers({
    'Accept': applicationJson,
    'Content-Type': applicationJson,
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
