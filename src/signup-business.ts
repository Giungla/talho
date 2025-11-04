
import {
  type CreateUserPayload,
  type CreateUserResponse,
  type ResponseType,
  type SignupBusinessComputedDefinition,
  type SignupBusinessContext,
  type SignupBusinessData,
  type SignUpBusinessDirectives,
  type SignupBusinessMethods,
  type SignupBusinessSetup,
  type SignupBusinessWatch,
} from '../types/signup-business'

import {
  type Nullable,
  type VIACEPFromXano,
  type ResponsePattern,
  type IScrollIntoViewArgs,
  type ISingleValidateCheckout,
} from '../global'

import {
  type Ref,
  type OnCleanup,
  type DirectiveBinding,
} from 'vue'

import {
  eventMap,
  NULL_VALUE,
  BLUR_EVENT,
  INPUT_EVENT,
  XANO_BASE_URL,
  EMPTY_STRING,
  statesAcronym,
  isAuthenticated,
  addAttribute,
  attachEvent,
  buildMaskDirective,
  buildRequestOptions,
  cleanupDirective,
  EMAIL_REGEX_VALIDATION,
  getAttribute,
  includes,
  maskCEP,
  maskCPFNumber,
  maskDate,
  maskPhoneNumber,
  numberOnly,
  objectSize,
  postErrorResponse,
  postSuccessResponse,
  pushIf,
  querySelector,
  regexTest,
  removeAttribute,
  removeClass,
  scrollIntoView,
  stringify,
  toUpperCase,
  trim,
  isCPFValid,
  validatePasswordParts,
  isDateValid,
  unAuthenticatedRedirect,
} from '../utils'

const {
  ref,
  unref,
  nextTick,
  createApp,
} = window.Vue

const VALUE_ATTRIBUTE = 'value'
const DATA_ORIGINAL_TEXT_ATTRIBUTE = 'data-original-text'

const SCROLL_INTO_VIEW_OPTIONS: IScrollIntoViewArgs = {
  block: 'center',
  behavior: 'smooth',
}

function buildFieldValidation <T extends HTMLElement> (
  field: Ref<T> | T,
  valid: boolean,
  ignoreIf?: boolean,
): ISingleValidateCheckout {
  return {
    field,
    valid,
    ...(ignoreIf && ({ ignoreIf }))
  }
}

let addressController: Nullable<AbortController> = NULL_VALUE

