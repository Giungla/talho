
import type {
  ISignUpParam,
  SignupResponse,
  ResponsePattern,
} from '../global'

import {
  XANO_BASE_URL,
  GENERAL_HIDDEN_CLASS,
  SCROLL_INTO_VIEW_DEFAULT_ARGS,
  objectSize,
  normalizeText,
  addAttribute,
  attachEvent,
  addClass,
  toggleClass,
  removeClass,
  querySelector,
  removeAttribute,
  postErrorResponse,
  changeTextContent,
  focusInput,
  scrollIntoView,
  postSuccessResponse,
  buildRequestOptions,
  isAuthenticated,
  EMAIL_REGEX_VALIDATION,
  stringify,
} from '../utils'

(function () {
  const DISABLED_ATTR = 'disabled'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const WRAPPER_SELECTOR = '[data-wtf-wrapper]'

  const FOCUS_OPTIONS: FocusOptions = {
    preventScroll: false
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

  function validatorResponse (datasetName: string): (valid: boolean) => [string, boolean] {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function applyWrapperError (element: ReturnType<typeof querySelector>, isValid: boolean) {
    if (!element) return

    toggleClass(element.closest('[data-wtf-wrapper]'), ERROR_MESSAGE_CLASS, !isValid)
  }

  async function signupUser (payload: ISignUpParam): Promise<ResponsePattern<SignupResponse>> {
    const defaultErrorMessage = 'Houve uma falha ao realizar o cadastro. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:t3reRXiD/auth/signup`, {
        ...buildRequestOptions([], 'POST'),
        body: stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
      }

      const data: SignupResponse = await response.json()

      return postSuccessResponse.call(response.headers, data)
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

    changeTextContent(errorMessageElement, message)
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

    changeTextContent(querySelector<'div'>('[data-wtf-field-error] div', wrapper), message)
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

  function isNameValid (name: string): boolean {
    return /^[a-zA-Z\s]+$/.test(name)
  }

  function validateNameField () {
    const response = validatorResponse('wtfUser')

    if (!nameField) return response(false)

    const cleanName = normalizeText(nameField.value)
      .trim()
      .replace(/\s{2,}/g, ' ')

    const isFieldValid = objectSize(cleanName) > 1 && isNameValid(cleanName)

    applyWrapperError(nameField, isFieldValid)

    return response(isFieldValid)
  }

  function validateLastNameField () {
    const response = validatorResponse('wtfLastName')

    if (!lastNameField) return response(false)

    const cleanName = normalizeText(lastNameField.value)
      .trim()
      .replace(/\s{2,}/g, ' ')

    const isFieldValid = objectSize(cleanName) > 0 && isNameValid(cleanName)

    applyWrapperError(lastNameField, isFieldValid)

    return response(isFieldValid)
  }

  function validateEmailField () {
    const response = validatorResponse('wtfEmail')

    if (!emailField) return response(false)

    const isFieldValid = EMAIL_REGEX_VALIDATION().test(emailField.value)

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

  attachEvent(signupForm, 'submit', async (e: SubmitEvent) => {
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

    if (!response.succeeded) return

    signupForm?.reset()

    scrollIntoView(generalErrorMessage, SCROLL_INTO_VIEW_DEFAULT_ARGS)
  })

  addClass(signupForm?.parentElement as HTMLElement, 'w-form')

  removeAttribute(submitForm, DISABLED_ATTR)
})()
