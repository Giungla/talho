(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '
  const USER_DATA_PATH = '/area-do-usuario/dados'

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

    if (options?.maxAge && typeof options.maxAge === 'number') {
      cookieOptions.push(`max-age=${options.maxAge}`)
    }

    if (options?.sameSite && typeof options?.sameSite === 'string') {
      cookieOptions.push(`SameSite=${options?.sameSite}`)
    }

    if (options?.path && typeof options.path === 'string') {
      cookieOptions.push(`path=${options?.path}`)
    }

    if (options?.domain && typeof options.domain === 'string') {
      cookieOptions.push(`domain=${options?.domain}`)
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

  function isAuthenticated () {
    const hasAuth = getCookie(COOKIE_NAME)

    return !!hasAuth
  }

  if (isAuthenticated()) {
    location.href = USER_DATA_PATH

    return
  }

  /**
   * @param code {string | false}
   * @returns    {Promise<boolean | { token: string; maxAge: number; }>}
   */
  async function GoogleContinueOAuth (code) {
    if (code === false) return code

    const url = new URL('https://xef5-44zo-gegm.b2.xano.io/api:h_RKfex8/oauth/google/continue')

    url.searchParams.set('code', code)
    url.searchParams.set('redirect_uri', location.origin.concat(location.pathname))

    const currentURL = new URL(location.href)

    const removalKeys = [
      'code',
      'scope',
      'authuser',
      'hd',
      'prompt'
    ];

    for (let i = 0, len = removalKeys.length; i < len; i++) {
      currentURL.searchParams.delete(removalKeys.at(i))
    }

    history.replaceState(null, '', currentURL.toString())

    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        return false
      }

      /** @type {{ token: string; maxAge: number; }} */
      const data = await response.json()

      return data
    } catch (e) {
      return false
    }
  }

  const search = new URLSearchParams(location.search)

  GoogleContinueOAuth(search.get('code') ?? false).then(result => {
    if (result === false) {
      return console.warn('[Social Login] Failed to login with Google')
    }

    setCookie(COOKIE_NAME, result.token, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(result.maxAge)
    })

    location.href = USER_DATA_PATH
  })
})()