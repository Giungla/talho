import {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  ICookieOptions,
  ILoginUserPayload,
  ISplitCookieObject,
  ResponsePattern
} from "../global";

(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'
  const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra'

  const COOKIE_SEPARATOR = '; '

  const GENERAL_HIDDEN_CLASS = 'oculto'

  function querySelector<
    K extends keyof HTMLElementTagNameMap,
    T extends HTMLElementTagNameMap[K] | Element | null = HTMLElementTagNameMap[K] | null
  >(
    selector: K | string,
    node: HTMLElement | Document = document
  ): T {
    return node.querySelector(selector as string) as T;
  }

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

  function removeClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.remove(...className)
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

  async function validateMagicLink (magic_token: string): Promise<ResponsePattern<ILoginUserPayload>> {
    const defaultErrorMessage = 'Houve uma falha ao validar o token. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:uImEuFxO/auth/magic-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          magic_token
        })
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const token: ILoginUserPayload = await response.json()

      return postSuccessResponse(token)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  const urlSearch = new URLSearchParams(location.search)
  const errorMessage = querySelector<'div'>('[data-wtf-recover-access-general-error-message]')

  const token = urlSearch.get('token')

  if (!token) return

  validateMagicLink(token).then(response => {
    const isError = !response.succeeded

    if (isError) {
      const textErrorMessage = errorMessage && querySelector('div', errorMessage)

      removeClass(errorMessage, GENERAL_HIDDEN_CLASS)

      if (textErrorMessage) textErrorMessage.textContent = response.message

      return
    }

    setCookie(COOKIE_NAME, response.data.authToken, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(response.data.expiration)
    })

    location.href = USER_DATA_PATH
  })

})()
