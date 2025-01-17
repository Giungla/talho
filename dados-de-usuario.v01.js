
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
   * @param text {string}
   * @returns    {string}
   */
  function normalizeText (text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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
   * @returns {Promise<IGetUserResponse>}
   */
  async function getUser () {
    currentUser.pending = true

    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getCookie(COOKIE_NAME)
        }
      })

      if (!response.ok) {
        return {
          error: true
        }
      }

      /**
       * @type {ICurrentUserData}
       */
      const data = await response.json()

      return {
        data,
        error: false
      }
    } catch (e) {
      return {
        error: true
      }
    } finally {
      currentUser.fetched = true
      currentUser.pending = false
    }
  }

  /**
   * @param userDetails {Omit<ICurrentUserData, 'id'>}
   * @returns           {Promise<IGetUserResponse>}
   */
  async function updateUser (userDetails) {
    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/patch_user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getCookie(COOKIE_NAME)
        },
        body: JSON.stringify(userDetails)
      })

      if (!response.ok) {
        return {
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
        error: true
      }
    }
  }

  /**
   * @param cpf {string}
   * @returns   {boolean}
   */
  function validateCPF (cpf){
    cpf = cpf.replace(/\D+/g, '')

    if (cpf.toString().length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    let result = true

    const validationIndexes = [9, 10]

    validationIndexes.forEach(function(j){
      let soma = 0, r

      cpf
        .split('')
        .splice(0, j)
        .forEach(function(e, i){
          soma += parseInt(e) * ((j + 2) - (i + 1))
        })

      r = soma % 11

      r = (r < 2)
        ? 0
        : 11 - r

      if (r !== parseInt(cpf.substring(j, j + 1))) result = false
    })

    return result
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateNameField () {
    const isValidField = /^(\w{2,})(\s+(\w+))+$/.test(normalizeText(nameUpdateField.value).trim().replace(/\s{2,}/g, ' '))

    nameUpdateFieldWrapper.classList.toggle('mensagemdeerro', !isValidField)

    return [isValidField, 'wtfNameUpdate']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateCPFField () {
    const isFieldValid = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpfUpdateField.value) && validateCPF(cpfUpdateField.value)

    cpfUpdateFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfCpfUpdate']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validatePhoneField () {
    const isFieldValid = /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phoneUpdateField.value)

    phoneUpdateFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfPhoneUpdate']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateBirthdayField () {
    const date = birthdayUpdateField.value

    const isRightPattern = /^(\d{2})\/(\d{2})\/(19|20)(\d{2})$/g.test(date)

    const [day, month, year] = date.split('/')

    const getTimeFromDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`).getTime()

    const isValidDate = isRightPattern && !isNaN(getTimeFromDate) && Date.now() > getTimeFromDate

    birthdayUpdateFieldWrapper.classList.toggle('mensagemdeerro', !isValidDate)

    return [isValidDate, 'wtfBirthdayUpdate']
  }

  function syncUserInfo () {
    nameUpdateField.value = currentUser.data.name ?? ''
    querySelector('[data-wtf-name]').textContent = currentUser.data.name ?? '[...]'

    querySelector('[data-wtf-email]').textContent = currentUser.data.email ?? '[...]'

    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(currentUser.data.cpf)) {
      cpfUpdateField.value = currentUser.data.cpf ?? ''
      querySelector('[data-wtf-cpf]').textContent = currentUser.data.cpf ?? '[...]'
    }

    if (/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(currentUser.data.telephone)) {
      phoneUpdateField.value = currentUser.data.telephone ?? ''
      querySelector('[data-wtf-phone]').textContent = currentUser.data.telephone ?? '[...]'
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(currentUser.data.birthday)) {
      const isoBirthDate = new Date(currentUser.data.birthday).toISOString().split('T').at(0)
      const [year, month, day] = isoBirthDate.split('-')

      const formattedDate = [day, month, year].join('/')

      birthdayUpdateField.value = formattedDate ?? ''
      querySelector('[data-wtf-birthday]').textContent = formattedDate ?? '[...]'
    }
  }

  /**
   * @param status {boolean}
   */
  function isPageLoading (status) {
    querySelector('[data-wtf-loader]').classList.toggle('oculto', !status)
  }

  /**
   * @type {IQueryPattern<null | ICurrentUserData>}
   */
  const currentUser = {
    data: null,
    fetched: false,
    pending: false
  }

  const _updateUserForm = querySelector('[data-wf-element-id="2223ed23-64c9-564b-0ac9-1e8f67e8988c"]')

  const removalAttributes = [
    'id',
    'name',
    'data-name',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ];

  for (let attr of removalAttributes) {
    _updateUserForm.removeAttribute(attr)
  }

  const previousSibling = _updateUserForm.previousElementSibling

  _updateUserForm.remove()

  previousSibling.insertAdjacentHTML('afterend', _updateUserForm.outerHTML)

  const updateUserForm = previousSibling.nextElementSibling

  querySelector('input[type="submit"]', updateUserForm).removeAttribute('disabled')

  for (const webflowMessageElement of ['.w-form-done', '.w-form-fail']) {
    querySelector(webflowMessageElement, updateUserForm.parentElement)?.remove()
  }

  const logoutButton = querySelector('[data-wtf-logout]')
  const toggleUpdateUserForm = querySelector('[data-wtf-open-update-user]')
  const updateUserGroup = querySelector('[data-wtf-user-data-update]')

  const nameUpdateField = querySelector('[data-wtf-name-update]')
  const nameUpdateFieldWrapper = querySelector('[data-wtf-name-update-wrapper]')

  const cpfUpdateField = querySelector('[data-wtf-cpf-update]')
  const cpfUpdateFieldWrapper = querySelector('[data-wtf-cpf-update-wrapper]')

  const phoneUpdateField = querySelector('[data-wtf-phone-update]')
  const phoneUpdateFieldWrapper = querySelector('[data-wtf-phone-update-wrapper]')

  const birthdayUpdateField = querySelector('[data-wtf-birthday-update]')
  const birthdayUpdateFieldWrapper = querySelector('[data-wtf-birthday-update-wrapper]')

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

  attachEvent(toggleUpdateUserForm, 'click', function (e) {
    e.preventDefault()
    e.stopPropagation()

    updateUserGroup.classList.toggle('oculto')
  }, false)

  attachEvent(nameUpdateField, 'blur', validateNameField, false)

  /**
   * @desc Aplica a máscara no campo CPF
   */
  attachEvent(cpfUpdateField, 'input', function (e) {
    cpfUpdateFieldWrapper.classList.remove('mensagemdeerro')

    let value = e.target.value.replace(/\D+/g, '')

    const len = value.length

    if (len < 7) {
      value = value.replace(/^(\d{3})(\d{1,3})/g, '$1.$2')
    } else if (len < 10) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/g, '$1.$2.$3')
    } else if (len < 12) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/g, '$1.$2.$3-$4')
    }

    e.target.value = value
  })

  attachEvent(cpfUpdateField, 'blur', validateCPFField, false)

  /**
   * @desc Aplica a máscara no campo Aniversário
   */
  attachEvent(birthdayUpdateField, 'input', function (e) {
    birthdayUpdateFieldWrapper.classList.remove('mensagemdeerro')

    let value = e.target.value.replace(/\D+/g, '')

    const len = value.length

    if (len > 2 && len < 5) {
      value = value.replace(/^(\d{2})(\d{1,2})$/g, '$1/$2')
    } else if (len >= 5) {
      value = value.replace(/^(\d{2})(\d{2})(\d{1,4})$/g, '$1/$2/$3')
    }

    e.target.value = value
  })

  attachEvent(birthdayUpdateField, 'blur', validateBirthdayField, false)

  attachEvent(phoneUpdateField, 'input', function (e) {
    phoneUpdateFieldWrapper.classList.remove('mensagemdeerro')

    let value = e.target.value.replace(/\D+/g, '')

    const len = value.length

    if (len < 3) {
      value = value.replace(/^(\d{1,2})$/, '($1')
    } else if (len < 7) {
      value = value.replace(/^(\d{2})(\d{1,4})$/, '($1) $2')
    } else if (len < 11) {
      value = value.replace(/^(\d{2})(\d{4})(\d{1,4})$/, '($1) $2-$3')
    } else if (len < 12) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    }

    e.target.value = value
  })

  attachEvent(phoneUpdateField, 'blur', validatePhoneField, false)

  attachEvent(updateUserForm, 'submit', async function (e) {
    e.preventDefault()
    e.stopPropagation()

    isPageLoading(true)

    const { error, data } = await updateUser({
      cpf: cpfUpdateField?.value,
      tel: phoneUpdateField?.value,
      name: nameUpdateField?.value,
      birthday: birthdayUpdateField?.value
        .split('/')
        .reverse()
        .join('-')
    })

    if (error) return isPageLoading(false)

    currentUser.data = data

    syncUserInfo()

    updateUserGroup.classList.add('oculto')

    isPageLoading(false)
  }, false)

  Promise.allSettled([
    getUser().then(({ error, data }) => {
      if (error) return

      currentUser.data = data

      syncUserInfo()

      isPageLoading(false)
    })
  ])

})()
