
import type {
  ResponsePattern,
  INewsletterParams,
  INewsletterSuccessfulResponse,
} from '../global'

import {
  GENERAL_HIDDEN_CLASS,
  addClass,
  toggleClass,
  removeClass,
  attachEvent,
  focusInput,
  querySelector,
  changeTextContent,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  stringify,
  EMAIL_REGEX_VALIDATION,
} from '../utils'

(function () {
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'

  async function handleNewsletterFormSubmit (event: SubmitEvent): Promise<void> {
    event.preventDefault()
    event.stopPropagation()

    const target = event.target as HTMLFormElement

    if (!target) return

    const callbackValidation = [validateMailField, validateConsentField].find(callback => {
      const isFieldValid = callback(target).at(1)

      return !isFieldValid
    })

    if (callbackValidation) {
      const [ name ] = callbackValidation(target)

      const attributeName = `[data-${camelToKebabCase(name as string)}]`

      focusInput(querySelector(attributeName, target), {
        preventScroll: false,
      })

      return
    }

    const response = await postNewsletter({
      email: target?.email?.value,
      accepted_terms: target?.consent?.checked ?? false
    })

    handleMessages(target, response)

    target.reset()

    removeClass(querySelector('.w--redirected-checked', target), 'w--redirected-checked')
  }

  function handleMessages (form: HTMLFormElement, response: Awaited<ReturnType<typeof postNewsletter>>) {
    const isError = !response.succeeded

    const errorMessage = querySelector('[data-wtf-error-optin-email]', form)
    const successMessage = querySelector('[data-wtf-success-optin-email]', form)

    toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (isError) {
      return changeTextContent(errorMessage && querySelector('div', errorMessage), response.message)
    }

    const textElement = successMessage && querySelector('div', successMessage)

    if (textElement) textElement.textContent = response.data.message

    setTimeout(() => {
      addClass(errorMessage, GENERAL_HIDDEN_CLASS)
      addClass(successMessage, GENERAL_HIDDEN_CLASS)
    }, 8000)
  }

  async function postNewsletter (payload: INewsletterParams): Promise<ResponsePattern<INewsletterSuccessfulResponse>> {
    const defaultErrorMessage = 'Houve uma falha ao enviar o e-mail, tente novamente em breve!'

    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:KAULUI1C/newsletter', {
        ...buildRequestOptions([], 'POST'),
        body: stringify<INewsletterParams>(payload)
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

  function validatorResponse (datasetName: string) {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function camelToKebabCase (str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  function applyWrapperError (element: Exclude<ReturnType<typeof querySelector>, null>, isValid: boolean) {
    const wrapperElement = element.closest('[data-wtf-wrapper]')

    toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, isValid)
  }

  function validateMailField (formElement: ReturnType<typeof querySelector<'form'>>) {
    const response = validatorResponse('wtfEmail')

    if (!formElement) return response(false)

    const mailField = querySelector<'input'>('[data-wtf-email]', formElement)

    if (!mailField) return response(false)

    const isFieldValid = EMAIL_REGEX_VALIDATION().test(mailField.value)

    applyWrapperError(mailField, !isFieldValid)

    return response(isFieldValid)
  }

  function validateConsentField (formElement: ReturnType<typeof querySelector<'form'>>) {
    const response = validatorResponse('wtfConsent')

    if (!formElement) return response(false)

    const consentField = querySelector<'input'>('[data-wtf-consent]', formElement)

    if (!consentField) return response(false)

    const isConsentValid = consentField.checked

    applyWrapperError(consentField, !isConsentValid)

    return response(isConsentValid)
  }

  const newsletterForms = ['#wf-form-Optin-Form-Mobile', '#wf-form-Optin-Form-Desktop']

  const removeAttributes = [
    'name',
    'data-name',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ]

  for (const id of newsletterForms) {
    const _form = querySelector<'form'>(id)

    if (!_form) continue

    for (const attr of removeAttributes) {
      _form.removeAttribute(attr)
    }

    const formParentNode = _form.parentNode

    _form.remove()

    if (formParentNode && formParentNode instanceof HTMLElement) {
      removeClass(formParentNode, 'w-form')

      formParentNode.insertAdjacentHTML('afterbegin', _form.outerHTML)

      const form = querySelector<'form'>(id, formParentNode)

      if (!form) return

      attachEvent(form, 'submit', handleNewsletterFormSubmit, false)

      addClass(formParentNode, 'w-form')

      querySelector('input[type="submit"]', form)?.removeAttribute('disabled')
    }
  }

  document
    .querySelectorAll('form [data-wtf-email]')
    .forEach(field => {
      attachEvent(field as HTMLInputElement, 'blur', () => validateMailField(field.closest('form')), false)

      attachEvent(field as HTMLInputElement, 'input', () => {
        removeClass(field.closest('[data-wtf-wrapper]'), ERROR_MESSAGE_CLASS)
      }, false)
    })

  document
    .querySelectorAll('form [data-wtf-consent]')
    .forEach(field => {
      attachEvent(field as HTMLInputElement, 'input', () => validateConsentField(field.closest('form')), false)
    })
})()