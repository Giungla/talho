(function () {

  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const GENERAL_HIDDEN_CLASS = 'oculto'

  const DISABLED_ATTR = 'disabled'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'

  /**
   * @param node      {HTMLElement | Document}
   * @param eventName {string}
   * @param callback  {EventListener | EventListenerObject}
   * @param options=  {boolean | AddEventListenerOptions}
   * @returns         {function (): void}
   */
  function attachEvent (node, eventName, callback, options) {
    node.addEventListener(eventName, callback, options)

    return () => node.removeEventListener(eventName, callback, options)
  }

  /**
   * @param selector {keyof HTMLElementTagNameMap | string}
   * @param node     {HTMLElement | Document} - optional
   * @returns        {HTMLElementTagNameMap[keyof HTMLElementTagNameMap] | null}
   */
  function querySelector (selector, node = document) {
    return node.querySelector(selector)
  }

  /**
   * @param name {string}
   * @returns    {string | false}
   */
  function getCookie (name) {
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

  /**
   * @param cookie {string}
   * @returns      {ISplitCookieObject}
   */
  function splitCookie (cookie) {
    const [name, value] = cookie.split('=')

    return {
      name,
      value
    }
  }

  /**
   * @returns {boolean}
   */
  function isAuthenticated () {
    const hasAuth = getCookie(COOKIE_NAME)

    return !!hasAuth
  }

  /**
   * @param email {string}
   * @returns     {Promise<ISignInResponse<IResetPasswordSuccessResponse>>}
   */
  async function sendMagicLink (email) {
    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:uImEuFxO/auth/magic-link', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          email
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()

        return {
          error: true,
          data: error
        }
      }

      const data = await response.json()

      return {
        data,
        error: false
      }
    } catch (e) {
      return {
        data: e,
        error: true
      }
    }
  }

  if (isAuthenticated()) {
    location.href = '/acessos/dados-de-usuario'

    return
  }

  function captureForm () {
    return querySelector('#email-form')
  }

  const _resetForm = captureForm()

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
    _resetForm.removeAttribute(attr)
  }

  const parentNode = _resetForm.parentNode

  _resetForm.remove()

  parentNode.insertAdjacentHTML('afterbegin', _resetForm.outerHTML)

  const resetForm = captureForm()

  const formSubmit = querySelector('[type="submit"]', resetForm)

  formSubmit.removeAttribute(DISABLED_ATTR)

  const mailField = querySelector('[data-wtf-user]')
  const mailFieldWrapper = querySelector('[data-wtf-user-wrapper]')

  const successMessage = querySelector('[data-wtf-success-message]')

  const generalErrorMessage = querySelector('[data-wtf-general-error-message]')

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateMailField () {
    const isMailValid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(mailField.value)

    mailFieldWrapper.classList.toggle(ERROR_MESSAGE_CLASS, !isMailValid && mailField.value.length > 0)

    return [isMailValid, 'wtfEmail']
  }

  attachEvent(mailField, 'blur', validateMailField, false);
  attachEvent(mailField, 'input', function () {
    mailFieldWrapper.classList.remove(ERROR_MESSAGE_CLASS)
  }, false)

  attachEvent(resetForm, 'submit', function (e) {
    formSubmit.setAttribute(DISABLED_ATTR, DISABLED_ATTR)

    e.preventDefault()
    e.stopPropagation()

    if (!validateMailField().at(0)) {
      generalErrorMessage.classList.remove(GENERAL_HIDDEN_CLASS)

      return formSubmit.removeAttribute(DISABLED_ATTR)
    }

    sendMagicLink(mailField.value)
      .then(response => {
        const isError = response.error

        successMessage.classList.toggle(GENERAL_HIDDEN_CLASS, isError)
        generalErrorMessage.classList.toggle(GENERAL_HIDDEN_CLASS, !isError)

        if (!isError) return

        querySelector('div', generalErrorMessage).textContent = response.data.message

        formSubmit.removeAttribute(DISABLED_ATTR)
      })
  }, false)

})()
