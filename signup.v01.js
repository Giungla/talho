(function () {

  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const GENERAL_HIDDEN_CLASS = 'oculto'

  /**
   * @type {ScrollIntoViewOptions}
   */
  const SCROLL_INTO_VIEW_DEFAULT_ARGS = {
    block: 'center',
    behavior: 'smooth'
  }

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
   * @param text {string}
   * @returns    {string}
   */
  function normalizeText (text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  /**
   * @param element {HTMLElement}
   * @param args    {IScrollIntoViewArgs}
   */
  function scrollIntoView (element, args) {
    element.scrollIntoView(args)
  }

  /**
   * @param name    {string}
   * @param value   {string | number | boolean}
   * @param options {ICookieOptions}
   * @returns       {string}
   */
  function setCookie (name, value, options = {}) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error("'setCookie' should receive a valid cookie name")
    }

    if (!['string', 'number', 'boolean'].includes(typeof value) || value.toString().length === 0) {
      throw new Error("'setCookie' should receive a valid cookie value")
    }

    /** @type {string[]} */
    const cookieOptions = [`${name}=${value}`]

    if (options?.expires && options?.expires instanceof Date) {
      cookieOptions.push(`expires=` + options.expires.toGMTString())
    }

    if (options?.sameSite && typeof options?.sameSite === 'string') {
      cookieOptions.push(`SameSite=${options?.sameSite}`)
    }

    if (options?.path && typeof options.path === 'string') {
      cookieOptions.push(`path=${options?.path}`)
    }

    if (options?.domain && typeof options.domain === 'string') {
      cookieOptions.push(`domain=${options?.path}`)
    }

    if (options?.httpOnly && typeof options.httpOnly === 'boolean') {
      cookieOptions.push(`HttpOnly`)
    }

    if (options?.secure && typeof options.secure === 'boolean') {
      cookieOptions.push('Secure')
    }

    const _buildCookie = cookieOptions.join(COOKIE_SEPARATOR)

    document.cookie = _buildCookie

    return _buildCookie
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
   * @param payload {ISignUpParam}
   * @returns       {Promise<ISignInResponse>}
   */
  async function signupUser ({ name, email, password, optin, consent }) {
    try {
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/auth/signup`, {
        mode: 'cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          optin,
          consent,
          password
        })
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
        data: null,
        error: true
      }
    }
  }

  if (isAuthenticated()) {
    location.href = '/dados-de-usuario'

    return
  }

  const form = querySelector('[data-wf-user-form-type="signup"]')

  const removalAttributes = [
    'name',
    'data-name',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey',
    'data-wf-user-form-type'
  ];

  for (let attr of removalAttributes) {
    form.removeAttribute(attr)
  }

  const previousSibling = form.previousElementSibling

  form.remove()

  previousSibling.insertAdjacentHTML('afterend', form.outerHTML)

  const signupForm = previousSibling.nextElementSibling

  const nameField = querySelector('[data-wtf-user]', signupForm)
  const nameErrorField = querySelector('[data-wtf-user-error]')
  const nameWrapperField = querySelector('[data-wtf-user-wrapper]')

  const emailField = querySelector('[data-wtf-email]', signupForm)
  const emailErrorField = querySelector('[data-wtf-email-error]')
  const emailWrapperField = querySelector('[data-wtf-email-wrapper]')

  const passField = querySelector('[data-wtf-password]', signupForm)
  const passErrorField = querySelector('[data-wtf-password-error]')
  const passFieldWrapper = querySelector('[data-wtf-password-wrapper]')

  const consentField = querySelector('[data-wtf-consent]')
  const consentErrorField = querySelector('[data-wtf-consent-error]')
  const consentWrapperField = querySelector('[data-wtf-consent-wrapper]')

  const privacyField = querySelector('[data-wtf-optin]', signupForm)

  const submitForm = querySelector('input[type="submit"]', signupForm)

  const successSignMessage = querySelector('[data-wtf-success-message]', signupForm)

  const errorSignMessages = signupForm.querySelectorAll('[data-wtf-create-account-error-message]')

  const generalErrorMessage = querySelector('[data-wtf-create-account-error-message-general]')
  const alreadyRegisteredMessage = querySelector('[data-wtf-create-account-error-message-registered-email]')
  const inactiveAccountMessage = querySelector('[data-wtf-create-account-error-message-inactive-account]')

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateNameField () {
    const isValidName = /^(\w{2,})(\s+(\w+))+$/.test(normalizeText(nameField.value).trim().replace(/\s{2,}/g, ' '))

    nameWrapperField.classList.toggle('mensagemdeerro', !isValidName && nameField.value.length > 0)

    return [isValidName, 'wtfUser']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateEmailField () {
    const isValidEmail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(emailField.value)

    emailWrapperField.classList.toggle('mensagemdeerro', !isValidEmail && emailField.value.length > 0)

    return [isValidEmail, 'wtfEmail']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validatePassField () {
    const isValidPass = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/g.test(passField.value)

    passFieldWrapper.classList.toggle('mensagemdeerro', !isValidPass && passField.value.length > 0)

    return [isValidPass, 'wtfPassword']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateConsentField () {
    const hasConsent = consentField.checked

    consentWrapperField.classList.toggle('mensagemdeerro', !hasConsent)

    return [hasConsent, 'wtfConsent']
  }

  // Field name event handlers
  attachEvent(nameField, 'blur', validateNameField, false)
  attachEvent(nameField, 'input', function () {
    nameWrapperField.classList.remove('mensagemdeerro')
  }, false)

  // Field e-mail event handlers
  attachEvent(emailField, 'blur', validateEmailField, false)
  attachEvent(nameField, 'input', function () {
    emailWrapperField.classList.remove('mensagemdeerro')
  }, false)

  // Field password event handlers
  attachEvent(passField, 'blur', validatePassField, false)
  attachEvent(passField, 'input', function () {
    passFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(consentField, 'input', validateConsentField, false)

  document.querySelectorAll('.w-checkbox-input').forEach(_el => {
    if (_el.nextElementSibling.type === 'checkbox') {
      attachEvent(_el.nextElementSibling, 'input', function (e) {
        e.preventDefault()
        e.stopPropagation()

        _el.classList.toggle('w--redirected-checked-custom', e.checked)
      }, false)
    }
  })

  attachEvent(signupForm, 'submit', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    let cancelRequest = false

    const validateFields = [
      validateNameField,
      validateEmailField,
      validatePassField,
      validateConsentField,
    ]

    for (let index = 0, len = validateFields.length; index < len; index++) {
      const validator = validateFields[index]

      const [ isValid, name ] = validator?.()

      if (!isValid && !cancelRequest) cancelRequest = true
    }

    if (cancelRequest) {
      generalErrorMessage.classList.remove(GENERAL_HIDDEN_CLASS)

      setTimeout(() => {
        scrollIntoView(generalErrorMessage, SCROLL_INTO_VIEW_DEFAULT_ARGS)
      }, 500)

      return
    }

    successSignMessage.classList.toggle(GENERAL_HIDDEN_CLASS, true)
    errorSignMessages.forEach(errorMessage => errorMessage.classList.add(GENERAL_HIDDEN_CLASS))

    const response = await signupUser({
      name: nameField.value,
      email: emailField.value,
      password: passField.value,
      optin: consentField.checked,
      consent: privacyField.checked
    })

    successSignMessage.classList.toggle(GENERAL_HIDDEN_CLASS, response.error)

    if (!response.error) return

    switch (response.data?.payload?.reason) {
      case 'ACCOUNT_EXISTS':
        alreadyRegisteredMessage.classList.remove(GENERAL_HIDDEN_CLASS)
        break
      default:
        generalErrorMessage.classList.remove(GENERAL_HIDDEN_CLASS)
    }
  })

})()
