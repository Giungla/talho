
import type {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  INewsletterSuccessfulResponse,
  IPasswordPayload,
  ValidatorScheme
} from '../global'

import {
  XANO_BASE_URL,
  GENERAL_HIDDEN_CLASS,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  querySelector,
  attachEvent,
  isPageLoading,
  isAuthenticated,
  toggleClass,
  addClass,
  changeTextContent,
  stringify,
  removeAttribute,
  removeClass,
  objectSize,
  focusInput,
  addAttribute,
  buildURL,
  validatePasswordParts,
  isStrictEquals,
} from '../utils'

(function () {
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const DISABLED_ATTR = 'disabled'
  const WRAPPER_SELECTOR = '[data-wtf-wrapper]'

  const FOCUS_OPTIONS: FocusOptions = {
    preventScroll: false
  }

  if (!isAuthenticated()) {
    location.href = buildURL('/acessos/entrar', {
      redirect_to: encodeURIComponent(location.pathname)
    })

    return
  }

  function camelToKebabCase (str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  function handleMessages (form: ReturnType<typeof querySelector<'form'>>, response: Awaited<ReturnType<typeof updatePassword>>): void {
    if (!form) return

    const isError = !response.succeeded

    const errorMessage = querySelector('[data-wtf-error-update-password]', form)
    const successMessage = querySelector('[data-wtf-success-update-password]', form)

    toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (!isError) {
      successMessage && setTimeout(() => addClass(successMessage, GENERAL_HIDDEN_CLASS), 8000)

      return
    }

    const textElement = errorMessage && querySelector('div', errorMessage)

    changeTextContent(textElement, response.message)
  }

  function validatorResponse (datasetName: string) {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function applyWrapperError (element: Exclude<ReturnType<typeof querySelector>, null>, isValid: boolean) {
    const wrapperElement = element.closest(WRAPPER_SELECTOR)

    toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid)
  }

  async function updatePassword (payload: IPasswordPayload): Promise<FunctionSucceededPattern<INewsletterSuccessfulResponse> | FunctionErrorPattern> {
    const defaultErrorMessage = 'Houve uma falha ao atualizar sua senha. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/change-password`, {
        ...buildRequestOptions([], 'PUT'),
        body: stringify<IPasswordPayload>(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
      }

      const data: INewsletterSuccessfulResponse = await response.json()

      return postSuccessResponse.call(response, data)
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

  const validators: ValidatorScheme[] = [
    { field: passwordField,        validator: validatePassword },
    { field: confirmPasswordField, validator: validateConfirmPassword },
  ]

  for (const { field, validator } of validators) {
    if (!field) continue

    attachEvent(field, 'blur', validator)

    attachEvent(field, 'input', () => applyWrapperError(field, true))
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

    changeTextContent(messageArea, message)
  }

  function hasEqualsPasswords <T extends ReturnType<typeof querySelector<'input'>>> (password: T, confirmPassword: T): boolean {
    return password && confirmPassword && isStrictEquals(password?.value, confirmPassword?.value)
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

  attachEvent(updatePasswordForm, 'submit', async (e: Event) => {
    e.preventDefault()
    e.stopPropagation()

    addAttribute(submit, DISABLED_ATTR, DISABLED_ATTR)

    const failed = validators
      .map(({ validator }) => validator)
      .find(_validator => isStrictEquals(_validator().at(1), false))

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

    isPageLoading(true)

    const response = await updatePassword({
      password: updatePasswordForm?.password.value as string,
      confirm_password: updatePasswordForm?.confirm_password.value as string
    })

    handleMessages(updatePasswordForm, response)

    removeAttribute(submit, DISABLED_ATTR)

    if (!response.succeeded) return isPageLoading(false)

    updatePasswordForm.reset()

    isPageLoading(false)
  })

  isPageLoading(false)
})()
