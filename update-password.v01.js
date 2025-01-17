
(function () {

  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const GENERAL_HIDDEN_CLASS = 'oculto'

  if (!isAuthenticated()) {
    location.href = '/log-in'

    return
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
   * @param status {boolean}
   */
  function isPageLoading (status) {
    querySelector('[data-wtf-loader]').classList.toggle('oculto', !status)
  }

  /**
   * @returns {boolean}
   */
  function isAuthenticated () {
    const hasAuth = getCookie(COOKIE_NAME)

    return !!hasAuth
  }

  /**
   * @param passwords {IPasswordPayload}
   * @returns         {Promise<IPasswordResponse>}
   */
  async function updatePassword (passwords) {
    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/update_password', {
        mode: 'cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getCookie(COOKIE_NAME)
        },
        body: JSON.stringify(passwords)
      })

      if (!response.ok) {
        return {
          data: null,
          error: true
        }
      }

      await response.json()

      return {
        data: null,
        error: false
      }
    } catch (e) {
      return {
        data: null,
        error: true
      }
    }
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validatePasswordField () {
    const isFieldValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/g.test(passwordField.value)

    passwordFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfPasswordUpdate']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateConfirmPasswordField () {
    const isFieldValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/g.test(passwordConfirmField.value)

    passwordConfirmFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfPasswordUpdate']
  }

  const _updatePasswordForm = querySelector('[data-wf-element-id="2afe31a7-3143-e8ef-1bea-7c12a831a82e"]')

  const removalAttributes = [
    'id',
    'name',
    'data-name',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ];

  for (let attr of removalAttributes) {
    _updatePasswordForm.removeAttribute(attr)
  }

  const parentNode = _updatePasswordForm.parentElement

  _updatePasswordForm.remove()

  parentNode.insertAdjacentHTML('afterbegin', _updatePasswordForm.outerHTML)

  const updatePasswordForm = parentNode.firstChild

  querySelector('input[type="submit"]', updatePasswordForm).removeAttribute('disabled')

  for (const webflowMessageElement of ['.w-form-done', '.w-form-fail']) {
    querySelector(webflowMessageElement, updatePasswordForm.parentElement)?.remove()
  }

  const logoutButton = querySelector('[data-wtf-logout]')

  const passwordField = querySelector('[data-wtf-password-update]')
  const passwordFieldWrapper = querySelector('[data-wtf-password-update-wrapper]')

  const passwordConfirmField = querySelector('[data-wtf-confirm-password-update]')
  const passwordConfirmFieldWrapper = querySelector('[data-wtf-confirm-password-update-wrapper]')

  const generalErrorMessage = querySelector('[data-wtf-update-password-error-message]')
  const generalSuccessMessage = querySelector('[data-wtf-password-update-success-message]')

  attachEvent(logoutButton, 'click', function (e) {
    e.preventDefault()
    e.stopPropagation()

    setCookie(COOKIE_NAME, 'null', {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(0)
    })

    location.href = e.currentTarget?.href !== '#'
      ? e.currentTarget?.href
      : '/log-in'
  }, false)

  attachEvent(passwordField, 'blur', validatePasswordField, false)
  attachEvent(passwordField, 'input', function () {
    passwordFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(passwordConfirmField, 'blur', validateConfirmPasswordField, false)
  attachEvent(passwordConfirmField, 'input', function () {
    passwordConfirmFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(updatePasswordForm, 'submit', async function (e) {
    e.preventDefault()
    e.stopPropagation()

    isPageLoading(true)

    const isPasswordsEquals = passwordField.value === passwordConfirmField.value

    generalSuccessMessage.classList.add(GENERAL_HIDDEN_CLASS)
    generalErrorMessage.classList.toggle(GENERAL_HIDDEN_CLASS, isPasswordsEquals)

    if (!isPasswordsEquals) return isPageLoading(false)

    const { error } = await updatePassword({
      password: passwordField.value,
      confirm_password: passwordConfirmField.value
    })

    if (!error) {
      updatePasswordForm.reset()
    }

    generalSuccessMessage.classList.toggle(GENERAL_HIDDEN_CLASS, error)
    generalErrorMessage.classList.toggle(GENERAL_HIDDEN_CLASS, !error)

    isPageLoading(false)
  }, false)

  isPageLoading(false)

})()
