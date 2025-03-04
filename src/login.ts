import {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  ICookieOptions, IGoogleAuthURLResponse,
  ILoginUser,
  ILoginUserPayload,
  ISplitCookieObject, ResponsePattern
} from "../global";

(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const DISABLED_ATTR = 'disabled'
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const ORDERS_PAGE_PATH = '/area-do-usuario/pedidos-de-compra'

  const REDIRECT_PARAM_NAME = 'redirect_to'

  const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io'

  const GENERAL_ERROR_MESSAGE_SELECTOR = '[data-wtf-general-error-message]'

  const SCROLL_INTO_VIEW_DEFAULT_ARGS: ScrollIntoViewOptions = {
    block: 'center',
    behavior: 'smooth'
  }

  const FOCUS_OPTIONS: FocusOptions = {
    preventScroll: false
  }

  function attachEvent <
    T extends HTMLElement | Document,
    K extends T extends HTMLElement
      ? keyof HTMLElementEventMap
      : keyof DocumentEventMap
  > (
    node: T | null,
    eventName: K,
    callback: (event: T extends HTMLElement
      ? HTMLElementEventMap[K extends keyof HTMLElementEventMap ? K : never]
      : DocumentEventMap[K extends keyof DocumentEventMap ? K : never]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): VoidFunction | void {
    if (!node) return

    node.addEventListener(eventName, callback as EventListener, options)

    return () => node.removeEventListener(eventName, callback as EventListener, options)
  }

  function querySelector<
    K extends keyof HTMLElementTagNameMap,
    T extends HTMLElementTagNameMap[K] | Element | null = HTMLElementTagNameMap[K] | null
  >(
    selector: K | string,
    node: HTMLElement | Document | null = document
  ): T {
    if (!node) return null as T

    return node.querySelector(selector as string) as T;
  }

  function scrollIntoView (element: HTMLElement, args: ScrollIntoViewOptions) {
    element.scrollIntoView(args)
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

  async function loginUser (credentials: ILoginUser): Promise<ResponsePattern<ILoginUserPayload>> {
    const defaultErrorMessage = 'Houve uma falha ao realizar o login. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:t3reRXiD/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: ILoginUserPayload = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  async function getGoogleAuthorizationURL (): Promise<ResponsePattern<IGoogleAuthURLResponse>> {
    const defaultErrorMessage = 'Houve uma falha na autorização Google. Por favor, tente novamente mais tarde.'

    const url = new URL(`${XANO_BASE_URL}/api:h_RKfex8/oauth/google/init`)

    url.searchParams.set('redirect_uri', location.origin.concat('/acessos/google-social-login'))

    try {
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: IGoogleAuthURLResponse = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  function objectSize (value: string | Array<any>): number {
    return value.length
  }

  function addClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.add(...className)
  }

  function removeClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.remove(...className)
  }

  function toggleClass (element: ReturnType<typeof querySelector>, className: string, force?: boolean): boolean {
    if (!element) return false

    return element.classList.toggle(className, force)
  }

  function camelToKebabCase (str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  function removeAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string) {
    if (!element) return

    element.removeAttribute(qualifiedName)
  }

  function focusInput (input: ReturnType<typeof querySelector<'input'>>, options?: FocusOptions) {
    if (!input) return

    input.focus(options)
  }

  function whereRedirectAfterSuccessfulLogin (): string {
    const currentURL = new URL(location.href)

    const redirectTo = currentURL.searchParams.get(REDIRECT_PARAM_NAME)

    return redirectTo
      ? decodeURIComponent(redirectTo)
      : ORDERS_PAGE_PATH
  }

  if (isAuthenticated()) {
    location.href = whereRedirectAfterSuccessfulLogin()

    return
  }

  const _loginForm = querySelector<'form'>('#wf-form-login')

  const removalAttributes = [
    'name',
    'method',
    'aria-label',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ];

  if (_loginForm) {
    for (let attr of removalAttributes) {
      removeAttribute(_loginForm, attr)
    }

    const parentNode = _loginForm.parentNode as HTMLElement

    removeClass(parentNode, 'w-form')

    _loginForm.remove()

    parentNode.insertAdjacentHTML('afterbegin', _loginForm.outerHTML)
  }

  const loginForm = querySelector<'form'>('#wf-form-login')

  const searchParams = new URLSearchParams(location.search)

  const userField = querySelector<'input'>('[data-wtf-user]')
  const passField = querySelector<'input'>('[data-wtf-password]')

  const loginSubmitButton = querySelector<'button'>('[type="submit"]', loginForm)

  const socialLoginGoogleCTA = querySelector<'a'>('[data-wtf-google]')

  if (searchParams.has('email')) {
    if (userField) {
      userField.value = searchParams.get('email') ?? ''
    }

    focusInput(passField, FOCUS_OPTIONS)
  } else {
    focusInput(userField, FOCUS_OPTIONS)
  }

  function validatorResponse (datasetName: string) {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function applyWrapperError (element: ReturnType<typeof querySelector>, isValid: boolean) {
    if (!element) return

    const wrapperElement = element.closest('[data-wtf-wrapper]')

    wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid)
  }

  function clearMessage (form: ReturnType<typeof querySelector<'form'>>) {
    if (!form) return

    addClass(querySelector(GENERAL_ERROR_MESSAGE_SELECTOR, form), GENERAL_HIDDEN_CLASS)
  }

  function handleMessages (form: HTMLFormElement, response: Awaited<ReturnType<typeof loginUser>>) {
    const isError = !response.succeeded

    const errorMessage = querySelector(GENERAL_ERROR_MESSAGE_SELECTOR, form)

    toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)

    if (!isError) return

    const textElement = errorMessage && querySelector('div', errorMessage)

    if (!textElement) return

    textElement.textContent = response.message
  }

  function validateUserField () {
    const response = validatorResponse('wtfUser')

    if (!userField) return response(false)

    const isFieldValid = /^(([\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+)*)|("[\p{L}\p{N}\s!#$%&'*+\/=?^_`{|}~.-]+"))@(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}|(\[(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\]))$/u.test(userField.value)

    applyWrapperError(userField, isFieldValid)

    return response(isFieldValid)
  }

  function validatePassField () {
    const response = validatorResponse('wtfPassword')

    if (!passField) return response(false)

    const isFieldValid = objectSize(passField.value) > 7

    applyWrapperError(passField, isFieldValid)

    return response(isFieldValid)
  }

  attachEvent(socialLoginGoogleCTA, 'click', function (e) {
    e.preventDefault()

    getGoogleAuthorizationURL()
      .then(result => {
        if (!result.succeeded) {
          // TODO: Display a error message letting user know about this error
          return
        }

        location.href = result.data.authUrl
      })
  }, { once: true })

  const validators = [
    { field: userField, validator: validateUserField },
    { field: passField, validator: validatePassField },
  ]

  for (const { field, validator } of validators) {
    attachEvent(field, 'blur', validator)

    attachEvent(field, 'input', () => applyWrapperError(field, true))
  }

  if (!loginForm) {
    console.warn('[WithTheFlow] Form was not founded at this page')

    return
  }

  attachEvent(loginForm, 'submit', async (e: SubmitEvent) => {
    loginSubmitButton?.setAttribute(DISABLED_ATTR, DISABLED_ATTR)

    e.preventDefault()
    e.stopPropagation()

    clearMessage(loginForm)

    const _validators = validators.map(({ validator }) => validator)

    const failed = _validators.find(validator => validator().at(1) === false)

    if (failed) {
      const attribute = camelToKebabCase(failed().at(0) as string)

      focusInput(
        querySelector<'input'>(`[data-${attribute}]`, loginForm),
        FOCUS_OPTIONS
      )

      return removeAttribute(loginSubmitButton, DISABLED_ATTR)
    }

    const response = await loginUser({
      email: userField?.value as string,
      password: passField?.value as string,
    })

    if (response.succeeded) {
      setCookie(COOKIE_NAME, response.data.authToken, {
        path: '/',
        secure: true,
        sameSite: 'Strict',
        expires: new Date(response.data.expiration)
      })

      location.href = whereRedirectAfterSuccessfulLogin()

      return
    }

    handleMessages(loginForm, postErrorResponse(response.message))

    removeAttribute(loginSubmitButton, DISABLED_ATTR)
  })

  removeAttribute(loginSubmitButton, DISABLED_ATTR)
})()
