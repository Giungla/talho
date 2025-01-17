
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
   * @returns {boolean}
   */
  function isAuthenticated () {
    const hasAuth = getCookie(COOKIE_NAME)

    return !!hasAuth
  }

  /**
   * @param status {boolean}
   */
  function isPageLoading (status) {
    querySelector('[data-wtf-loader]').classList.toggle('oculto', !status)
  }

  /**
   * @type {IQueryPattern<null | IAddress>}
   */
  const ADDRESSES = {
    data: null,
    fetched: false,
    pending: false
  }

  const addressModel = querySelector('[data-wtf-registered-address]')
  const addressesContainer = addressModel.parentNode
  addressesContainer.removeChild(addressModel)

  const _addAddressForm = querySelector('#wf-form-Add-Address')

  const removalAttributes = [
    'id',
    'name',
    'data-name',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ];

  for (let attr of removalAttributes) {
    _addAddressForm.removeAttribute(attr)
  }

  const parentNode = _addAddressForm.parentElement

  _addAddressForm.remove()

  parentNode.insertAdjacentHTML('afterbegin', _addAddressForm.outerHTML)

  const addAddressForm = parentNode.firstElementChild

  for (const webflowMessageElement of ['.w-form-done', '.w-form-fail']) {
    querySelector(webflowMessageElement, addAddressForm.parentElement)?.remove()
  }

  const logoutButton = querySelector('[data-wtf-logout]')

  const addressTagField = querySelector('[data-wtf-tag-new]')
  const addressTagFieldWrapper = querySelector('[data-wtf-tag-new-wrapper]')

  const cepField = querySelector('[data-wtf-zipcode-new]')
  const cepFieldWrapper = querySelector('[data-wtf-zipcode-new-wrapper]')

  const addressNameField = querySelector('[data-wtf-address-new]')
  const addressNameFieldWrapper = querySelector('[data-wtf-address-new-wrapper]')

  const addressNumberField = querySelector('[data-wtf-number-new]')
  const addressNumberFieldWrapper = querySelector('[data-wtf-number-new-wrapper]')

  const addressComplementField = querySelector('[data-wtf-complement-new]')

  const addressNeighborhoodField = querySelector('[data-wtf-neighborhood-new]')
  const addressNeighborhoodFieldWrapper = querySelector('[data-wtf-neighborhood-new-wrapper]')

  const addressCityField = querySelector('[data-wtf-city-new]')
  const addressCityFieldWrapper = querySelector('[data-wtf-city-new-wrapper]')

  const addressStateField = querySelector('[data-wtf-state-new]')
  const addressStateFieldWrapper = querySelector('[data-wtf-state-new-wrapper]')

  const hasNoAddresses = querySelector('[data-wtf-error-message-no-address-registered]')

  /**
   * @param retry {number}
   * @returns     {Promise<ISearchAddressResponse>}
   */
  async function searchAddresses (retry = 3) {
    try {
      const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/user_address', {
        mode: 'cors',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getCookie(COOKIE_NAME)
        }
      })

      if (!response.ok) {
        if ((retry - 1) > 0) return searchAddresses(retry - 1)

        const error = await response.text()

        return {
          data: error,
          error: true
        }
      }

      const data = await response.json()

      return {
        data,
        error: false
      }
    } catch (e) {
      if ((retry - 1) > 0) return searchAddresses(retry - 1)

      return {
        data: e,
        error: true
      }
    }
  }

  /**
   * @param address {Omit<IAddress, 'id'>}
   * @returns       {Promise<ISearchAddressResponse>}
   */
  async function createAddress (address) {
    try {
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/user_address`, {
        mode: 'cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getCookie(COOKIE_NAME)
        },
        body: JSON.stringify(address)
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
   * @param address_id {string}
   * @returns          {Promise<IDeleteAddressResponse>}
   */
  async function deleteAddress (address_id) {
    try {
      const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:jiIoKYhH/user_address/${address_id}`, {
        mode: 'cors',
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getCookie(COOKIE_NAME)
        }
      })

      if (!response.ok) {
        const error = await response.text()

        return {
          data: error,
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
   * @param cep {string}
   * @returns   {Promise<IGetAddressDetails>}
   */
  async function getAddressDetails (cep) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        method: 'GET'
      })

      if (!response.ok) {
        return {
          data: null,
          error: true
        }
      }

      /**
       * @type {IViaCEPPayload}
       */
      const data = await response.json()

      return {
        data,
        error: data.hasOwnProperty('erro')
      }
    } catch (e) {
      return {
        data: null,
        error: true
      }
    }
  }

  /**
   * @param addresses {IAddress[]}
   */
  function drawAddresses (addresses) {
    if (!addressModel) return

    const addressFragment = document.createDocumentFragment()

    for (const address of addresses) {
      const currentAddress = addressModel.cloneNode(true)

      currentAddress.dataset.addressBackendID = address.id
      querySelector('[data-wtf-address-tag]', currentAddress).textContent = address.nick
      querySelector('[data-wtf-address]', currentAddress).textContent = address.address
      querySelector('[data-wtf-neighborhood]', currentAddress).textContent = address.neighborhood
      querySelector('[data-wtf-zip-code]', currentAddress).textContent = address.cep
      querySelector('[data-wtf-city]', currentAddress).textContent = address.city
      querySelector('[data-wtf-state]', currentAddress).textContent = address.state

      attachEvent(querySelector('[data-wtf-delete-user-address]', currentAddress), 'click', async function (e) {
        e.preventDefault()
        e.stopPropagation()

        const { data, error } = await deleteAddress(address.id)

        if (error) return;

        addressesContainer.removeChild(currentAddress)

        drawNoAddressesWarning()
      }, false)

      addressFragment.appendChild(currentAddress)
    }

    addressesContainer.appendChild(addressFragment)

    drawNoAddressesWarning()
  }

  function drawNoAddressesWarning () {
    hasNoAddresses.classList.toggle(GENERAL_HIDDEN_CLASS, addressesContainer.childElementCount !== 0)
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateAddressTagField () {
    const isFieldValid = addressTagField.value.length > 2

    addressTagFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfTagNew']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateAddressCEPField () {
    const isFieldValid = /^\d{5}-\d{3}$/.test(cepField.value)

    cepFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfZipcodeNew']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateAddressNameField () {
    const isFieldValid = addressNameField.value.length > 2

    addressNameFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfAddressNew']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateAddressNumberField () {
    const isFieldValid = addressNumberField.value.length > 0

    addressNumberFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfNumberNew']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateAddressNeighborhoodField () {
    const isFieldValid = addressNeighborhoodField.value.length > 2

    addressNeighborhoodFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfNeighborhoodNew']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateAddressCityField () {
    const isFieldValid = addressCityField.value.length > 2

    addressCityFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfCityNew']
  }

  /**
   * @returns {IFieldValidationResponse}
   */
  function validateAddressStateField () {
    const isFieldValid = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MS|MT|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO"
      .split('|')
      .includes(addressStateField.value)

    addressStateFieldWrapper.classList.toggle('mensagemdeerro', !isFieldValid)

    return [isFieldValid, 'wtfStateNew']
  }

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

  attachEvent(addressTagField, 'blur', validateAddressTagField, false)
  attachEvent(addressTagField, 'input', function () {
    addressTagFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(cepField, 'blur', validateAddressCEPField, false)
  attachEvent(cepField, 'input', async function () {
    cepFieldWrapper.classList.remove('mensagemdeerro')

    const cep = cepField.value.replace(/\D+/g, '')

    const len = cep.length

    if (len > 5) {
      cepField.value = cep.replace(/(\d{5})(\d{1,3})/, '$1-$2')
    } else {
      cepField.value = cep
    }

    if (cep.length < 8) return

    const { data, error } = await getAddressDetails(cep)

    if (error) return

    addressNameField.value = data.logradouro
    addressNeighborhoodField.value = data.bairro
    addressCityField.value = data.localidade
    addressStateField.value = data.uf
  }, false)

  attachEvent(addressNameField, 'blur', validateAddressNameField, false)
  attachEvent(addressNameField, 'input', function () {
    addressNameFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(addressNumberField, 'blur', validateAddressNumberField, false)
  attachEvent(addressNameField, 'input', function () {
    addressNumberFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(addressNeighborhoodField, 'blur', validateAddressNeighborhoodField, false)
  attachEvent(addressNeighborhoodField, 'input', function () {
    addressNeighborhoodFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(addressCityField, 'blur', validateAddressCityField, false)
  attachEvent(addressCityField, 'input', function () {
    addressCityFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(addressStateField, 'blur', validateAddressStateField, false)
  attachEvent(addressStateField, 'input', function () {
    addressStateFieldWrapper.classList.remove('mensagemdeerro')
  }, false)

  attachEvent(addAddressForm, 'submit', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    isPageLoading(true)

    const { error, data } = await createAddress({
      cep: cepField.value,
      nick: addressTagField.value,
      city: addressCityField.value,
      state: addressStateField.value,
      address: addressNameField.value,
      number: addressNumberField.value,
      complement: addressComplementField.value,
      neighborhood: addressNeighborhoodField.value
    })

    if (error) return isPageLoading(false)

    drawAddresses(data)

    addAddressForm.reset()

    isPageLoading(false)
  })

  searchAddresses().then(({ data }) => {
    if (!data) return;

    drawAddresses(data)

    isPageLoading(false)
  })

})()
