import {
  FunctionErrorPattern, FunctionSucceededPattern,
  IScrollIntoViewArgs, ISignUpParam,
  ISplitCookieObject,
  ResponsePattern, SignupResponse,
} from "../global";

(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const DISABLED_ATTR = 'disabled'
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const WRAPPER_SELECTOR = '[data-wtf-wrapper]'

  const FOCUS_OPTIONS: FocusOptions = {
    preventScroll: false
  }

  const SCROLL_INTO_VIEW_DEFAULT_ARGS: ScrollIntoViewOptions = {
    block: 'center',
    behavior: 'smooth'
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

  function normalizeText (text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  function focusInput (input: ReturnType<typeof querySelector<'input'>>, options?: FocusOptions) {
    if (!input) return

    input.focus(options)
  }

  function scrollIntoView (element: ReturnType<typeof querySelector>, args: IScrollIntoViewArgs) {
    if (!element) return

    element.scrollIntoView(args)
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

  function camelToKebabCase (str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  function handleMessages (form: ReturnType<typeof querySelector<'form'>>, response: Awaited<ReturnType<typeof signupUser>>): void {
    const isError = !response.succeeded

    const successMessage = querySelector<'div'>('[data-wtf-success-message]', form)

    toggleClass(generalErrorMessage, GENERAL_HIDDEN_CLASS, !isError)
    toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (!isError) {
      setTimeout(() => addClass(successMessage, GENERAL_HIDDEN_CLASS), 8000)

      return
    }

    changeErrorMessage(response.message, generalErrorMessage)
  }

  function addAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string, value: string) {
    if (!element) return

    element.setAttribute(qualifiedName, value)
  }

  function removeAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string) {
    if (!element) return

    element.removeAttribute(qualifiedName)
  }

  function validatorResponse (datasetName: string): (valid: boolean) => [string, boolean] {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function toggleClass (element: ReturnType<typeof querySelector>, className: string, force?: boolean): boolean {
    if (!element) return false

    return element.classList.toggle(className, force)
  }

  function applyWrapperError (element: ReturnType<typeof querySelector>, isValid: boolean) {
    if (!element) return

    const wrapperElement = element.closest('[data-wtf-wrapper]')

    wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid)
  }

  function postErrorResponse (message: string): FunctionErrorPattern {
    return {
      message,
      succeeded: false,
    }
  }

  function postSuccessResponse <T = void> (response: T): FunctionSucceededPattern<T> {
    return {
      data: response,
      succeeded: true,
    }
  }

  async function signupUser (payload: ISignUpParam): Promise<ResponsePattern<SignupResponse>> {
    const defaultErrorMessage = 'Houve uma falha ao realizar o cadastro. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:t3reRXiD/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: SignupResponse = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  if (isAuthenticated()) {
    location.href = '/area-do-usuario/pedidos-de-compra'

    return
  }

  const form = querySelector<'form'>('#wf-form-register')

  if (form) {
    const removalAttributes = [
      'name',
      'method',
      'data-name',
      'aria-label',
      'data-wf-page-id',
      'data-wf-element-id',
      'data-turnstile-sitekey',
      'data-wf-user-form-type'
    ];

    for (let attr of removalAttributes) {
      removeAttribute(form, attr)
    }

    const parentNode = form.parentElement as HTMLElement

    removeClass(parentNode, 'w-form')

    form.remove()

    parentNode.insertAdjacentHTML('afterbegin', form.outerHTML)
  }

  const signupForm = querySelector<'form'>('#wf-form-register')

  const generalErrorMessage = querySelector('[data-wtf-general-error-message]', signupForm)

  const nameField = querySelector<'input'>('[data-wtf-name]', signupForm)
  const lastNameField = querySelector<'input'>('[data-wtf-last-name]', signupForm)
  const emailField = querySelector<'input'>('[data-wtf-email]', signupForm)
  const passField = querySelector<'input'>('[data-wtf-password]', signupForm)
  const consentField = querySelector<'input'>('[data-wtf-consent]', signupForm)
  const privacyField = querySelector<'input'>('[data-wtf-optin]', signupForm)

  const submitForm = querySelector<'input'>('input[type="submit"]', signupForm)

  function changeErrorMessage (message: string, errorElement: ReturnType<typeof querySelector>) {
    if (!errorElement) return

    const errorMessageElement = querySelector('div', errorElement as HTMLElement)

    if (!errorMessageElement) return

    errorMessageElement.textContent = message
  }

  function passwordMismatchMessage ({ hasNumber, hasLowercase, hasUppercase, hasMinLength, hasSpecialChar }: ReturnType<typeof validatePasswordParts>): string | false {
    const message = (quantifier: number, missing: string) => `Sua senha deve conter pelo menos ${quantifier} ${missing}.`

    if (!hasMinLength) return message(8, 'caracteres')

    if (!hasNumber) return message(1, 'número')

    if (!hasSpecialChar) return message(1, 'caractere especial')

    if (!hasLowercase) return message(1, 'letra minúscula')

    if (!hasUppercase) return message(1, 'letra maiúscula')

    return false
  }

  function updateFieldErrorMessage (field: ReturnType<typeof querySelector<'input'>>, message: string) {
    if (!field) return

    const wrapper = field.closest(WRAPPER_SELECTOR) as HTMLElement

    if (!wrapper) return

    const messageArea = querySelector<'div'>('[data-wtf-field-error] div', wrapper)

    if (!messageArea) return

    messageArea.textContent = message
  }

  function textTestRegex (value: string): (value: RegExp) => boolean {
    return (regex: RegExp) => regex.test(value)
  }

  function validatePasswordParts (password: string) {
    const testRegex = textTestRegex(password)

    return {
      hasNumber: testRegex(/\d/),
      hasLowercase: testRegex(/[a-z]/),
      hasUppercase: testRegex(/[A-Z]/),
      hasMinLength: testRegex(/.{8,}/),
      hasSpecialChar: testRegex(/[!@#$%^&*()_+{}\[\]:;<>,.?\/~\\-]/),
    }
  }

  function objectSize (value: string | Array<any>): number {
    return value.length
  }

  function isNameValid (name: string): boolean {
    return /^[a-zA-Z\s]+$/.test(name)
  }

  function validateNameField () {
    const response = validatorResponse('wtfUser')

    if (!nameField) return response(false)

    const cleanName = normalizeText(nameField.value).trim().replace(/\s{2,}/g, ' ')

    const isFieldValid = objectSize(cleanName) > 1 && isNameValid(cleanName)

    applyWrapperError(nameField, isFieldValid)

    return response(isFieldValid)
  }

  function validateLastNameField () {
    const response = validatorResponse('wtfLastName')

    if (!lastNameField) return response(false)

    const cleanName = normalizeText(lastNameField.value).trim().replace(/\s{2,}/g, ' ')

    const isFieldValid = objectSize(cleanName) > 0 && isNameValid(cleanName)

    applyWrapperError(lastNameField, isFieldValid)

    return response(isFieldValid)
  }

  function validateEmailField () {
    const response = validatorResponse('wtfEmail')

    if (!emailField) return response(false)

    const isFieldValid = /^(([\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+)*)|("[\p{L}\p{N}\s!#$%&'*+\/=?^_`{|}~.-]+"))@(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}|(\[(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\]))$/u.test(emailField.value)

    applyWrapperError(emailField, isFieldValid)

    return response(isFieldValid)
  }

  function validatePassField () {
    const response = validatorResponse('wtfPassword')

    if (!passField) return response(false)

    const {
      hasNumber,
      hasLowercase,
      hasUppercase,
      hasMinLength,
      hasSpecialChar,
    } = validatePasswordParts(passField.value)

    const message = passwordMismatchMessage({
      hasNumber,
      hasLowercase,
      hasUppercase,
      hasMinLength,
      hasSpecialChar,
    })

    const isFieldValid = hasNumber && hasLowercase && hasUppercase && hasSpecialChar && hasMinLength

    updateFieldErrorMessage(passField, message || '')

    applyWrapperError(passField, isFieldValid)

    return response(isFieldValid)
  }

  function validateConsentField () {
    const response = validatorResponse('wtfConsent')

    if (!consentField) return response(false)

    const hasConsent = consentField.checked

    applyWrapperError(consentField, hasConsent)

    return response(hasConsent)
  }

  function addClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.add(...className)
  }

  function removeClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.remove(...className)
  }

  const validators = [
    { field: nameField,     validator: validateNameField     },
    { field: lastNameField, validator: validateLastNameField },
    { field: emailField,    validator: validateEmailField    },
    { field: passField,     validator: validatePassField     },
  ]

  for (const { field, validator } of validators) {
    attachEvent(field, 'blur', validator)

    attachEvent(field, 'input', () => applyWrapperError(field, true))
  }

  attachEvent(consentField, 'input', validateConsentField, false)

  attachEvent(signupForm, 'reset', () => {
    const checkedClass = 'w--redirected-checked'

    document.querySelectorAll<HTMLDivElement>(`#${signupForm?.id} .${checkedClass}`).forEach(element => {
      removeClass(element, checkedClass)
    })
  })

  attachEvent(signupForm, 'submit', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    addAttribute(submitForm, DISABLED_ATTR, DISABLED_ATTR)

    const failed = validators.find(({ validator }) => validator().at(1) === false)

    if (failed) {
      handleMessages(signupForm, postErrorResponse('Houve uma falha ao validar os seus dados. Por favor, tente novamente.'))

      focusInput(failed.field, FOCUS_OPTIONS)

      return removeAttribute(submitForm, DISABLED_ATTR)
    }

    const response = await signupUser({
      name: nameField?.value as string,
      lastName: lastNameField?.value as string,
      email: emailField?.value as string,
      password: passField?.value as string,
      optin: privacyField?.checked as boolean,
      consent: consentField?.checked as boolean,
    })

    handleMessages(signupForm, response)

    removeAttribute(submitForm, DISABLED_ATTR)

    if (!response.succeeded) {
      return
    }

    signupForm?.reset()

    scrollIntoView(generalErrorMessage, SCROLL_INTO_VIEW_DEFAULT_ARGS)
  })

  addClass(signupForm?.parentElement as HTMLElement, 'w-form')

  removeAttribute(submitForm, DISABLED_ATTR)
})()
