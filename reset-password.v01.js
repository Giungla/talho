(function () {

  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const GENERAL_HIDDEN_CLASS = 'oculto'

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
        const error = await response.text()

        return {
          error: true,
          data: JSON.parse(error)
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
    location.href = '/dados-de-usuario'

    return
  }

  const _resetForm = querySelector('[data-wf-user-form-type="resetPassword"]')

  _resetForm.removeAttribute('data-wf-user-form-type')

  const previousSiblingFormElement = _resetForm.previousElementSibling

  _resetForm.remove()

  previousSiblingFormElement.insertAdjacentHTML('afterend', _resetForm.outerHTML)

  const resetForm = querySelector('[data-wtf-recover-password-block]')

  const mailField = querySelector('[data-wtf-email]')
  const mailFieldWrapper = querySelector('[data-wtf-email-wrapper]')

  const successMessage = querySelector('[data-wtf-success-message]')

  const generalErrorMessage = querySelector('[data-wtf-general-error-message]')

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateMailField () {
    const isMailValid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(mailField.value)

    mailFieldWrapper.classList.toggle('mensagemdeerro', !isMailValid && mailField.value.length > 0)

    return [isMailValid, 'wtfEmail']
  }

  attachEvent(mailField, 'blur', validateMailField, false);
  attachEvent(mailField, 'input', function () {
    mailFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(resetForm, 'submit', async function (e) {
    e.preventDefault()
    e.stopPropagation()

    if (!validateMailField().at(0)) {
      generalErrorMessage.classList.remove(GENERAL_HIDDEN_CLASS)

      return
    }

    const response = await sendMagicLink(mailField.value)

    successMessage.classList.toggle(GENERAL_HIDDEN_CLASS, response.error)
    generalErrorMessage.classList.toggle(GENERAL_HIDDEN_CLASS, !response.error)
  }, false)

})()
