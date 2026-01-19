
import {
  type UserStateProxy,
  type ICurrentUserData,
  type FunctionErrorPattern,
  type FunctionSucceededPattern,
  type ResponsePattern,
  type ResponsePatternCallback, Nullable,
} from '../global'

import {
  EnumHttpMethods,
} from '../types/http'

import {
  DASH_STRING,
  EMPTY_STRING,
  SLASH_STRING,
  XANO_BASE_URL,
} from '../utils/consts'

import {
  GENERAL_HIDDEN_CLASS,
  trim,
  addClass,
  splitText,
  stringify,
  regexTest,
  numberOnly,
  objectSize,
  toggleClass,
  removeClass,
  attachEvent,
  querySelector,
  normalizeText,
  removeAttribute,
  changeTextContent,
  CPF_REGEX_VALIDATION,
  PHONE_REGEX_VALIDATION,
  DATE_REGEX_VALIDATION, isNull, isUndefined,
} from '../utils/dom'

import {
  postErrorResponse,
  buildRequestOptions,
  postSuccessResponse,
} from '../utils/requestResponse'

import {
  isCPFValid,
  isDateValid,
} from '../utils/validation'

import {
  maskDate,
  maskCPFNumber,
  maskPhoneNumber,
} from '../utils/mask'

(function () {
  const ERROR_MESSAGE_CLASS = 'mensagemdeerro'

  const USER_BASE_PATH = `${XANO_BASE_URL}/api:TJEuMepe`

  function camelToKebabCase (str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  function hasOwnProperty (target: HTMLElement | object, property: PropertyKey): boolean {
    return target.hasOwnProperty(property)
  }

  function handleMessages (form: HTMLFormElement, response: Awaited<ReturnType<typeof postPersonalData>>) {
    const isError = !response.succeeded

    const errorMessage = querySelector('[data-wtf-user-update-error-message]', form)
    const successMessage = querySelector('[data-wtf-user-update-success-message]', form)

    toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError)
    toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError)

    if (!isError) {
      setTimeout(() => addClass(successMessage, GENERAL_HIDDEN_CLASS), 8000)

      return
    }

    const textElement = errorMessage && querySelector('div', errorMessage)

    changeTextContent(textElement, response.message)
  }

  function renderSinglePersonalData (where: ReturnType<typeof querySelector>, value: string | null) {
    toggleClass(where, GENERAL_HIDDEN_CLASS, !value)

    changeTextContent(where, value ?? EMPTY_STRING)
  }

  function syncState (state: Omit<ICurrentUserData, 'id'>) {
    Object.assign(userState, state)

    setupEditAction()
  }

  const userState = new Proxy<UserStateProxy>({
    cpf: EMPTY_STRING,
    name: EMPTY_STRING,
    email: EMPTY_STRING,
    birthday: EMPTY_STRING,
    telephone: EMPTY_STRING,
    isFormVisible: false,
  } as UserStateProxy, {
    get (target: UserStateProxy, key: string | symbol): any {
      const value = Reflect.get(target, key)

      switch (key) {
        case 'fullName':
          return `${target?.name} ${target?.last_name}`
        default:
          return value
      }
    },

    set <T extends keyof UserStateProxy> (target: UserStateProxy, key: T, newValue: UserStateProxy[T], receiver: UserStateProxy & { fullName: string }) {
      const response = Reflect.set(target, key, newValue)

      switch (key) {
        case 'name':
        case 'last_name':
          renderSinglePersonalData(printName, receiver?.fullName ?? EMPTY_STRING)

          break
        case 'birthday':
          renderSinglePersonalData(printBirthday, newValue as string)

          break
        case 'telephone':
          renderSinglePersonalData(printPhone, newValue as string)

          break
        case 'cpf':
          renderSinglePersonalData(printCPF, newValue as string)

          break
        case 'email':
          renderSinglePersonalData(printEmail, newValue as string)

          break
        case 'points':
          renderSinglePersonalData(printPoints, newValue as string)

          break
      }

      return response
    }
  })

  const removeAttributes = [
    'name',
    'method',
    'data-name',
    'aria-label',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ]

  const _form = querySelector<'form'>('#wf-form-update-user-data')

  if (_form) {
    for (const attribute of removeAttributes) {
      removeAttribute(_form, attribute)
    }

    const parentElement = _form.parentElement as HTMLElement

    const submit = querySelector('[type="submit"]', _form)

    removeAttribute(submit, 'disabled')

    removeClass(parentElement, 'w-form')

    _form.remove()

    parentElement.insertAdjacentHTML('beforeend', _form.outerHTML)
  }

  const form = querySelector<'form'>('#wf-form-update-user-data') as HTMLFormElement

  attachEvent(form, 'submit', async (e: SubmitEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const hasCPF = hasOwnProperty(form, 'cpf')

    const _validators = [
      validateNameField,
      validateLastNameField,
      validatePhoneField,
      validateBirthdayField,
    ]

    if (hasCPF) {
      _validators.splice(2, 0, validateCPFField)
    }

    const failed = _validators.find(_validator => _validator().at(1) === false)

    if (failed) {
      const attribute = camelToKebabCase(failed().at(0) as string)

      querySelector(`[data-${attribute}]`, form)?.focus({
        preventScroll: false
      })

      return
    }

    const birthday = splitText(dateField?.value ?? EMPTY_STRING, SLASH_STRING)
      .reverse()
      .join(DASH_STRING)

    const body: Omit<ICurrentUserData, 'id' | 'email' | 'points'> = {
      birthday,
      cpf: CPFField?.value as string,
      name: nameField?.value as string,
      telephone: phoneField?.value as string,
      last_name: lastNameField?.value as string
    }

    if (hasCPF) {
      Object.assign(body, { cpf: CPFField?.value as string })
    }

    const response = await postPersonalData(body)

    handleMessages(form, response)

    if (!response.succeeded) return

    // @ts-ignore
    window?.refreshOrders?.()

    syncState(response.data)
  })

  const printPoints = querySelector<'div'>('[data-wtf-score]')
  const printName = querySelector<'div'>('[data-wtf-name]')
  const printEmail = querySelector<'div'>('[data-wtf-email]')
  const printPhone = querySelector<'div'>('[data-wtf-phone]')
  const printCPF = querySelector<'div'>('[data-wtf-cpf]')
  const printBirthday = querySelector<'div'>('[data-wtf-birthday]')

  const nameField = querySelector<'input'>('[data-wtf-name-update]')
  const lastNameField = querySelector<'input'>('[data-wtf-last-name-update]')
  const phoneField = querySelector<'input'>('[data-wtf-phone-update]')
  const CPFField = querySelector<'input'>('[data-wtf-cpf-update]')
  const dateField = querySelector<'input'>('[data-wtf-birthday-update]')

  const editButton = querySelector('[data-wtf-edit-account-data]')
  const formGroup = querySelector('[data-wtf-update-account-data]')

  const validators = [
    { field: nameField,     validator: validateNameField     },
    { field: lastNameField, validator: validateLastNameField },
    { field: CPFField,      validator: validateCPFField      },
    { field: phoneField,    validator: validatePhoneField    },
    { field: dateField,     validator: validateBirthdayField },
  ]

  for (const { field, validator } of validators) {
    if (!field) continue

    attachEvent(field, 'blur', validator)

    attachEvent(field, 'input', () => applyWrapperError(field, true))
  }

  if (!phoneField) return

  attachEvent(phoneField, 'input', () => {
    phoneField.value = maskPhoneNumber(numberOnly(phoneField.value))
  })

  if (!CPFField) return

  attachEvent(CPFField, 'input', () => {
    CPFField.value = maskCPFNumber(numberOnly(CPFField.value))
  })

  if (!dateField) return

  attachEvent(dateField, 'input', () => {
    dateField.value = maskDate(numberOnly(dateField.value))
  })

  function setupEditAction () {
    if (!editButton) return

    attachEvent(editButton, 'click', () => {
      removeClass(formGroup, GENERAL_HIDDEN_CLASS)

      addClass(editButton, GENERAL_HIDDEN_CLASS)
    }, { once: true })

    const _mapper: [Nullable<HTMLInputElement>, Nullable<string> | undefined][] = [
      [CPFField, userState.cpf],
      [nameField, userState.name],
      [dateField, userState.birthday],
      [phoneField, userState.telephone],
      [lastNameField, userState.last_name],
    ]

    for (const [field, value] of _mapper) {
      setStateToField(field as ReturnType<typeof querySelector<'input'>>, value as string | undefined)

      if (field !== CPFField || isNull(field)) continue

      toggleClass(field.closest('[data-wtf-wrapper]'), GENERAL_HIDDEN_CLASS, !isNull(value) && !isUndefined(value) && isCPFValid(value))
    }

    removeClass(editButton, GENERAL_HIDDEN_CLASS)
    addClass(formGroup, GENERAL_HIDDEN_CLASS)
  }

  function setStateToField (field: ReturnType<typeof querySelector<'input'>>, value?: string) {
    if (!field || field.tagName !== 'INPUT') return

    field.value = value ?? ''
  }

  function removeDuplicatedSpaces (value: string): string {
    return trim(value).replace(/\s+/g, ' ')
  }

  function validatorResponse (datasetName: string) {
    return function (valid: boolean) {
      return [datasetName, valid]
    }
  }

  function applyWrapperError (element: Exclude<ReturnType<typeof querySelector>, null>, isValid: boolean) {
    const wrapperElement = element.closest('[data-wtf-wrapper]')

    toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid)
  }

  function isNameValid (name: string): boolean {
    return regexTest(/^[a-zA-Z\s]+$/, name)
  }

  function validateNameField () {
    const response = validatorResponse('wtfNameUpdate')

    if (!nameField) return response(false)

    const cleanedName = removeDuplicatedSpaces(normalizeText(nameField.value))

    const isFieldValid = objectSize(cleanedName) > 1 && isNameValid(cleanedName)

    applyWrapperError(nameField, isFieldValid)

    return response(isFieldValid)
  }

  function validateLastNameField () {
    const response = validatorResponse('wtfLastNameUpdate')

    if (!lastNameField) return response(false)

    const cleanedName = removeDuplicatedSpaces(normalizeText(lastNameField.value))

    const isFieldValid = objectSize(cleanedName) > 0 && isNameValid(cleanedName)

    applyWrapperError(lastNameField, isFieldValid)

    return response(isFieldValid)
  }

  function validateCPFField () {
    const response = validatorResponse('wtfCpfUpdate')

    if (!CPFField) return response(false)

    const isFieldValid = regexTest(CPF_REGEX_VALIDATION, CPFField.value) && isCPFValid(CPFField.value)

    applyWrapperError(CPFField, isFieldValid)

    return response(isFieldValid)
  }

  function validatePhoneField () {
    const response = validatorResponse('wtfPhoneUpdate')

    if (!phoneField) return response(false)

    const isFieldValid = regexTest(PHONE_REGEX_VALIDATION, phoneField.value)

    applyWrapperError(phoneField, isFieldValid)

    return response(isFieldValid)
  }

  function validateBirthdayField () {
    const response = validatorResponse('wtfBirthdayUpdate')

    if (!dateField) return response(false)

    const date = dateField.value

    if (!isDateValid(date)) {
      applyWrapperError(dateField, false)

      return response(false)
    }

    const hasPatternMatch = regexTest(DATE_REGEX_VALIDATION, date)

    const [day, month, year] = splitText(date, SLASH_STRING)

    const getTimeFromDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`).getTime()

    const isValidDate = hasPatternMatch && Date.now() > getTimeFromDate

    applyWrapperError(dateField, isValidDate)

    return response(isValidDate)
  }

  async function postPersonalData <
    T extends Omit<ICurrentUserData, 'id'>,
    K extends Omit<ICurrentUserData, 'id' | 'email' | 'points'>,
  > (payload: K): Promise<ResponsePattern<T>> {
    const defaultErrorMessage = 'Houve uma falha ao salvar seus dados. Tente novamente mais tarde.'

    try {
      const response = await fetch(`${USER_BASE_PATH}/user/edit`, {
        ...buildRequestOptions([], EnumHttpMethods.PUT),
        body: stringify<K>(payload),
      })
  
      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
      }

      const personalData: T = await response.json()

      return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, personalData)
    } catch (error) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  async function getCurrentUser <T extends Omit<ICurrentUserData, 'id'>> (): Promise<ResponsePattern<T>> {
    const defaultErrorMessage = 'Houve uma falha ao carregar seus dados. Tente novamente mais tarde.'

    try {
      const response = await fetch(`${USER_BASE_PATH}/user/get`, {
        ...buildRequestOptions(),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message?? defaultErrorMessage)
      }

      const personalData: T = await response.json()

      return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, personalData)
    } catch (error) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  getCurrentUser().then(response => {
    if (!response.succeeded) return

    syncState(response.data)
  })
})();
