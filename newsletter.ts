import {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  INewsletterParams,
  INewsletterSuccessfulResponse
} from "./global";

(function () {
  'use strict';

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

  function attachEvent <
    T extends HTMLElement | Document,
    K extends T extends HTMLElement
      ? keyof HTMLElementEventMap
      : keyof DocumentEventMap
  > (
    node: T,
    eventName: K,
    callback: (event: T extends HTMLElement
      ? HTMLElementEventMap[K extends keyof HTMLElementEventMap ? K : never]
      : DocumentEventMap[K extends keyof DocumentEventMap ? K : never]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): VoidFunction {
    node.addEventListener(eventName, callback as EventListener, options)

    return () => node.removeEventListener(eventName, callback as EventListener, options)
  }

  function addClass (element: Element, ...className: string[]) {
    element.classList.add(...className)
  }

  function removeClass (element: Element, ...className: string[]) {
    element.classList.remove(...className)
  }

  function toggleClass (element: Element, className: string, force?: boolean) {
    element.classList.toggle(className, force)
  }

  async function handleNewsletterFormSubmit (event: SubmitEvent): Promise<void> {
    event.preventDefault()
    event.stopPropagation()

    const target = event.target as HTMLFormElement

    if (!target) return

    const response = await postNewsletter({
      email: target?.email?.value
    })

    handleMessages(target, response)

    target.reset()
    addClass(target, GENERAL_HIDDEN_CLASS)
  }

  function handleMessages (form: HTMLFormElement, response: Awaited<ReturnType<typeof postNewsletter>>) {
    const isError = !response.succeeded

    const errorMessage = querySelector('[data-wtf-error-optin-email]', form)
    const successMessage = querySelector('[data-wtf-success-optin-email]', form)

    errorMessage && toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    successMessage && toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (isError) {
      const textElement = errorMessage && querySelector('div', errorMessage)

      if (textElement) textElement.textContent = response.message

      return
    }

    const textElement = successMessage && querySelector('div', successMessage)

    if (textElement) textElement.textContent = response.data.message

    setTimeout(() => {
      errorMessage && addClass(errorMessage, GENERAL_HIDDEN_CLASS)
      successMessage && addClass(successMessage, GENERAL_HIDDEN_CLASS)
    }, 8000)
  }

  async function postNewsletter (payload: INewsletterParams): Promise<FunctionSucceededPattern<INewsletterSuccessfulResponse> | FunctionErrorPattern> {
    const defaultErrorMessage = 'Houve uma falha ao enviar o e-mail, tente novamente em breve!'

    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:KAULUI1C/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()

        return {
          succeeded: false,
          message: error?.message ?? defaultErrorMessage
        }
      }

      const data: INewsletterSuccessfulResponse = await response.json()

      return {
        succeeded: true,
        data: {
          message: data.message
        }
      }
    } catch (e) {
      return {
        succeeded: false,
        message: defaultErrorMessage
      }
    }
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
    const _form = querySelector(id)

    if (!_form) continue

    for (const attr of removeAttributes) {
      _form.removeAttribute(attr)
    }

    querySelector('input[type="submit"]', _form)?.removeAttribute('disabled')

    const formParentNode = _form.parentNode

    _form.remove()

    if (formParentNode && formParentNode instanceof HTMLElement) {
      removeClass(formParentNode, 'w-form')

      formParentNode.insertAdjacentHTML('afterbegin', _form.outerHTML)

      const form = querySelector('form', formParentNode)

      if (!form) return

      attachEvent(form as HTMLFormElement, 'submit', handleNewsletterFormSubmit, false)

      addClass(form.parentElement as HTMLElement, 'w-form')
    }
  }
})()