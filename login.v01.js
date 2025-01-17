(function () {

  'use strict';

  const COOKIE_NAME = '__Host-IYS-AuthToken'

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
   * @param payload {ILoginUser}
   * @returns       {Promise<ISignInResponse<ILoginUserPayload>>}
   */
  async function loginUser ({ email, password }) {
    try {
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/auth/login`, {
        mode: 'cors',
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
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

      /**
       * @type {ILoginUserPayload}
       */
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

  /**
   * @returns {Promise<string|boolean>}
   */
  async function getGoogleAuthorizationURL () {
    const url = new URL('https://xef5-44zo-gegm.b2.xano.io/api:h_RKfex8/oauth/google/init')

    url.searchParams.set('redirect_uri', location.origin.concat('/google-social-login'))

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      const authURL = new URL(data.authUrl)

      authURL.searchParams.set('access_type', 'offline')

      return authURL.toString()
    } catch (e) {
      return false
    }
  }

  if (isAuthenticated()) {
    location.href = '/dados-de-usuario'

    return
  }

  const _loginForm = querySelector('[data-wf-user-form-type="login"]')

  _loginForm.removeAttribute('data-wf-user-form-type')
  _loginForm.removeAttribute('data-wf-user-form-redirect')

  const previousSibling = _loginForm.previousElementSibling

  _loginForm.remove()

  previousSibling.insertAdjacentHTML('afterend', _loginForm.outerHTML)

  const loginForm = querySelector('[data-wtf-login-block]')

  const searchParams = new URLSearchParams(location.search)

  const userField = querySelector('[data-wtf-user]')
  const passField = querySelector('[data-wtf-password]')

  const userFieldWrapper = querySelector('[data-wtf-user-wrapper]')
  const passFieldWrapper = querySelector('[data-wtf-password-wrapper]')

  const loginSubmitButton = querySelector('[type="submit"]', loginForm)

  const socialLoginGoogleCTA = querySelector('[data-wtf-google]')

  const invalidCredentials = querySelector('[data-wtf-authentication-error-message]')
  const generalErrorMessage = querySelector('[data-wtf-general-error-message]')
  const inactiveAccountMessage = querySelector('[data-wtf-confirm-email-error-message]')
  const accountDoesntExists = querySelector('[data-wtf-not-registered-email-error-message]')

  if (searchParams.has('email')) {
    userField.value = searchParams.get('email') ?? ''

    passField.focus({
      preventScroll: false
    })
  } else {
    userField.focus({
      preventScroll: false
    })
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateUserField () {
    const isFieldValid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(userField.value)

    userFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid && userField.value.length > 0)

    return [isFieldValid, 'wtfUser']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validatePassField () {
    const isFieldValid = passField.value.length >= 8

    passFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfPassword']
  }

  attachEvent(socialLoginGoogleCTA, 'click', function (e) {
    e.preventDefault()

    getGoogleAuthorizationURL().then(result => {
      if (typeof result === 'boolean') {
        alert('Houve uma falha com o login')

        return
      }

      location.href = result
    })
  }, false)

  attachEvent(userField, 'blur', validateUserField, false)
  attachEvent(userField, 'input', function () {
    userFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(passField, 'blur', validatePassField, false)
  attachEvent(passField, 'input', function () {
    passFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(loginForm, 'submit', async (e) => {
    e.preventDefault()
    e.stopPropagation();

    [invalidCredentials, generalErrorMessage, inactiveAccountMessage].forEach(errorMessage => errorMessage.classList.add(GENERAL_HIDDEN_CLASS))

    let cancelRequest = false

    const validateFields = [
      validateUserField,
      validatePassField
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

    const response = await loginUser({
      email: userField.value,
      password: passField.value
    })

    if (!response.error) {
      setCookie(COOKIE_NAME, response.data.authToken, {
        path: '/',
        secure: true,
        sameSite: 'Strict',
        expires: new Date(Date.now() + 5_184_000_000)
      })

      location.href = '/dados-de-usuario'

      return
    }

    switch (response.data?.payload?.reason) {
      case 'ACCOUNT_NOT_ACTIVE':
        inactiveAccountMessage.classList.remove(GENERAL_HIDDEN_CLASS)
        break
      case 'ACCOUNT_NOT_EXISTS':
        accountDoesntExists.classList.remove(GENERAL_HIDDEN_CLASS)
        break
      case 'INVALID_CREDENTIALS':
        invalidCredentials.classList.remove(GENERAL_HIDDEN_CLASS)
        break
      default:
        generalErrorMessage.classList.remove(GENERAL_HIDDEN_CLASS)
    }
  })

})()
