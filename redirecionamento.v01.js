(function () {

  'use strict';

  const COOKIE_NAME = '__Host-IYS-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const GENERAL_HIDDEN_CLASS = 'oculto'

  if (isAuthenticated()) {
    location.href = '/dados-de-usuario'

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
   * @returns {boolean}
   */
  function isAuthenticated () {
    const hasAuth = getCookie(COOKIE_NAME)

    return !!hasAuth
  }

  /**
   * @param magic_token {string}
   * @returns           {Promise<IValidateAccountToken>}
   */
  async function validateAccountToken (magic_token) {
    try {
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/search_account/${magic_token}`, {
        mode: 'cors',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return {
          data: null,
          error: true
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

  const confirmAccountAnchor = querySelector('a.areadeacesso_botaoenviar')

  const searchParams = new URLSearchParams(location.search)

  const successMessage = querySelector('[data-wtf-success-message]')
  const errorMessage = querySelector('[data-wtf-general-error-message]')

  if (!searchParams.has('token')) {
    location.href = '/log-in'

    return
  }

  attachEvent(confirmAccountAnchor, 'click', async function (e) {
    e.preventDefault()
    e.stopPropagation()

    errorMessage.classList.add(GENERAL_HIDDEN_CLASS)
    successMessage.classList.add(GENERAL_HIDDEN_CLASS)

    const { data, error } = await validateAccountToken(searchParams.get('token'))

    if (error) {
      errorMessage.classList.remove(GENERAL_HIDDEN_CLASS)

      return
    }

    // TODO: exibir mensagem de sucesso
    successMessage.classList.remove(GENERAL_HIDDEN_CLASS)

    setTimeout(() => {
      location.href = `/log-in?email=${data.email}`
    }, 5000)
  }, false)

})()
