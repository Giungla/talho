const COOKIE_SEPARATOR = '; '

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
 * @param name {string}
 */
function deleteCookie (name) {
  setCookie(name, '=', {
    path: '/',
    secure: true,
    sameSite: 'Strict',
    expires: new Date(0)
  })
}

/**
 * @param name    {string}
 * @param value   {string | number | boolean}
 * @param options {cookieOptions}
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

function switchLoggedItems () {
  const COOKIE_NAME = '__Host-Talho-AuthToken'

  if (getCookie(COOKIE_NAME) === false) {
    document.querySelectorAll('[data-wtf-auth-element]').forEach(element => {
      element.remove()
    })

    return
  }

  document.querySelectorAll('[data-wtf-authless-element]').forEach(element => {
    element.remove()
  })

  document.querySelectorAll('[data-wtf-button-logout]').forEach(el => {
    el.addEventListener('click', () => {
      deleteCookie(COOKIE_NAME)

      location.reload()
    }, false)
  })
}

switchLoggedItems()