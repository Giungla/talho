
import {
  FunctionErrorPattern,
  FunctionSucceededPattern, ICurrentUserData, INewsletterSuccessfulResponse,
  IPasswordPayload,
  ISplitCookieObject, ValidatorScheme
} from '../global';

(function () {
  const COOKIE_SEPARATOR = '; '
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const COOKIE_NAME = '__Host-Talho-AuthToken'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const DISABLED_ATTR = 'disabled'
  const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io'
  const WRAPPER_SELECTOR = '[data-wtf-wrapper]'

  const FOCUS_OPTIONS: FocusOptions = {
    preventScroll: false
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
    return getCookie(COOKIE_NAME) !== false
  }

  if (!isAuthenticated()) {
    const encodedCurrentPath = encodeURIComponent(location.pathname)

    location.href = `/acessos/entrar?redirect_to=${encodedCurrentPath}`

    return
  }

  function addAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string, value: string) {
    if (!element) return

    element.setAttribute(qualifiedName, value)
  }

  function removeAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string) {
    if (!element) return

    element.removeAttribute(qualifiedName)
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

  function objectSize (value: string | Array<any>): number {
    return value.length
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

  function handleMessages (form: ReturnType<typeof querySelector<'form'>>, response: Awaited<ReturnType<typeof updatePassword>>): void {
    if (!form) return

    const isError = !response.succeeded

    const errorMessage = querySelector('[data-wtf-error-update-password]', form)
    const successMessage = querySelector('[data-wtf-success-update-password]', form)

    errorMessage && toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    successMessage && toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (!isError) {
      successMessage && setTimeout(() => addClass(successMessage, GENERAL_HIDDEN_CLASS), 8000)

      return
    }

    const textElement = errorMessage && querySelector('div', errorMessage)

    if (!textElement) return

    textElement.textContent = response.message
  }

  function validatorResponse (datasetName: string) {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function applyWrapperError (element: Exclude<ReturnType<typeof querySelector>, null>, isValid: boolean) {
    const wrapperElement = element.closest(WRAPPER_SELECTOR)

    wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid)
  }

  function focusInput (input: ReturnType<typeof querySelector<'input'>>, options?: FocusOptions) {
    if (!input) return

    input.focus(options)
  }

  async function updatePassword (payload: IPasswordPayload): Promise<FunctionSucceededPattern<INewsletterSuccessfulResponse> | FunctionErrorPattern> {
    const defaultErrorMessage = 'Houve uma falha ao atualizar sua senha. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getCookie(COOKIE_NAME) as string,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: INewsletterSuccessfulResponse = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  const _updatePasswordForm = querySelector<'form'>('#wf-form-update-password')

  const removeAttributes = [
    'name',
    'method',
    'data-name',
    'aria-label',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ]

  if (_updatePasswordForm) {
    for (const attribute of removeAttributes) {
      removeAttribute(_updatePasswordForm, attribute)
    }

    const parentElement = _updatePasswordForm.parentElement as HTMLElement

    removeClass(parentElement, 'w-form')

    _updatePasswordForm.remove()

    parentElement.insertAdjacentHTML('afterbegin', _updatePasswordForm.outerHTML)
  }

  const passwordField = querySelector<'input'>('[data-wtf-password]')
  const confirmPasswordField = querySelector<'input'>('[data-wtf-confirm-password]')

  function textTestRegex (value: string): (value: RegExp) => boolean {
    return (regex: RegExp) => regex.test(value)
  }

  const validators: ValidatorScheme[] = [
    { field: passwordField,        validator: validatePassword },
    { field: confirmPasswordField, validator: validateConfirmPassword },
  ]

  for (const { field, validator } of validators) {
    if (!field) continue

    attachEvent(field, 'blur', validator)

    attachEvent(field, 'input', () => applyWrapperError(field, true))
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

  function passwordMismatchMessage ({ hasNumber, hasLowercase, hasUppercase, hasMinLength, hasSpecialChar }: ReturnType<typeof validatePasswordParts>): string | false {
    const message = (quantifier: number, missing: string) => `Sua senha deve conter pelo menos ${quantifier} ${missing}`

    if (!hasMinLength) return message(8, 'caracteres')

    if (!hasNumber) return message(1, 'número')

    if (!hasSpecialChar) return message(1, 'caractere especial')

    if (!hasLowercase) return message(1, 'letra minúscula')

    if (!hasUppercase) return message(1, 'letra maiúscula')

    return false
  }

  function updateFieldErrorMessage (field: ReturnType<typeof querySelector<'input'>>, message: string) {
    if (!field) return

    const messageArea = querySelector<'div'>('[data-wtf-field-error] div', field.closest(WRAPPER_SELECTOR) as HTMLElement)

    if (!messageArea) return

    messageArea.textContent = message
  }

  function hasEqualsPasswords <T extends ReturnType<typeof querySelector<'input'>>> (password: T, confirmPassword: T): boolean {
    return password && confirmPassword && password?.value === confirmPassword?.value
  }

  function validatePassword () {
    const response = validatorResponse('wtfPassword')

    if (!passwordField) return response(false)

    const {
      hasNumber,
      hasMinLength,
      hasLowercase,
      hasUppercase,
      hasSpecialChar,
    } = validatePasswordParts(passwordField.value)

    const isFieldValid = hasNumber && hasLowercase && hasUppercase && hasSpecialChar && hasMinLength

    const message = passwordMismatchMessage({
      hasNumber,
      hasLowercase,
      hasUppercase,
      hasMinLength,
      hasSpecialChar,
    })

    updateFieldErrorMessage(passwordField, message || '')

    applyWrapperError(passwordField, isFieldValid)

    if (objectSize(confirmPasswordField?.value ?? '') > 0 && hasEqualsPasswords(passwordField, confirmPasswordField)) {
      validateConfirmPassword()
    }

    return response(isFieldValid)
  }

  function validateConfirmPassword () {
    const response = validatorResponse('wtfConfirmPassword')

    const isFieldValid = hasEqualsPasswords(passwordField, confirmPasswordField)

    updateFieldErrorMessage(
      confirmPasswordField,
      isFieldValid
        ? ''
        : 'As senhas informadas não conferem'
    )

    confirmPasswordField && applyWrapperError(confirmPasswordField, isFieldValid)

    return response(isFieldValid)
  }

  const updatePasswordForm = querySelector<'form'>('#wf-form-update-password')

  const submit = querySelector<'input'>('[type="submit"]', updatePasswordForm)

  removeAttribute(submit, DISABLED_ATTR)

  if (!updatePasswordForm) return

  attachEvent(updatePasswordForm, 'submit', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    addAttribute(submit, DISABLED_ATTR, DISABLED_ATTR)

    const failed = validators
      .map(({ validator }) => validator)
      .find(_validator => _validator().at(1) === false)

    if (failed) {
      const attribute = camelToKebabCase(failed().at(0) as string)

      const failedField = querySelector<'input'>(`[data-${attribute}]`, updatePasswordForm)

      focusInput(failedField, FOCUS_OPTIONS)

      setTimeout(() => {
        failedField?.dispatchEvent(new FocusEvent('blur'))

        focusInput(failedField, FOCUS_OPTIONS)
      }, 0)

      return removeAttribute(submit, DISABLED_ATTR)
    }

    const response = await updatePassword({
      password: updatePasswordForm?.password.value as string,
      confirm_password: updatePasswordForm?.confirm_password.value as string
    })

    handleMessages(updatePasswordForm, response)

    removeAttribute(submit, DISABLED_ATTR)

    if (!response.succeeded) return

    updatePasswordForm.reset()
  })

})()
