import {
  FunctionErrorPattern, FunctionSucceededPattern,
  ILoginUserPayload,
  IResetPasswordSuccessResponse,
  ISplitCookieObject,
  ResponsePattern, ValidatorResponse
} from "../global";

(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const GENERAL_HIDDEN_CLASS = 'oculto'

  const DISABLED_ATTR = 'disabled'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const WRAPPER_SELECTOR = '[data-wtf-wrapper]'

  const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra'
  const formSelector = '#wf-form-recover-password'

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

  function validatorResponse (datasetName: string): ValidatorResponse {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function applyWrapperError (element: ReturnType<typeof querySelector>, isValid: boolean) {
    if (!element) return

    const wrapperElement = element.closest(WRAPPER_SELECTOR)

    wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid)
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

  function removeAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string) {
    if (!element) return

    element.removeAttribute(qualifiedName)
  }

  function removeClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.remove(...className)
  }

  function toggleClass (element: ReturnType<typeof querySelector>, className: string, force?: boolean): boolean {
    if (!element) return false

    return element.classList.toggle(className, force)
  }

  function handleMessages (form: ReturnType<typeof querySelector<'form'>>, response: Awaited<ReturnType<typeof sendMagicLink>>) {
    const isError = !response.succeeded

    if (!form) return

    const errorMessage = querySelector<'div'>('[data-wtf-general-error-message]', form)
    const successMessage = querySelector<'div'>('[data-wtf-success-message]', form)

    toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (!isError) return

    const textElement = errorMessage && querySelector('div', errorMessage)

    if (!textElement) return

    textElement.textContent = response.message
  }

  async function sendMagicLink (email: string): Promise<ResponsePattern<IResetPasswordSuccessResponse>> {
    const defaultErrorMessage = 'Houve uma falha ao enviar o token. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:uImEuFxO/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: IResetPasswordSuccessResponse = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  if (isAuthenticated()) {
    location.href = USER_DATA_PATH

    return
  }

  const _resetForm = querySelector<'form'>(formSelector)

  if (_resetForm) {
    const removalAttributes = [
      'name',
      'method',
      'data-name',
      'aria-label',
      'data-wf-page-id',
      'data-wf-element-id',
      'data-turnstile-sitekey'
    ]

    for (const attr of removalAttributes) {
      removeAttribute(_resetForm, attr)
    }

    const parentNode = _resetForm.parentNode as HTMLElement

    _resetForm.remove()

    removeClass(parentNode, 'w-form')

    parentNode.insertAdjacentHTML('afterbegin', _resetForm.outerHTML)
  }

  const resetForm = querySelector<'form'>(formSelector)

  const formSubmit = querySelector<'input'>('[type="submit"]', resetForm)

  removeAttribute(formSubmit, DISABLED_ATTR)

  const mailField = querySelector<'input'>('[data-wtf-user]')

  function validateMailField () {
    const response = validatorResponse('wtfEmail')

    if (!mailField) return response(false)

    const isFieldValid = /^(([\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+)*)|("[\p{L}\p{N}\s!#$%&'*+\/=?^_`{|}~.-]+"))@(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}|(\[(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\]))$/u.test(mailField.value)

    applyWrapperError(mailField, isFieldValid)

    return response(isFieldValid)
  }

  attachEvent(mailField, 'blur', validateMailField)
  attachEvent(mailField, 'input', () => applyWrapperError(mailField, true))

  attachEvent(resetForm, 'submit', function (e) {
    e.preventDefault()
    e.stopPropagation()

    formSubmit?.setAttribute(DISABLED_ATTR, DISABLED_ATTR)

    const [ , isFieldValid ] = validateMailField()

    if (!isFieldValid) {
      handleMessages(resetForm, postErrorResponse('Houve uma falha ao validar seus dados. Por favor, tente novamente.'))

      return removeAttribute(formSubmit, DISABLED_ATTR)
    }

    sendMagicLink(mailField?.value ?? '').then(response => {
      handleMessages(resetForm, response)

      removeAttribute(formSubmit, DISABLED_ATTR)

      response.succeeded && resetForm?.reset()
    })
  }, false)

})()
