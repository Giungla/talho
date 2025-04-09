import {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  IAddress,
  ISplitCookieObject,
  type IStateAcronym, IUserCreatedAddress, ResponsePattern,
  VIACEPFromXano
} from "../global";

(function () {
  const COOKIE_SEPARATOR = '; '
  const COOKIE_NAME = '__Host-Talho-AuthToken'
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io'
  const WTF_WRAPPER_SELECTOR = '[data-wtf-wrapper]'
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'

  const ADDRESS_FORM_ID = '#wf-form-Address-Form'

  if (!isAuthenticated()) {
    location.href = `/acessos/entrar?redirect_to=${encodeURIComponent(location.pathname)}`

    return
  }

  const statesAcronym: IStateAcronym[] = [
    'AL',
    'AM',
    'AP',
    'CE',
    'BA',
    'AC',
    'DF',
    'ES',
    'GO',
    'MA',
    'MG',
    'MS',
    'MT',
    'PA',
    'PB',
    'PE',
    'PI',
    'PR',
    'RJ',
    'RN',
    'RO',
    'RR',
    'RS',
    'SC',
    'SE',
    'SP',
    'TO',
  ]

  function isPageLoading (status: boolean) {
    toggleClass(querySelector('[data-wtf-loader]'), GENERAL_HIDDEN_CLASS, !status)
  }

  function querySelector<
    K extends keyof HTMLElementTagNameMap,
    T extends HTMLElementTagNameMap[K] | Element | null = HTMLElementTagNameMap[K] | null
  >(
    selector: K | string,
    node: HTMLElement | Document = document
  ): T {
    return node.querySelector(selector as string) as T;
  }

  function attachEvent <
    T extends HTMLElement | Document,
    K extends T extends HTMLElement
      ? keyof HTMLElementEventMap
      : keyof DocumentEventMap
  > (
    node: T,
    eventName: K,
    callback: (event: T extends HTMLElement
      ? HTMLElementEventMap[K extends keyof HTMLElementEventMap ? K : never]
      : DocumentEventMap[K extends keyof DocumentEventMap ? K : never]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): VoidFunction {
    node.addEventListener(eventName, callback as EventListener, options)

    return () => node.removeEventListener(eventName, callback as EventListener, options)
  }

  function getCookie (name: string): string | false {
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

  function splitCookie (cookie: string): ISplitCookieObject {
    const [name, value] = cookie.split('=')

    return {
      name,
      value
    }
  }

  function isAuthenticated (): boolean {
    return getCookie(COOKIE_NAME) !== false
  }

  function addClass (element: Element, ...className: string[]) {
    element.classList.add(...className)
  }

  function removeClass (element: Element, ...className: string[]) {
    element.classList.remove(...className)
  }

  function toggleClass (element: Element, className: string, force?: boolean) {
    element.classList.toggle(className, force)
  }

  function removeAttribute (element: Element, attribute: string) {
    element.removeAttribute(attribute)
  }

  function postSuccessResponse <T = void> (response: T): FunctionSucceededPattern<T> {
    return {
      data: response,
      succeeded: true
    }
  }

  function postErrorResponse (message: string): FunctionErrorPattern {
    return {
      message,
      succeeded: false
    }
  }

  const HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: getCookie(COOKIE_NAME) as string,
  }

  const noAddressesMessage = querySelector<'div'>('[data-wtf-error-message-no-address-registered]')

  const addressTemplate = querySelector('[data-wtf-registered-address]')
  const addressContainer = addressTemplate?.parentElement as HTMLElement

  addressTemplate?.remove()

  const USER_CREATED_ADDRESSES = new Proxy([] as IUserCreatedAddress[], {
    set (target: IUserCreatedAddress[], key: string | symbol, newValue: IUserCreatedAddress | number): boolean {
      const response = Reflect.set(target, key, newValue)

      const hasNoAddresses = key === 'length' && newValue === 0

      toggleNoAddressesMessage(hasNoAddresses)

      if (hasNoAddresses || typeof newValue === 'number') return response

      const hasElement = querySelector(`[data-wtf-address-id="${newValue.id}"]`) !== null

      toggleNoAddressesMessage(objectSize(target) > 0)

      if (hasElement) return response

      renderAddress(newValue)

      return response
    }
  })

  function toggleNoAddressesMessage (hasAddresses: boolean) {
    noAddressesMessage && toggleClass(noAddressesMessage, GENERAL_HIDDEN_CLASS, !hasAddresses)
  }

  function renderAddress (incomingAddress: IUserCreatedAddress) {
    if (!addressTemplate) return

    const template = addressTemplate.cloneNode(true) as HTMLElement

    const _nick = querySelector<'div'>('[data-wtf-address-tag]', template)
    const _address = querySelector<'div'>('[data-wtf-address]', template)
    const _anchor = querySelector<'a'>('[data-wtf-delete-user-address]', template)

    if (_nick) _nick.textContent = incomingAddress.nick
    if (_address) _address.textContent = incomingAddress.address
    if (_anchor) {
      let _unsetEvent: null | VoidFunction = null

      _unsetEvent = attachEvent(_anchor, 'click', async function () {
        const response = await deleteUserAddress(incomingAddress.id)

        if (!response.succeeded) return

        _unsetEvent?.()

        const index = USER_CREATED_ADDRESSES.findIndex(value => value.id === incomingAddress.id)

        USER_CREATED_ADDRESSES.splice(index, 1)

        template.remove()
      }, false)
    }

    template.dataset.wtfAddressId = incomingAddress.id

    addressContainer.appendChild(template)
  }

  async function searchAddress (cep: string): Promise<ResponsePattern<VIACEPFromXano>> {
    const defaultErrorMessage = 'O CEP informado não foi encontrado'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}`)

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const address: VIACEPFromXano = await response.json()

      return postSuccessResponse(address)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  async function getUserAddresses (): Promise<ResponsePattern<IUserCreatedAddress[]>> {
    const defaultErrorMessage = 'Houve uma falha ao buscar os seus endereços. Tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:Yytq8Zut/user_addresses/all`, {
        headers: HEADERS
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const addresses: IUserCreatedAddress[] = await response.json()

      return postSuccessResponse(addresses)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  async function deleteUserAddress (id: IUserCreatedAddress['id']): Promise<ResponsePattern<null>> {
    const defaultErrorMessage = 'Houve uma falha ao remover o endereço. Tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:Yytq8Zut/user_addresses/${id}/delete`, {
        method: 'DELETE',
        headers: HEADERS
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      return postSuccessResponse(null)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  async function createAddress (address: Omit<IAddress, 'id'>): Promise<ResponsePattern<IUserCreatedAddress>> {
    const defaultErrorMessage = 'Houve uma falha ao salvar o endereço. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:Yytq8Zut/user_addresses/create`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(address)
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const createdAddress: IAddress = await response.json()

      return postSuccessResponse(createdAddress)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  function validatorResponse (datasetName: string) {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function handleMessages (form: HTMLFormElement, response: Awaited<ReturnType<typeof createAddress>>) {
    const isError = !response.succeeded

    const errorMessage = querySelector('[data-wtf-error-new]', form)
    const successMessage = querySelector('[data-wtf-success-new]', form)

    errorMessage && toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    successMessage && toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (!isError) {
      setTimeout(() => successMessage && addClass(successMessage, GENERAL_HIDDEN_CLASS), 8000)

      return
    }

    const textElement = errorMessage && querySelector('div', errorMessage)

    if (!textElement) return

    textElement.textContent = response.message
  }

  function objectSize (str: string | Array<any>) {
    return str.length
  }

  function captureFieldWrapper (field: Exclude<ReturnType<typeof querySelector>, null>) {
    return field.closest(WTF_WRAPPER_SELECTOR)
  }

  function toggleFieldWrapperError (field: Exclude<ReturnType<typeof querySelector>, null>, isValid: boolean) {
    const fieldWrapper = captureFieldWrapper(field)

    fieldWrapper && toggleClass(fieldWrapper, ERROR_MESSAGE_CLASS, !isValid)
  }

  function camelToKebabCase (str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  function drawFoundedAddress (response: Awaited<ReturnType<typeof searchAddress>>) {
    if (response.succeeded) {
      const {
        cep: cepValue,
        logradouro,
        localidade,
        complemento,
        bairro,
        uf,
      } = response.data

      checkInputExistenceAndSetItsValue(cep, cepValue)
      checkInputExistenceAndSetItsValue(address, logradouro)
      checkInputExistenceAndSetItsValue(neighborhood, bairro)
      checkInputExistenceAndSetItsValue(city, localidade)
      checkInputExistenceAndSetItsValue(state, uf)

      return
    }

    for (const field of [address, complement, neighborhood, city, state]) {
      checkInputExistenceAndSetItsValue(field)
    }
  }

  function saveCreatedAddress (createdAddress: IUserCreatedAddress | IUserCreatedAddress[]) {
    if (Array.isArray(createdAddress)) {
      USER_CREATED_ADDRESSES.push(...createdAddress)

      return
    }

    USER_CREATED_ADDRESSES.push(createdAddress)
  }

  function checkInputExistenceAndSetItsValue (field: ReturnType<typeof querySelector<'input'>>, value: any = '') {
    if (!field) return

    field.value = value
  }

  const _form = querySelector<'form'>(ADDRESS_FORM_ID)

  if (!_form) return

  const removeAttributes = [
    'name',
    'method',
    'data-name',
    'aria-label',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey',
  ]

  for (const attribute of removeAttributes) {
    removeAttribute(_form, attribute)
  }

  const submitElement = querySelector<'input'>('input[type="submit"]', _form)

  submitElement && removeAttribute(submitElement, 'disabled')

  const formParent = _form.parentElement

  if (!formParent) return

  removeClass(formParent, 'w-form')

  _form.remove()

  formParent.insertAdjacentHTML('afterbegin', _form.outerHTML)

  const formElement = querySelector<'form'>(ADDRESS_FORM_ID)

  if (!formElement) return

  const addressNick = querySelector<'input'>('[data-wtf-tag-new]')
  const cep = querySelector<'input'>('[data-wtf-zipcode-new]')
  const address = querySelector<'input'>('[data-wtf-address-new]')
  const number = querySelector<'input'>('[data-wtf-number-new]')
  const complement = querySelector<'input'>('[data-wtf-complement-new]')
  const neighborhood = querySelector<'input'>('[data-wtf-neighborhood-new]')
  const city = querySelector<'input'>('[data-wtf-city-new]')
  const state = querySelector<'input'>('[data-wtf-state-new]')

  function maskCEPField () {
    if (!cep) return

    const cleanValue = cep.value.replace(/\D+/g, '')

    const size = objectSize(cleanValue)

    cep.value = size > 5
      ? cleanValue.replace(/(\d{5})(\d{1,3})/, '$1-$2')
      : cleanValue

    if (objectSize(cep.value) < 9) return

    searchAddress(cleanValue).then(drawFoundedAddress)
  }

  function validateAddressNickField () {
    const response = validatorResponse('wtfTagNew')

    if (!addressNick) return response(false)

    const isAddressNickValid = objectSize(addressNick.value) > 2

    toggleFieldWrapperError(addressNick, isAddressNickValid)

    return response(isAddressNickValid)
  }

  function validateCEPField () {
    const response = validatorResponse('wtfZipcodeNew')

    if (!cep) return response(false)

    const isCepFieldValid = /^\d{5}-\d{3}$/.test(cep.value)

    toggleFieldWrapperError(cep, isCepFieldValid)

    return response(isCepFieldValid)
  }

  function validateAddressField () {
    const response = validatorResponse('wtfAddressNew')

    if (!address) return response(false)

    const isAddressFieldValid = objectSize(address.value) > 2

    toggleFieldWrapperError(address, isAddressFieldValid)

    return response(isAddressFieldValid)
  }

  function validateNumberField () {
    const response = validatorResponse('wtfNumberNew')

    if (!number) return response(false)

    const isNumberFieldValid = objectSize(number.value) > 0

    toggleFieldWrapperError(number, isNumberFieldValid)

    return response(isNumberFieldValid)
  }

  function validateNeighborhoodField () {
    const response = validatorResponse('wtfNeighborhoodNew')

    if (!neighborhood) return response(false)

    const isNeighborhoodFieldValid = objectSize(neighborhood.value) > 2

    toggleFieldWrapperError(neighborhood, isNeighborhoodFieldValid)

    return response(isNeighborhoodFieldValid)
  }

  function validateCityField () {
    const response = validatorResponse('wtfCityNew')

    if (!city) return response(false)

    const isCityFieldValid = objectSize(city.value) > 2

    toggleFieldWrapperError(city, isCityFieldValid)

    return response(isCityFieldValid)
  }

  function validateStateField () {
    const response = validatorResponse('wtfStateNew')

    if (!state) return response(false)

    const isStateFieldValid = statesAcronym.includes(state.value as IStateAcronym)

    toggleFieldWrapperError(state, isStateFieldValid)

    return response(isStateFieldValid)
  }

  const fieldsValidators = [
    { field: addressNick,  validator: validateAddressNickField  },
    { field: cep,          validator: validateCEPField          },
    { field: address,      validator: validateAddressField      },
    { field: number,       validator: validateNumberField       },
    { field: neighborhood, validator: validateNeighborhoodField },
    { field: city,         validator: validateCityField         },
    { field: state,        validator: validateStateField        },
  ]

  for (const { field, validator } of fieldsValidators) {
    if (!field) continue

    attachEvent(field, 'blur', validator, false)

    attachEvent(field, 'input', function () {
      toggleFieldWrapperError(field, true)
    }, false)
  }

  cep && attachEvent(cep, 'input', maskCEPField, false)

  attachEvent(formElement, 'submit', async function (event: SubmitEvent) {
    event.preventDefault()
    event.stopPropagation()

    const validations = [
      validateAddressNickField,
      validateCEPField,
      validateAddressField,
      validateNumberField,
      validateNeighborhoodField,
      validateCityField,
      validateStateField
    ]

    const failedValidation = validations.find(callback => !callback().at(1))

    if (failedValidation) {
      const failingFieldAttribute = `[data-${camelToKebabCase(failedValidation().at(0) as string)}]`

      querySelector(failingFieldAttribute, formElement)?.focus({
        preventScroll: false
      })

      return
    }

    isPageLoading(true)

    const response = await createAddress({
      nick: addressNick?.value as string,
      cep: cep?.value as string,
      address: address?.value as string,
      number: number?.value as string,
      complement: complement?.value as string,
      neighborhood: neighborhood?.value as string,
      city: city?.value as string,
      state: state?.value as IStateAcronym,
    })

    handleMessages(formElement, response)

    if (!response.succeeded) return isPageLoading(false)

    formElement.reset()

    saveCreatedAddress(response.data)

    isPageLoading(false)
  }, false)

  getUserAddresses()
    .then(response => {
      if (!response.succeeded) return

      objectSize(response.data) > 0 && saveCreatedAddress(response.data)
    })
    .finally(() => isPageLoading(false))
})()