const signupBusiness = createApp({
  setup () {
    return {
      formElement: ref<HTMLFormElement>(),

      globalErrorMessageElement: ref<HTMLDivElement>,
      globalSuccessMessageElement: ref<HTMLDivElement>,

      firstNameElement: ref<HTMLInputElement>(),
      lastNameElement: ref<HTMLInputElement>(),
      cpfElement: ref<HTMLInputElement>(),
      emailElement: ref<HTMLInputElement>(),
      birthDayElement: ref<HTMLInputElement>(),
      phoneElement: ref<HTMLInputElement>(),
      passwordElement: ref<HTMLInputElement>(),

      cepElement: ref<HTMLInputElement>(),
      addressElement: ref<HTMLInputElement>(),
      numberElement: ref<HTMLInputElement>(),
      neighborhoodElement: ref<HTMLInputElement>(),
      cityElement: ref<HTMLInputElement>(),
      stateElement: ref<HTMLInputElement>(),

      termsElement: ref<HTMLInputElement>(),
    }
  },

  data () {
    return {
      user: {
        name: EMPTY_STRING,
        lastName: EMPTY_STRING,
        cpf: EMPTY_STRING,
        email: EMPTY_STRING,
        phone: EMPTY_STRING,
        birthDate: EMPTY_STRING,
        password: EMPTY_STRING,
      },

      address: {
        cep: EMPTY_STRING,
        address: EMPTY_STRING,
        number: EMPTY_STRING,
        complement: EMPTY_STRING,
        neighborhood: EMPTY_STRING,
        city: EMPTY_STRING,
        state: EMPTY_STRING,
      },

      acceptTerms: false,

      optIn: false,

      visitedFields: [],

      loadingText: NULL_VALUE,

      addressMessageError: NULL_VALUE,

      isSubmitted: false,

      createResponse: NULL_VALUE,
    }
  },

  methods: {
    async createUser (payload: CreateUserPayload): Promise<ResponsePattern<CreateUserResponse>> {
      const defaultErrorMessage = 'Houve uma falha ao registrar o usuário'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:USKfYC-x/user/create`, {
          ...buildRequestOptions([], 'POST'),
          body: stringify<CreateUserPayload>(payload),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: CreateUserResponse = await response.json()

        return postSuccessResponse.call(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async searchAddress (cep: string, signal: AbortSignal): Promise<ResponsePattern<VIACEPFromXano>> {
      const defaultErrorMessage = 'Houve uma falha na busca do endereço'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}`, {
          ...buildRequestOptions(),
          signal,
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: void = await response.json()

        return postSuccessResponse.call(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async handleSubmit (e: SubmitEvent): Promise<void> {
      e.preventDefault()

      if (!this.isSubmitted) {
        this.isSubmitted = true
      }

      this.triggerValidations()

      const { firstInvalidField } = this

      if (firstInvalidField) {
        scrollIntoView(firstInvalidField.field, SCROLL_INTO_VIEW_OPTIONS)

        return
      }

      this.loadingText = 'Registrado usuário...'

      const {
        user,
        address,
        optIn,
        acceptTerms,
      } = this

      const response = await this.createUser({
        user,
        address,
        optIn,
        acceptTerms,
      })

      this.loadingText = NULL_VALUE

      if (!response.succeeded) {
        this.createResponse = response.message

        return nextTick(() => {
          const errorMessage = this.globalErrorMessageElement as HTMLDivElement | undefined

          if (!errorMessage) return

          scrollIntoView(errorMessage, SCROLL_INTO_VIEW_OPTIONS)
        })
      }

      this.createResponse = response.data

      nextTick(() => {
        this.formElement?.reset()

        const successMessage = this.globalSuccessMessageElement as HTMLDivElement | undefined

        if (!successMessage) return

        scrollIntoView(successMessage, SCROLL_INTO_VIEW_OPTIONS)
      })
    },

    setVisitedField (fieldName: string): void {
      // this.visitedFields.push(fieldName)
      pushIf(true, this.visitedFields, fieldName)
    },

    hasVisitEntry (fieldName: string): boolean {
      return this.visitedFields.includes(fieldName)
    },

    triggerValidations (): void {
      const notIgnoredFields = this.validatableFields

      for (const { field } of notIgnoredFields) {
        field?.dispatchEvent?.(BLUR_EVENT)
      }
    },
  },

  computed: {
    nameValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.firstNameElement),
        !this.hasVisitEntry('firstName') || objectSize(trim(this.user.name)) > 1,
      )
    },

    lastNameValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.lastNameElement),
        !this.hasVisitEntry('lastName') || objectSize(trim(this.user.lastName)) > 1,
      )
    },

    cpfValidation (): ISingleValidateCheckout<HTMLInputElement> {
      const {
        cpf,
      } = this.user

      return buildFieldValidation<HTMLInputElement>(
        unref(this.cpfElement),
        !this.hasVisitEntry('cpf') || (regexTest(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, trim(cpf)) && isCPFValid(cpf)),
      )
    },

    emailValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.emailElement),
        !this.hasVisitEntry('email') || regexTest(EMAIL_REGEX_VALIDATION(), trim(this.user.email)),
      )
    },

    birthDateValidation (): ISingleValidateCheckout<HTMLInputElement> {
      const {
        birthDate,
      } = this.user

      return buildFieldValidation<HTMLInputElement>(
        unref(this.birthDayElement),
        !this.hasVisitEntry('birthDate') || (regexTest(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/, trim(birthDate)) && isDateValid(birthDate)),
      )
    },

    phoneValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.phoneElement),
        !this.hasVisitEntry('phone') || regexTest(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, this.user.phone),
      )
    },

    cepValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.cepElement),
        !this.hasVisitEntry('cep') || regexTest(/^\d{5}-\d{3}$/, this.address.cep),
      )
    },

    addressValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.addressElement),
        !this.hasVisitEntry('address') || objectSize(trim(this.address.address)) > 2,
      )
    },

    numberValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.numberValidation),
        !this.hasVisitEntry('number') || objectSize(trim(this.address.number)) > 0,
      )
    },

    neighborhoodValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.neighborhoodElement),
        !this.hasVisitEntry('neighborhood') || objectSize(trim(this.address.neighborhood)) > 3,
      )
    },

    cityValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation<HTMLInputElement>(
        unref(this.cityElement),
        !this.hasVisitEntry('city') || objectSize(trim(this.address.city)) > 2,
      )
    },

    stateValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation(
        unref(this.stateElement),
        !this.hasVisitEntry('state') || statesAcronym.includes(this.address.state),
      )
    },

    passwordValidation (): ISingleValidateCheckout<HTMLInputElement> {
      const hasValidPassword = Object
        .values<boolean>(validatePasswordParts(this.user.password))
        .every(group => group)

      return buildFieldValidation(
        unref(this.passwordElement),
        !this.hasVisitEntry('password') || hasValidPassword,
      )
    },

    termsValidation (): ISingleValidateCheckout<HTMLInputElement> {
      return buildFieldValidation(
        unref(this.termsElement),
        !this.isSubmitted || this.acceptTerms,
      )
    },

    validatableFields (): ISingleValidateCheckout<HTMLInputElement>[] {
      return [
        this.nameValidation,
        this.lastNameValidation,
        this.cpfValidation,
        this.emailValidation,
        this.birthDateValidation,
        this.phoneValidation,
        this.cepValidation,
        this.addressValidation,
        this.numberValidation,
        this.neighborhoodValidation,
        this.cityValidation,
        this.stateValidation,
        this.passwordValidation,
        this.termsValidation,
      ].filter(({ ignoreIf }) => includes([false, undefined], ignoreIf))
    },

    firstInvalidField (): ISingleValidateCheckout | undefined {
      return this.validatableFields.find(({ valid }) => !valid)
    },

    getLoadingText (): Nullable<string> {
      return this.loadingText ?? 'Enviar'
    },

    getAddressErrorMessage (): Nullable<string> {
      return this.addressMessageError ?? NULL_VALUE
    },

    getResponseType (): Nullable<ResponseType> {
      const { createResponse } = this

      if (!createResponse) return NULL_VALUE

      return typeof createResponse === 'string'
        ? 'error'
        : 'success'
    },
  },

  watch: {
    'address.cep' (value: string, oldValue: string, cleanup: OnCleanup): void {
      if (value === oldValue || !regexTest(/^\d{5}-\d{3}$/, value)) return

      addressController = new AbortController()

      cleanup(() => {
        this.addressMessageError = NULL_VALUE

        if (!addressController?.signal.aborted) {
          addressController?.abort()
        }

        addressController = NULL_VALUE
      })

      this.searchAddress(
        numberOnly(value),
        addressController.signal,
      ).then(response => {
        if (!response.succeeded) {
          this.addressMessageError = response.message

          this.address.address      = EMPTY_STRING
          this.address.state        = EMPTY_STRING
          this.address.city         = EMPTY_STRING
          this.address.neighborhood = EMPTY_STRING

          return
        }

        this.address.address      = trim(response.data.logradouro)
        this.address.state        = trim(response.data.uf)
        this.address.city         = trim(response.data.localidade)
        this.address.neighborhood = trim(response.data.bairro)
      })
    },
  },

  directives: {
    maskCep: buildMaskDirective(numberOnly, maskCEP),

    maskCpf: buildMaskDirective(numberOnly, maskCPFNumber),

    maskDate: buildMaskDirective(numberOnly, maskDate),

    maskPhone: buildMaskDirective(numberOnly, maskPhoneNumber),

    trim: {
      mounted (el: HTMLInputElement) {
        const remover = attachEvent(el, 'blur', (event: Event) => {
          if (!event.isTrusted) return

          const target = event.target as HTMLInputElement

          target.value = trim(target.value)

          el.dispatchEvent(INPUT_EVENT)
        })

        eventMap.set(el, remover)
      },

      unmounted: cleanupDirective,
    },

    uppercase: buildMaskDirective(toUpperCase),

    visitedField: {
      mounted (el: HTMLInputElement, binding: DirectiveBinding<string>) {
        const remover = attachEvent(el, 'blur', () => {
          const instance = binding.instance as SignupBusinessContext

          instance.setVisitedField(binding.value)

          eventMap.delete(el)
        }, { once: true })

        eventMap.set(el, remover)
      },

      unmounted: cleanupDirective,
    },

    value: {
      mounted (el: HTMLInputElement, binding: DirectiveBinding<string>) {
        addAttribute(el, DATA_ORIGINAL_TEXT_ATTRIBUTE, trim(el.value))
        addAttribute(el, VALUE_ATTRIBUTE, trim(binding.value))
      },

      updated (el: HTMLInputElement, binding: DirectiveBinding<string>) {
        addAttribute(el, VALUE_ATTRIBUTE, trim(binding.value))
      },

      unmounted (el: HTMLInputElement) {
        addAttribute(el, VALUE_ATTRIBUTE, getAttribute(el, DATA_ORIGINAL_TEXT_ATTRIBUTE) ?? '')
        removeAttribute(el, DATA_ORIGINAL_TEXT_ATTRIBUTE)
      },
    }
  },
} satisfies {
  setup: () => SignupBusinessSetup;
  data: () => SignupBusinessData;
  methods: SignupBusinessMethods;
  computed: SignupBusinessComputedDefinition;
  watch: SignupBusinessWatch;
  directives: SignUpBusinessDirectives;
} & ThisType<SignupBusinessContext>)

if (!isAuthenticated()) {
  unAuthenticatedRedirect()
} else {
  const businessFormIdentifier = '#business-form'

  /**
   * Container onde o app Vue será montado
   */
  const businessForm: HTMLDivElement = querySelector(businessFormIdentifier)
  /**
   * Container de formulário padrão do Webflow
   */
  const wForm: HTMLDivElement        = querySelector<'div'>('.formblock', businessForm)

  const formRegister: HTMLFormElement = querySelector('#wf-form-register', businessForm)

  if (formRegister) {
    removeClass(wForm, 'w-form')

    wForm.innerHTML = formRegister.outerHTML
  }

  signupBusiness.mount(businessFormIdentifier)

  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if (e.persisted) window.location.reload()
  })
}
