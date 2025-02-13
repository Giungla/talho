(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'

  const COOKIE_SEPARATOR = '; '

  const DISABLED_ATTR = 'disabled'
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const GENERAL_ERROR_MESSAGE_CLASS = 'mensagemdeerro'

  const SUBMITTED = 'submitted'

  const NAME = 'nome'
  const IS_NAME_VIRGIN = 'is_name_virgin'

  const EMAIL = 'email'
  const IS_EMAIL_VIRGIN = 'is_email_virgin'

  const PASSWORD = 'password'
  const IS_PASSWORD_VIRGIN = 'is_password_virgin'

  const COMMUNICATIONS = 'communications'
  const IS_COMMUNICATIONS_VIRGIN = 'is_communications_virgin'

  const OPTIN = 'optin'
  const IS_OPTIN_VIRGIN = 'is_optin_virgin'

  const _state = {
    [SUBMITTED]: false,

    [NAME]: '',
    [IS_NAME_VIRGIN]: true,

    [EMAIL]: '',
    [IS_EMAIL_VIRGIN]: true,

    [PASSWORD]: '',
    [IS_PASSWORD_VIRGIN]: true,

    [COMMUNICATIONS]: false,
    [IS_COMMUNICATIONS_VIRGIN]: true,

    [OPTIN]: false,
    [IS_OPTIN_VIRGIN]: true
  }

  const stateProxy = new Proxy(_state, {
    get (target, key) {
      switch (key) {
        case 'formPayload':
          /**
           * @param _key {string | symbol}
           * @returns    {string}
           */
          const getItem = _key => target?.[_key] ?? ''

          return {
            name: getItem(NAME),
            email: getItem(EMAIL),
            optin: getItem(OPTIN),
            password: getItem(PASSWORD),
            consent: getItem(COMMUNICATIONS)
          }
        case 'status':
          const failedGroup = [validateNameField, validateEmailField, validatePassField, validateConsentField]
            .map(callback => callback?.())
            .filter(Boolean)
            .find(response => response?.at(0) === false)

          return {
            valid: !failedGroup,
            failedName: failedGroup?.at(1)
          }
        default:
          return getReflect(target, key)
      }
    },

    set (target, key, newValue) {
      const applied = setReflect(target, key, newValue)

      switch (key) {
        case NAME:
          setReflect(target, IS_NAME_VIRGIN, false)

          break
        case EMAIL:
          setReflect(target, IS_EMAIL_VIRGIN, false)

          break
        case PASSWORD:
          setReflect(target, IS_PASSWORD_VIRGIN, false)

          break
        case COMMUNICATIONS:
          setReflect(target, IS_COMMUNICATIONS_VIRGIN, false)

          break
      }

      return applied
    }
  })

  /**
   * @type {ScrollIntoViewOptions}
   */
  const SCROLL_INTO_VIEW_DEFAULT_ARGS = {
    block: 'center',
    behavior: 'smooth'
  }

  /**
   * @param description {string | number | null}
   */
  function createSymbol (description = null) {
    return Symbol(description)
  }

  /**
   * @param target      {object}
   * @param propertyKey {PropertyKey}
   * @param value       {any}
   * @returns           {boolean}
   */
  function setReflect (target, propertyKey, value) {
    return Reflect.set(target, propertyKey, value)
  }

  /**
   * @param target      {object}
   * @param propertyKey {PropertyKey}
   */
  function getReflect (target, propertyKey) {
    return Reflect.get(target, propertyKey)
  }

  /**
   * @param node      {HTMLElement | Document}
   * @param eventName {string}
   * @param callback  {EventListener | EventListenerObject}
   * @param options=  {boolean | AddEventListenerOptions}
   * @returns         {void | function (): void}
   */
  function attachEvent (node, eventName, callback, options) {
    if (!node) return console.warn('[attachEvent] node expect Node Element, received `%s`', node)

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
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:t3reRXiD/auth/signup`, {
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
        data: null,
        error: true
      }
    }
  }

  if (isAuthenticated()) {
    location.href = '/area-do-usuario/dados'

    return
  }

  const form = querySelector('#wf-form-register')

  const removalAttributes = [
    'name',
    'method',
    'data-name',
    'aria-label',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey',
    'data-wf-user-form-type'
  ];

  for (let attr of removalAttributes) {
    form.removeAttribute(attr)
  }

  const parentNode = form.parentNode

  removeClass(parentNode, 'w-form')

  form.remove()

  parentNode.insertAdjacentHTML('afterbegin', form.outerHTML)

  const signupForm = querySelector('#wf-form-register')

  const nameField = querySelector('[data-wtf-user]', signupForm)
  const nameErrorField = querySelector('[data-wtf-user-error]', signupForm)
  const nameWrapperField = querySelector('[data-wtf-user-wrapper]', signupForm)

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

  const generalErrorMessage = querySelector('[data-wtf-general-error-message]')

  function changeErrorMessage (message = 'Por favor, tente novamente! Se o problema persistir, entre em contato via WhatsApp para obter ajuda.', errorElement = generalErrorMessage) {
    querySelector('div', errorElement).textContent = message
  }

  /** @type {Record<string, IFormMapNames>} */
  const formMapNames = {
    nome: {
      name: NAME,
      field: nameField,
      errorMessage: nameErrorField,
      validator: validateNameField
    },
    senha: {
      name: PASSWORD,
      field: passField,
      errorMessage: passErrorField,
      validator: validatePassField
    },
    'e-mail': {
      name: EMAIL,
      field: emailField,
      errorMessage: emailErrorField,
      validator: validateEmailField
    },
    'checkbox': {
      name: OPTIN,
      field: consentField,
      errorMessage: consentErrorField,
      validator: validateConsentField
    },
    'checkbox-2': {
      name: COMMUNICATIONS,
      field: privacyField,
      errorMessage: null,
      validator: null
    }
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateNameField () {
    const cleanName = normalizeText(nameField.value).trim().replace(/\s{2,}/g, ' ')

    const isValidName = !/\d+/.test(cleanName) && /^(\w{2,})(\s+(\w+))+$/.test(cleanName)

    nameWrapperField.classList.toggle(GENERAL_ERROR_MESSAGE_CLASS, !isValidName && nameField.value.length > 0)

    return [isValidName, 'wtfUser']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateEmailField () {
    const isValidEmail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(emailField.value)

    emailWrapperField.classList.toggle(GENERAL_ERROR_MESSAGE_CLASS, !isValidEmail && emailField.value.length > 0)

    return [isValidEmail, 'wtfEmail']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validatePassField () {
    const isValidPass = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/g.test(passField.value) && /[A-Z]/.test(passField.value)

    passFieldWrapper.classList.toggle(GENERAL_ERROR_MESSAGE_CLASS, !isValidPass && passField.value.length > 0)

    return [isValidPass, 'wtfPassword']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateConsentField () {
    const hasConsent = consentField.checked

    consentWrapperField.classList.toggle(GENERAL_ERROR_MESSAGE_CLASS, !hasConsent)

    return [hasConsent, 'wtfConsent']
  }

  /**
   * @param element   {HTMLElement}
   * @param className {string}
   */
  function removeClass (element, className) {
    element.classList.remove(className)
  }

  // Field name event handlers
  attachEvent(nameField, 'blur', validateNameField, false)
  attachEvent(nameField, 'input', function () {
    removeClass(nameWrapperField, GENERAL_ERROR_MESSAGE_CLASS)
  }, false)

  // Field e-mail event handlers
  attachEvent(emailField, 'blur', validateEmailField, false)
  attachEvent(nameField, 'input', function () {
    removeClass(emailWrapperField, GENERAL_ERROR_MESSAGE_CLASS)
  }, false)

  // Field password event handlers
  attachEvent(passField, 'blur', validatePassField, false)
  attachEvent(passField, 'input', function () {
    removeClass(passFieldWrapper, GENERAL_ERROR_MESSAGE_CLASS)
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

  function handleFormItemsChanges (e) {
    const target = e.target

    const source = formMapNames?.[target.name]

    if (!source.name) return

    setReflect(stateProxy, source.name, target.type === 'checkbox' ? target.checked : target.value)

    if (typeof source.validator !== 'function') return

    const [valid] = source.validator?.()

    source.errorMessage.classList.toggle(GENERAL_HIDDEN_CLASS, valid)
  }

  attachEvent(signupForm, 'change', function () {
    parentNode.classList.add('w-form')
  }, { once: true })

  attachEvent(signupForm, 'change', handleFormItemsChanges)

  attachEvent(signupForm, 'submit', async (e) => {
    submitForm.setAttribute(DISABLED_ATTR, DISABLED_ATTR)
    generalErrorMessage.classList.add(GENERAL_HIDDEN_CLASS)

    e.preventDefault()
    e.stopPropagation()

    if (!stateProxy.status.valid) {
      removeClass(generalErrorMessage, GENERAL_HIDDEN_CLASS)

      setTimeout(() => {
        scrollIntoView(generalErrorMessage, SCROLL_INTO_VIEW_DEFAULT_ARGS)
      }, 500)

      return submitForm.removeAttribute(DISABLED_ATTR)
    }

    successSignMessage.classList.toggle(GENERAL_HIDDEN_CLASS, true)

    const response = await signupUser(stateProxy.formPayload)

    successSignMessage.classList.toggle(GENERAL_HIDDEN_CLASS, response.error)

    if (!response.error) {
      return signupForm.reset()
    }

    submitForm.removeAttribute(DISABLED_ATTR)

    changeErrorMessage(response.data?.message ?? undefined)
    generalErrorMessage.classList.remove(GENERAL_HIDDEN_CLASS)
    scrollIntoView(generalErrorMessage, SCROLL_INTO_VIEW_DEFAULT_ARGS)
  })

  submitForm.removeAttribute(DISABLED_ATTR)

})()
