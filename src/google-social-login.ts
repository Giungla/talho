import {
  FunctionErrorPattern,
  FunctionSucceededPattern, GoogleContinueOAuthResponse,
  ICookieOptions,
  ISplitCookieObject
} from "../global";

(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '
  const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra'

  function setCookie (name: string, value: string | number | boolean, options: ICookieOptions = {}): string {
    if (name.length === 0) {
      throw new Error("'setCookie' should receive a valid cookie name")
    }

    if (!['string', 'number', 'boolean'].includes(typeof value) || value.toString().length === 0) {
      throw new Error("'setCookie' should receive a valid cookie value")
    }

    const cookieOptions: string[] = [`${name}=${value}`]

    if (options?.expires && options?.expires instanceof Date) {
      cookieOptions.push(`expires=` + options.expires.toUTCString())
    }

    if (options?.sameSite && typeof options?.sameSite === 'string') {
      cookieOptions.push(`SameSite=${options?.sameSite}`)
    }

    if (options?.path) {
      cookieOptions.push(`path=${options?.path}`)
    }

    if (options?.domain) {
      cookieOptions.push(`domain=${options?.path}`)
    }

    if (options?.httpOnly) {
      cookieOptions.push(`HttpOnly`)
    }

    if (options?.secure) {
      cookieOptions.push('Secure')
    }

    const _buildCookie = cookieOptions.join(COOKIE_SEPARATOR)

    document.cookie = _buildCookie

    return _buildCookie
  }

  function getCookie (name: string): string | false {
    const selectedCookie = document.cookie
      .split(COOKIE_SEPARATOR)
      .find(cookie => {
        const { name: cookieName } = splitCookie(cookie)

        return cookieName === name
      })

    return selectedCookie
      ? splitCookie(selectedCookie).value
      : false
  }

  function splitCookie (cookie: string): ISplitCookieObject {
    const [name, value] = cookie.split('=')

    return {
      name,
      value
    }
  }

  function isAuthenticated (): boolean {
    const hasAuth = getCookie(COOKIE_NAME)

    return !!hasAuth
  }

  if (isAuthenticated()) {
    location.href = USER_DATA_PATH

    return
  }

  function postErrorResponse (message: string): FunctionErrorPattern {
    return {
      message,
      succeeded: false
    }
  }

  function postSuccessResponse <T = void> (response: T): FunctionSucceededPattern<T> {
    return {
      data: response,
      succeeded: true
    }
  }

  async function GoogleContinueOAuth (code: string | false): Promise<FunctionSucceededPattern<GoogleContinueOAuthResponse> | FunctionErrorPattern> {
    const defaultErrorMessage = 'Houve uma falha na autenticação via Google. Por favor, tente novamente mais tarde.'

    if (code === false) {
      return postErrorResponse(defaultErrorMessage)
    }

    const url = new URL('https://xef5-44zo-gegm.b2.xano.io/api:h_RKfex8/oauth/google/continue')

    url.searchParams.set('code', code)
    url.searchParams.set('redirect_uri', location.origin.concat(location.pathname))

    const currentURL = new URL(location.href)

    const removalKeys: string[] = [
      'code',
      'scope',
      'authuser',
      'hd',
      'prompt'
    ];

    for (const key of removalKeys) {
      currentURL.searchParams.delete(key)
    }

    history.replaceState(null, '', currentURL.toString())

    try {
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: GoogleContinueOAuthResponse = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  const search = new URLSearchParams(location.search)

  GoogleContinueOAuth(search.get('code') ?? false).then(result => {
    if (!result.succeeded) {
      return console.warn('[Social Login] %s', result.message)
    }

    setCookie(COOKIE_NAME, result.data.token, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(result.data.maxAge)
    })

    location.href = USER_DATA_PATH
  })
})()