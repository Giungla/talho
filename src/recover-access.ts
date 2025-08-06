
import type {
  ResponsePattern,
  ValidatorResponse,
  IResetPasswordSuccessResponse,
} from '../global'

import {
  XANO_BASE_URL,
  GENERAL_HIDDEN_CLASS,
  toggleClass,
  removeClass,
  attachEvent,
  querySelector,
  removeAttribute,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  EMAIL_REGEX_VALIDATION,
  changeTextContent,
  addAttribute,
  isAuthenticated, stringify,
} from '../utils'

(function () {
  const DISABLED_ATTR = 'disabled'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'
  const WRAPPER_SELECTOR = '[data-wtf-wrapper]'

  const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra'
  const formSelector = '#wf-form-recover-password'

  function validatorResponse (datasetName: string): ValidatorResponse {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function applyWrapperError (element: ReturnType<typeof querySelector>, isValid: boolean) {
    if (!element) return

    toggleClass(element.closest(WRAPPER_SELECTOR), ERROR_MESSAGE_CLASS, !isValid)
  }

  function handleMessages (form: ReturnType<typeof querySelector<'form'>>, response: Awaited<ReturnType<typeof sendMagicLink>>) {
    const isError = !response.succeeded

    if (!form) return

    const errorMessage = querySelector<'div'>('[data-wtf-general-error-message]', form)
    const successMessage = querySelector<'div'>('[data-wtf-success-message]', form)

    toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (!isError) return

    changeTextContent(
      errorMessage && querySelector('div', errorMessage),
      response.message,
    )
  }

  async function sendMagicLink (email: string): Promise<ResponsePattern<IResetPasswordSuccessResponse>> {
    const defaultErrorMessage = 'Houve uma falha ao enviar o token. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:uImEuFxO/auth/magic-link`, {
        ...buildRequestOptions([], 'POST'),
        body: stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
      }

      const data: IResetPasswordSuccessResponse = await response.json()

      return postSuccessResponse.call(response, data)
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

    const isFieldValid = EMAIL_REGEX_VALIDATION().test(mailField.value)

    applyWrapperError(mailField, isFieldValid)

    return response(isFieldValid)
  }

  attachEvent(mailField, 'blur', validateMailField)
  attachEvent(mailField, 'input', () => applyWrapperError(mailField, true))

  attachEvent(resetForm, 'submit', function (e: SubmitEvent) {
    e.preventDefault()
    e.stopPropagation()

    addAttribute(formSubmit, DISABLED_ATTR, DISABLED_ATTR)

    const [ , isFieldValid ] = validateMailField()

    if (!isFieldValid) {
      handleMessages(resetForm, postErrorResponse('Houve uma falha ao validar seus dados. Por favor, tente novamente.'))

      return removeAttribute(formSubmit, DISABLED_ATTR)
    }

    sendMagicLink(mailField?.value ?? '')
      .then(response => {
        handleMessages(resetForm, response)

        removeAttribute(formSubmit, DISABLED_ATTR)

        response.succeeded && resetForm?.reset()
      })
  }, false)

})()
