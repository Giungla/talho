import {
  IGoogleAuthURLResponse,
  ILoginUser,
  ILoginUserPayload,
  ResponsePattern
} from "../global";

import {
  XANO_BASE_URL,
  AUTH_COOKIE_NAME,
  GENERAL_HIDDEN_CLASS,
  setCookie,
  objectSize,
  addClass,
  removeClass,
  toggleClass,
  attachEvent,
  removeAttribute,
  isAuthenticated,
  focusInput,
  querySelector,
  changeTextContent,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  EMAIL_REGEX_VALIDATION,
  stringify,
} from '../utils'

(function () {
  const DISABLED_ATTR = 'disabled'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const ORDERS_PAGE_PATH = '/area-do-usuario/pedidos-de-compra'

  const REDIRECT_PARAM_NAME = 'redirect_to'

  const GENERAL_ERROR_MESSAGE_SELECTOR = '[data-wtf-general-error-message]'

  const FOCUS_OPTIONS: FocusOptions = {
    preventScroll: false
  }

  async function loginUser (credentials: ILoginUser): Promise<ResponsePattern<ILoginUserPayload>> {
    const defaultErrorMessage = 'Houve uma falha ao realizar o login. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:t3reRXiD/auth/login`, {
        ...buildRequestOptions([], 'POST'),
        body: stringify<ILoginUser>(credentials)
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
      }

      const data: ILoginUserPayload = await response.json()

      return postSuccessResponse.call(response.headers, data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  async function getGoogleAuthorizationURL (): Promise<ResponsePattern<IGoogleAuthURLResponse>> {
    const defaultErrorMessage = 'Houve uma falha na autorização Google. Por favor, tente novamente mais tarde.'

    const url = new URL(`${XANO_BASE_URL}/api:h_RKfex8/oauth/google/init`)

    url.searchParams.set('redirect_uri', location.origin.concat('/acessos/google-social-login'))

    try {
      const response = await fetch(url, {
        ...buildRequestOptions(),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
      }

      const data: IGoogleAuthURLResponse = await response.json()

      return postSuccessResponse.call(response.headers, data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  function camelToKebabCase (str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
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

    toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid)
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

    changeTextContent(textElement, response.message)
  }

  function validateUserField () {
    const response = validatorResponse('wtfUser')

    if (!userField) return response(false)

    const isFieldValid = EMAIL_REGEX_VALIDATION().test(userField.value)

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

  attachEvent(socialLoginGoogleCTA, 'click', function (e: MouseEvent) {
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
      setCookie(AUTH_COOKIE_NAME, response.data.authToken, {
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
