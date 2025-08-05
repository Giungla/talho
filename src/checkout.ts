
import type {
  BRLString,
  CartResponse,
  ComputedDeliveryHours,
  FunctionSucceededPattern,
  GetCouponRequestBody,
  GetInstallmentsBody,
  IAddressType,
  InstallmentItem,
  IOrderAddressType,
  IParsedAddress,
  IParsedAddressContent,
  ISingleOrderCoupon,
  ISingleOrderCouponError,
  ISinglePaymentKey,
  ISingleValidateCheckout,
  IStateAcronym,
  Nullable,
  PagSeguroCardEncrypt,
  ParsedProductList,
  PostOrder,
  PostOrderCustomer,
  ResponsePattern,
  TalhoCheckoutAppComputedDefinition,
  TalhoCheckoutAppData,
  TalhoCheckoutAppMethods,
  TalhoCheckoutAppSetup,
  TalhoCheckoutAppWatch,
  TalhoCheckoutContext,
  VIACEPFromXano,
  OnCleanup,
  SubsidyResponse,
  PostOrderDelivery,
  PostOrderDeliveryGroup,
  CreditCardPostAdditional,
  PaymentResponseMap,
} from '../global'

// @ts-expect-error
import type { DirectiveBinding, Ref, ObjectDirective } from 'vue'
import type {
  SearchAddressCheckout,
  CheckoutDeliveryRequestBody,
  CheckoutDeliveryPriceResponse,
  CheckoutDeliveryOption,
  ComputedDeliveryDates,
  CheckoutDeliveryResponse,
  CheckoutDeliveryHour,
} from '../types/checkout'

const {
  ref,
  createApp,
} = Vue

import {
  NULL_VALUE,
  EMPTY_STRING,
  XANO_BASE_URL,
  FREE_SHIPPING_MIN_CART_PRICE,
  BRLFormatter,
  statesMap,
  statesAcronym,
  STORAGE_KEY_NAME,
  buildURL,
  isArray,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  isNull,
  clamp,
  isPageLoading,
  stringify,
  numberOnly,
  decimalRound,
  normalizeText,
  objectSize,
  attachEvent,
} from '../utils'

const SLASH_STRING = '/'
const ERROR_KEY = 'error'

const SHIPPING_NAME_TOKEN = 'shipping'
const BILLING_NAME_TOKEN = 'billing'

const CEP_LENGTH = 8

const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`
const PAYMENT_BASE_URL = `${XANO_BASE_URL}/api:5lp3Lw8X`
const DELIVERY_BASE_URL = `${XANO_BASE_URL}/api:24B7O9Aj`

const MIN_AVAILABLE_INSTALLMENT_COUNT = 1
const MAX_AVAILABLE_INSTALLMENT_COUNT = 2

const CPF_VERIFIERS_INDEXES = [10, 11]

const eventMap: WeakMap<HTMLElement, ReturnType<typeof attachEvent>> = new WeakMap()

const INPUT_EVENT = new Event('input')

const DELIVERY_TYPE_SAME = 'same'
const DELIVERY_TYPE_DIFF = 'diff'

const PIX_PAYMENT = 'pix'
const CREDIT_CARD_PAYMENT = 'creditcard'

const ALLOWED_PAYMENT_METHODS = [
  PIX_PAYMENT,
  CREDIT_CARD_PAYMENT,
]

function getAbortController () {
  return new AbortController()
}

function hasOwn (object: object, key: PropertyKey): boolean {
  return Object.hasOwn(object, key)
}

function trimText (text: string): string {
  return text.trim()
}

function scrollIntoView (element: HTMLElement, args: boolean | ScrollIntoViewOptions) {
  element.scrollIntoView(args)
}

function isExpireDateValid (expireDate: string): boolean {
  const tokens = expireDate.split(SLASH_STRING)

  if (tokens.length !== 2) return false

  const [monthStr, yearStr] = tokens

  const month = parseInt(monthStr, 10)
  const shortYear = parseInt(yearStr, 10)

  if (isNaN(month) || isNaN(shortYear) || month < 1 || month > 12) return false

  const currentDate = new Date()
  const fullYear = 2000 + (shortYear < 100 ? shortYear : 0)

  const expireDateTime = new Date(fullYear, month, 0, 23, 59, 59)

  return expireDateTime > currentDate
}

function maskPhoneNumber (value: string): string {
  const replacer = (
    _: string,
    d1: Nullable<string>,
    d2: Nullable<string>,
    d3: Nullable<string>,
  ) => {
    const response: string[] = []

    pushIf(d1, response, `(${d1}`)
    pushIf(d2, response, `) ${d2}`)
    pushIf(d3, response, `-${d3}`)

    return response.join(EMPTY_STRING)
  }

  if (value.length < 11) {
    return value.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, replacer)
  }

  return value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4})/, replacer)
}

function maskCPFNumber (value: string): string {
  return value.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/, (
    _: string,
    g1: Nullable<string>,
    g2: Nullable<string>,
    g3: Nullable<string>,
    g4: Nullable<string>,
  ) => {
    const response: string[] = []

    pushIf(g1, response, `${g1}`)
    pushIf(g2, response, `.${g2}`)
    pushIf(g3, response, `.${g3}`)
    pushIf(g4, response, `-${g4}`)

    return response.join(EMPTY_STRING)
  })
}

function maskDate (value: string): string {
  return value.replace(/^(\d{0,2})(\d{0,2})(\d{0,4})/, (
    _: string,
    d1: Nullable<string>,
    d2: Nullable<string>,
    d3: Nullable<string>,
  ) => {
    return [d1, d2, d3]
      .filter(Boolean)
      .join(SLASH_STRING)
  })
}

function maskCardNumber (value: string): string {
  return value.replace(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/, (
    _: string,
    g1: Nullable<string>,
    g2: Nullable<string>,
    g3: Nullable<string>,
    g4: Nullable<string>,
  ) => {
    const response: string[] = []

    for (const group of [g1, g2, g3, g4]) {
      pushIf(group, response, group)
    }

    return response.join(' ')
  })
}

function maskCardDate (value: string): string {
  return value.replace(/^(\d{0,2})(\d{0,2})/, (
    _: string,
    g1: Nullable<string>,
    g2: Nullable<string>,
  ) => {
    const response: string[] = []

    for (const group of [g1, g2]) {
      pushIf(group, response, group)
    }

    return response.join(SLASH_STRING)
  })
}

function maskCEP (value: string): string {
  return value.replace(/^(\d{0,5})(\d{0,3})/, (
    _: string,
    g1: Nullable<string>,
    g2: Nullable<string>,
  ) => {
    const response: string[] = []

    for (const group of [g1, g2]) {
      pushIf(group, response, group)
    }

    return response.join('-')
  })
}

function toUpperCase (value: string): string {
  return value.toUpperCase()
}

function pushIf <T extends any> (condition: any, list: T[], value: T) {
  if (!condition) return -1

  return list.push(value)
}

function includes <T> (
  source: T[] | string,
  search: T extends string ? string : T
): boolean {
  return source.includes(search as any)
}

function regexTest (regex: RegExp, value: string): boolean {
  return regex.test(value)
}

function buildMaskDirective (...mappers: ((value: string) => string)[]) {
  return {
    mounted (el: HTMLInputElement) {
      const remover = attachEvent(el, 'input', (event: InputEvent) => {
        if (!event.isTrusted) return

        const target = event.target as HTMLInputElement

        target.value = mappers.reduce((value, callbackFn) => callbackFn(value), target.value ?? EMPTY_STRING)

        el.dispatchEvent(INPUT_EVENT)
      })

      eventMap.set(el, remover)
    },

    unmounted: cleanupDirective
  }
}

function buildFieldValidation (
  field: Ref<HTMLElement> | HTMLElement,
  valid: boolean,
  ignoreIf?: boolean,
): ISingleValidateCheckout {
  return {
    field,
    valid,
    ...(ignoreIf && ({ ignoreIf }))
  }
}

function isDateValid (date: string): boolean {
  const [
    day,
    month,
    fullYear
  ] = date.split(SLASH_STRING)

  const parsedDate = new Date(`${fullYear}-${month}-${day}T00:00:00`)

  return parsedDate.toString() !== 'Invalid Date'
}

function isCPFValid (cpf: string): boolean {
  cpf = numberOnly(cpf)

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const verifiers = CPF_VERIFIERS_INDEXES.map((verifierDigit, verifierIndex) => {
    const lastIndex = verifierIndex ? 10 : 9;

    const sum = [...cpf.slice(0, lastIndex)]
      .map(Number)
      .reduce((acc, cur, index) => acc + cur * (verifierDigit - index), 0)

    const result = 11 - (sum % 11)

    return result > 9
      ? 0
      : result
  })

  return cpf.endsWith(verifiers.join(EMPTY_STRING))
}

async function searchAddress ({ cep, deliveryMode }: SearchAddressCheckout): Promise<ResponsePattern<VIACEPFromXano>> {
  const defaultErrorMessage = 'Não foi possível encontrar o endereço'

  cep = numberOnly(cep)

  if (cep.length !== CEP_LENGTH) return postErrorResponse(defaultErrorMessage)

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}/checkout`, {
      ...buildRequestOptions([], 'POST'),
      body: stringify<Pick<SearchAddressCheckout, 'deliveryMode'>>({
        deliveryMode,
      })
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
    }

    const address: VIACEPFromXano = await response.json()

    return postSuccessResponse.call(response.headers, address) as FunctionSucceededPattern<VIACEPFromXano>
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

const cleanupDirective = (el: HTMLInputElement) => {
  const cleanup = eventMap.get(el)

  if (!cleanup) return

  cleanup()

  eventMap.delete(el)
}

const TalhoCheckoutApp = createApp({
  name: 'TalhoCheckoutApp',

  setup () {
    const customerCPF = ref<string>(EMPTY_STRING)
    const customerMail = ref<string>(EMPTY_STRING)
    const customerPhone = ref<string>(EMPTY_STRING)
    const customerBirthdate = ref<string>(EMPTY_STRING)

    const customerCreditCardCVV = ref<string>(EMPTY_STRING)
    const customerCreditCardDate = ref<string>(EMPTY_STRING)
    const customerCreditCardNumber = ref<string>(EMPTY_STRING)
    const customerCreditCardHolder = ref<string>(EMPTY_STRING)

    const billingCEP = ref<string>(EMPTY_STRING)
    const billingAddress = ref<string>(EMPTY_STRING)
    const billingNumber = ref<string>(EMPTY_STRING)
    const billingComplement = ref<string>(EMPTY_STRING)
    const billingNeighborhood = ref<string>(EMPTY_STRING)
    const billingCity = ref<string>(EMPTY_STRING)
    const billingState = ref<string>(EMPTY_STRING)

    const shippingRecipient = ref<string>(EMPTY_STRING)
    const shippingCEP = ref<string>(EMPTY_STRING)
    const shippingAddress = ref<string>(EMPTY_STRING)
    const shippingNumber = ref<string>(EMPTY_STRING)
    const shippingComplement = ref<string>(EMPTY_STRING)
    const shippingNeighborhood = ref<string>(EMPTY_STRING)
    const shippingCity = ref<string>(EMPTY_STRING)
    const shippingState = ref<string>(EMPTY_STRING)

    const couponCode = ref<string>(EMPTY_STRING)

    const customerMailElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const customerCPFElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const customerPhoneElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const customerBirthdateElement = ref<HTMLInputElement | null>(NULL_VALUE)

    const paymentMethodMessageElement = ref<HTMLInputElement | null>(NULL_VALUE)

    const customerCreditCardCVVElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const customerCreditCardDateElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const customerCreditCardNumberElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const customerCreditCardHolderElement = ref<HTMLInputElement | null>(NULL_VALUE)

    const billingCEPElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const billingAddressElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const billingNumberElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const billingNeighborhoodElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const billingCityElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const billingStateElement = ref<HTMLInputElement | null>(NULL_VALUE)

    const deliveryPlaceMessageElement = ref<HTMLElement | null>(NULL_VALUE)

    const shippingRecipientElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const shippingCEPElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const shippingAddressElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const shippingNumberElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const shippingNeighborhoodElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const shippingCityElement = ref<HTMLInputElement | null>(NULL_VALUE)
    const shippingStateElement = ref<HTMLInputElement | null>(NULL_VALUE)

    const deliveryDateMessageElement = ref<HTMLElement | null>(NULL_VALUE)

    const deliveryHourMessageElement = ref<HTMLElement | null>(NULL_VALUE)

    const installmentsMessageElement = ref<HTMLElement | null>(NULL_VALUE)

    const couponCodeElement = ref<HTMLInputElement | null>(NULL_VALUE)

    const deliveryPlaceAddressErrorMessage = ref<Nullable<string>>(NULL_VALUE)

    const deliveryBillingAddressErrorMessage = ref<Nullable<string>>(NULL_VALUE)

    const deliveryShippingAddressErrorMessage = ref<Nullable<string>>(NULL_VALUE)

    return {
      customerCPF,
      customerMail,
      customerPhone,
      customerBirthdate,

      customerCreditCardCVV,
      customerCreditCardDate,
      customerCreditCardNumber,
      customerCreditCardHolder,

      billingCEP,
      billingAddress,
      billingNumber,
      billingComplement,
      billingNeighborhood,
      billingCity,
      billingState,

      shippingRecipient,
      shippingCEP,
      shippingAddress,
      shippingNumber,
      shippingComplement,
      shippingNeighborhood,
      shippingCity,
      shippingState,

      couponCode,

      customerMailElement,
      customerCPFElement,
      customerPhoneElement,
      customerBirthdateElement,

      paymentMethodMessageElement,

      customerCreditCardCVVElement,
      customerCreditCardDateElement,
      customerCreditCardNumberElement,
      customerCreditCardHolderElement,

      billingCEPElement,
      billingAddressElement,
      billingNumberElement,
      billingNeighborhoodElement,
      billingCityElement,
      billingStateElement,

      deliveryPlaceMessageElement,

      shippingRecipientElement,
      shippingCEPElement,
      shippingAddressElement,
      shippingNumberElement,
      shippingNeighborhoodElement,
      shippingCityElement,
      shippingStateElement,

      deliveryDateMessageElement,

      deliveryHourMessageElement,

      installmentsMessageElement,

      couponCodeElement,

      deliveryPlaceAddressErrorMessage,

      deliveryBillingAddressErrorMessage,

      deliveryShippingAddressErrorMessage,
    }
  },

  data () {
    return {
      hasPendingPayment: false,
      isSubmitted: false,
      productlist: NULL_VALUE,
      visitedFields: [],
      selectedPayment: NULL_VALUE,
      availablePayments: [
        {
          label: 'Cartão de crédito',
          method: CREDIT_CARD_PAYMENT
        },
        {
          label: 'PIX',
          method: PIX_PAYMENT
        }
      ],
      deliveryPlace: NULL_VALUE,
      deliveryPlaces: [
        {
          token: DELIVERY_TYPE_SAME,
          label: 'Mesmo endereço de cobrança do cartão'
        },
        {
          token: DELIVERY_TYPE_DIFF,
          label: 'Entregar em um endereço diferente'
        }
      ],
      installment: NULL_VALUE,
      selectedInstallment: NULL_VALUE,
      isCouponPending: false,
      coupon: NULL_VALUE,
      isPagSeguroLoaded: false,
      deliveryDate: NULL_VALUE,
      deliveryHour: NULL_VALUE,

      isDeliveryLoading: false,
      deliveryPrice: NULL_VALUE,

      deliveryOptions: NULL_VALUE,

      priorityTax: NULL_VALUE,

      subsidy: NULL_VALUE,
    }
  },

  created (): void {
    this.refreshCart().then(() => isPageLoading(false))

    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY_NAME) return

      this.refreshCart()
    })
  },

  methods: {
    async getCart (): Promise<ResponsePattern<CartResponse>> {
      const defaultErrorMessage = 'Falha ao capturar os produtos'

      try {
        const response = await fetch(`${CART_BASE_URL}/cart/get`, {
          ...buildRequestOptions([]),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
        }

        const data: CartResponse = await response.json()

        return postSuccessResponse.call(response.headers, data) as FunctionSucceededPattern<CartResponse>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async refreshCart (): Promise<void> {
      if (this.hasPendingPayment) return

      return this.getCart()
        .then(cartData => {
          if (!cartData.succeeded) return

          if (cartData.data.items.length === 0) {
            location.href = buildURL('/', {
              reason: 'empty_cart'
            })

            return
          }

          this.productlist = cartData.data
        })
    },

    async getInstallments (): Promise<ResponsePattern<InstallmentItem[]>> {
      const defaultErrorMessage = 'Falha ao capturar o parcelamento'

      try {
        const response = await fetch(`${PAYMENT_BASE_URL}/calculatefees`, {
          ...buildRequestOptions([], 'POST'),
          body: stringify<GetInstallmentsBody>({
            amount: this.getOrderPrice,
            cardBin: this.customerCreditCardNumber
              .replace(/\D+/g, EMPTY_STRING)
              .slice(0, 8)
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call(response.headers, data) as FunctionSucceededPattern<InstallmentItem[]>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async refreshInstallments (): Promise<void> {
      if (!this.isCreditCard || !this.isCreditCardGroupValid || this.getCreditCardToken.hasErrors) return

      this.installment = NULL_VALUE
      this.selectedInstallment = NULL_VALUE

      const response = await this.getInstallments()

      if (!response.succeeded) return

      this.installment = response.data
    },

    setSelectedInstallmentsCount (installmentsCount: number): void {
      if (this.selectedInstallment === installmentsCount) return

      this.selectedInstallment = clamp(MIN_AVAILABLE_INSTALLMENT_COUNT, MAX_AVAILABLE_INSTALLMENT_COUNT, installmentsCount)
    },

    setSelectedPaymentMethod (method: ISinglePaymentKey): void {
      if (this.selectedPayment === method) return

      if (!this.hasDeliveryDates) {
        this.handleDeliveryOptions()
      }

      if (method !== CREDIT_CARD_PAYMENT) {
        this.clearCreditCardData()
      } else if (!this.isPagSeguroLoaded) {
        this.loadPagSeguro()
      }

      this.deliveryPlace = NULL_VALUE

      this.selectedPayment = method
    },

    setVisitedField (fieldName: string): number {
      return pushIf(!includes(this.visitedFields, fieldName), this.visitedFields, fieldName)
    },

    hasVisitRegistry (fieldName: string): boolean {
      return includes(this.visitedFields, fieldName)
    },

    async handlePayment (e: MouseEvent): Promise<void> {
      e.preventDefault()

      if (this.hasPendingPayment || this.isDeliveryLoading) return

      this.triggerValidations()

      if (!this.isSubmitted) {
        this.isSubmitted = true

        Vue.nextTick(() => this.handlePayment(e))

        return
      }

      const firstInvalidField = this.firstInvalidField

      if (firstInvalidField) {
        scrollIntoView(firstInvalidField.field, {
          block: 'center',
          behavior: 'smooth',
        })

        if (firstInvalidField.field.tagName === 'INPUT') {
          setTimeout(() => firstInvalidField.field.focus(), 500)
        }

        return
      }

      this.hasPendingPayment = !isPageLoading(true)

      const response = await this.handlePostPayment(this.selectedPayment as 'pix')

      if (!response.succeeded) {
        this.hasPendingPayment = !isPageLoading(false)

        return alert(response.message)
      }

      const redirectURL = {
        'pix': 'pix',
        'creditcard': 'confirmacao-do-pedido',
      }[this.selectedPayment as ISinglePaymentKey]

      location.href = buildURL(['/pagamento', redirectURL].join(SLASH_STRING), {
        order: response.data.transactionid,
      })

      localStorage.removeItem(STORAGE_KEY_NAME)
    },

    async handlePostPayment <T extends ISinglePaymentKey> (paymentType: T): Promise<ResponsePattern<PaymentResponseMap[T]>> {
      const defaultErrorMessage = 'Falha ao gerar o pedido'

      try {
        const response = await fetch(`${PAYMENT_BASE_URL}/payment/process/${paymentType}`, {
          ...buildRequestOptions([], 'POST'),
          body: stringify({
            ...this.getOrderBaseData,
            customer: {
              ...this.getParsedCustomer,
              ...this.getParsedAddresses,
            },
            ...(paymentType === CREDIT_CARD_PAYMENT && this.creditCardAdditionalInfo),
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call(response.headers, data) as FunctionSucceededPattern<PaymentResponseMap[T]>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    /*async handleProcessPIX (): Promise<ResponsePattern<PIXOrderResponse>> {
      const defaultErrorMessage = 'Falha ao gerar o pedido'

      try {
        const response = await fetch(`${PAYMENT_BASE_URL}/process_pix`, {
          ...POST_REQUEST,
          credentials: 'include',
          body: stringify<PostOrder>({
            ...this.getOrderBaseData,
            customer: {
              ...this.getParsedCustomer,
              ...this.getParsedAddresses,
            },
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse(error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse(data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async handleProcessCreditCard (): Promise<ResponsePattern<CreditCardOrderResponse>> {
      const defaultErrorMessage = 'Falha ao gerar o pedido'

      try {
        const selectedInstallment = this.selectedInstallment as number

        const response = await fetch(`${PAYMENT_BASE_URL}/process_creditcard`, {
          ...POST_REQUEST,
          credentials: 'include',
          body: stringify<CreditCardPostOrder>({
            ...this.getOrderBaseData,
            customer: {
              ...this.getParsedCustomer,
              ...this.getParsedAddresses,
            },
            is_same_address: this.isSameAddress,
            credit_card_info: {
              holderName: this.customerCreditCardHolder,
              creditCardToken: this.getCreditCardToken.encryptedCard ?? EMPTY_STRING,
              numberOfPayments: selectedInstallment,
              installmentValue: this.installment
                ?.find(({ installments }) => installments === selectedInstallment)
                ?.installment_value ?? 0
            }
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse(error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse(data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },*/

    triggerValidations (): void {
      const notIgnoredFields: ISingleValidateCheckout<Nullable<HTMLElement>>[] = this.notIgnoredFields

      for (const { field } of notIgnoredFields) {
        field?.dispatchEvent(new Event('blur'))
      }
    },

    feedAddress (
      addressType: IOrderAddressType,
      {
        uf,
        bairro,
        logradouro,
        localidade,
      }: VIACEPFromXano
    ): void {
      if (addressType === BILLING_NAME_TOKEN) {
        this.billingAddress = logradouro
        this.billingNeighborhood = bairro
        this.billingCity = localidade
        this.billingState = uf

        return
      }

      this.shippingAddress = logradouro
      this.shippingNeighborhood = bairro
      this.shippingCity = localidade
      this.shippingState = uf
    },

    setDeliveryPlace (deliveryPlace: IAddressType): void {
      if (this.deliveryPlace === deliveryPlace) return

      if (deliveryPlace === DELIVERY_TYPE_SAME && /^\d{5}\-\d{3}$/.test(this.billingCEP) && this.isBillingAddressGroupValid) {
        searchAddress({
          cep: this.billingCEP,
          deliveryMode: true
        }).then(address => {
          if (address.succeeded) return

          this.deliveryPlaceAddressErrorMessage = address.message
        })
      } else {
        this.deliveryPlaceAddressErrorMessage = NULL_VALUE
      }

      this.deliveryPlace = deliveryPlace
    },

    async captureAddress (addressType: IOrderAddressType, cep: string, oldCep?: string): Promise<boolean> {
      if (!regexTest(/^\d{5}-\d{3}$/, cep) || cep === oldCep) return false

      const fieldKey: `${IOrderAddressType}CEP` = `${addressType}CEP`

      const address = await searchAddress({
        cep,
        deliveryMode: addressType === SHIPPING_NAME_TOKEN
      })

      if (!address.succeeded) {
        this[fieldKey] = EMPTY_STRING

        this.setVisitedField(fieldKey)

        if (addressType === SHIPPING_NAME_TOKEN) {
          this.deliveryShippingAddressErrorMessage = address.message
        }

        if (addressType === BILLING_NAME_TOKEN) {
          this.deliveryBillingAddressErrorMessage = address.message
        }

        return false
      }

      switch (addressType) {
        case SHIPPING_NAME_TOKEN:
          this.deliveryShippingAddressErrorMessage = NULL_VALUE
          break
        case BILLING_NAME_TOKEN:
          this.deliveryBillingAddressErrorMessage = NULL_VALUE
      }

      this.feedAddress(addressType, address.data)

      return true
    },

    async captureCoupon (): Promise<ResponsePattern<ISingleOrderCoupon>> {
      const defaultErrorMessage = 'Falha ao capturar o cupom indicado'

      try {
        const response = await fetch(`${PAYMENT_BASE_URL}/get_coupon`, {
          ...buildRequestOptions([], 'POST'),
          body: stringify<GetCouponRequestBody>({
            verify_amount: true,
            coupon_code: this.couponCode,
            cpf: this.customerCPF && NULL_VALUE,
            has_subsidy: this.subsidy?.has ?? false,
            delivery_cep: this.getParsedAddresses.shippingaddress.zipPostalCode,
            has_selected_delivery: !isNull(this.deliveryHour) && !isNull(this.deliveryDate)
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call(response.headers, data) as FunctionSucceededPattern<ISingleOrderCoupon>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async handleSearchCoupon (): Promise<void> {
      if (this.isCouponPending) return

      this.isCouponPending = true

      const response = await this.captureCoupon()

      this.isCouponPending = false

      if (!response.succeeded) {
        this.coupon = ({
          error: true,
          message: response.message,
        }) satisfies ISingleOrderCouponError

        return
      }

      this.coupon = response.data
    },

    handleRemoveCoupon (): void {
      this.coupon = NULL_VALUE
      this.couponCode = EMPTY_STRING
    },

    loadPagSeguro (): void {
      const script = document.createElement('script')

      script.async = true
      script.src = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js'
      script.onload = () => {
        this.isPagSeguroLoaded = true
      }

      document.head.appendChild(script)
    },

    clearCreditCardData (): void {
      this.customerCreditCardHolder = EMPTY_STRING
      this.customerCreditCardNumber = EMPTY_STRING
      this.customerCreditCardDate   = EMPTY_STRING
      this.customerCreditCardCVV    = EMPTY_STRING
    },

    async handleDeliveryOptions (): Promise<void> {
      const response = await this.captureDeliveryOptions()

      if (!response.succeeded) return

      this.deliveryOptions = response.data
    },

    async captureDeliveryOptions (): Promise<ResponsePattern<CheckoutDeliveryResponse>> {
      const defaultErrorMessage = 'Falha ao capturar as opções de entrega'

      try {
        const response = await fetch(`${DELIVERY_BASE_URL}/delivery`, {
          ...buildRequestOptions([]),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
        }

        const data: CheckoutDeliveryResponse = await response.json()

        return postSuccessResponse.call(response.headers, data) as FunctionSucceededPattern<CheckoutDeliveryResponse>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    setDeliveryDate (shiftDays: number): void {
      const deliveryOption = this.deliveryOptions?.dates?.find(({ shift_days }) => shift_days === shiftDays)

      if (!deliveryOption || this.deliveryDate === shiftDays) return

      this.deliveryDate  = deliveryOption.shift_days
      this.deliveryHour  = NULL_VALUE
      this.deliveryPrice = NULL_VALUE
    },

    setDeliveryHour (_hour: number): void {
      if (this.deliveryHour === _hour || this.getSelectedDateDetails?.periods.periods_count === 0) return

      this.deliveryHour = _hour
    },

    async handleDeliveryQuotation (controller: AbortController): Promise<void> {
      this.isDeliveryLoading = true

      const response = await this.captureDeliveryQuotation(controller)

      if (!response.succeeded) return

      const {
        total: value,
        validator,
      } = response.data

      this.deliveryPrice = {
        value,
        validator,
      } satisfies Omit<PostOrderDeliveryGroup, 'has_priority'>

      this.isDeliveryLoading = false
    },

    async captureDeliveryQuotation (controller: AbortController): Promise<ResponsePattern<CheckoutDeliveryPriceResponse>> {
      const defaultErrorMessage = 'Falha ao gerar uma cotação'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:i6etHc7G/site/checkout-delivery`, {
          ...buildRequestOptions([], 'POST'),
          signal: controller.signal,
          body: stringify<Omit<PostOrderDelivery, 'delivery_price'> & Pick<CheckoutDeliveryRequestBody, 'cep'>>(this.quotationPayload as (Omit<PostOrderDelivery, 'delivery_price'> & Pick<CheckoutDeliveryRequestBody, 'cep'>)),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
        }

        const data: CheckoutDeliveryPriceResponse = await response.json()

        return postSuccessResponse.call(response.headers, data) as FunctionSucceededPattern<CheckoutDeliveryPriceResponse>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async handleSubsidy (): Promise<void> {
      const shippingCEP = this.getParsedAddresses.shippingaddress.zipPostalCode

      if (!/^\d{5}\-\d{3}$/.test(shippingCEP)) return

      const response = await this.verifyForSubsidy(numberOnly(shippingCEP))

      this.subsidy = response.succeeded
        ? response.data
        : NULL_VALUE
    },

    async verifyForSubsidy (cep: string): Promise<ResponsePattern<SubsidyResponse>> {
      const defaultErrorMessage = 'Houve uma falha na verificação'

      try {
        const response = await fetch(`${DELIVERY_BASE_URL}/delivery/${cep}/subsidy`, {
          ...buildRequestOptions([]),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
        }

        const data: SubsidyResponse = await response.json()

        return postSuccessResponse.call(response.headers, data) as FunctionSucceededPattern<SubsidyResponse>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },
  },

  computed: {
    hasSelectedPaymentMethod (): boolean {
      return !isNull(this.selectedPayment)
    },

    isCreditCard (): boolean {
      return this.selectedPayment === CREDIT_CARD_PAYMENT
    },

    getOrderSubtotal (): number {
      return this.productlist?.order_price ?? 0
    },

    getOrderSubtotalFormatted (): string {
      return BRLFormatter.format(this.getOrderSubtotal)
    },

    getOrderPrice (): number {
      const finalPrice = [
        this.getOrderSubtotal,
        this.getShippingPrice,
        this.priorityFee,
        this.subsidyDiscountPrice,
        this.getCouponDiscountPrice,
      ].reduce((accPrice, price) => accPrice + price, 0)

      return decimalRound(finalPrice, 2)
    },

    getOrderPriceFormatted (): string {
      return BRLFormatter.format(this.getOrderPrice)
    },

    getShippingPrice (): number {
      if (this.hasFreeShippingByCartPrice) return 0

      return isNull(this.deliveryPrice)
        ? 0
        : (this.deliveryPrice as Omit<PostOrderDeliveryGroup, "has_priority">).value / 100
    },

    getShippingPriceFormatted (): string {
      if (this.hasFreeShippingByCartPrice) return 'Frete grátis'

      return BRLFormatter.format(this.getShippingPrice)
    },

    getCouponDiscountPrice (): number {
      if (this.hasNullCoupon || this.hasInvalidCoupon) return 0

      const {
        value,
        is_percentage,
      } = this.coupon as ISingleOrderCoupon

      const selectedPrice = this.getParsedPriceForApplyDiscount

      let discountPrice: number = is_percentage
        ? Math.min(value / 100, 1) * (selectedPrice * -1)
        : Math.min(selectedPrice, value) * -1

      return Math.round(Math.abs(discountPrice) * 100) / 100 * Math.sign(discountPrice)
    },

    getCouponDiscountPriceFormatted (): string {
      return BRLFormatter.format(this.getCouponDiscountPrice)
    },

    getParsedPriceForApplyDiscount (): number {
      if (this.hasNullCoupon || this.hasInvalidCoupon) return 0

      const { cupom_type } = this.coupon as ISingleOrderCoupon

      const { getShippingPrice } = this

      if (cupom_type === SHIPPING_NAME_TOKEN && this.hasSubsidy) {
        return Math.max(getShippingPrice + this.subsidyDiscountPrice, 0)
      }

      return {
        product_id: 0,
        shipping: getShippingPrice,
        subtotal: this.getOrderSubtotal,
      }[cupom_type]
    },

    getParsedProducts (): ParsedProductList[] {
      const productlist = this.productlist?.items

      if (!productlist) return []

      return productlist.map(({ name, imageUrl, quantity, price }) => ({
        name: name,
        image: imageUrl,
        quantity: quantity,
        price: BRLFormatter.format(price),
        finalPrice: BRLFormatter.format(price * quantity),
      }))
    },

    isPersonalDataValid (): boolean {
      return !this.isSubmitted || [
        this.customerMailValidation.valid,
        this.customerBirthdateValidation.valid,
        this.customerCPFValidation.valid,
        this.customerPhoneValidation.valid
      ].every(Boolean)
    },

    customerMailValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerMailElement,
        !this.hasVisitRegistry('customerMail') || regexTest(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, this.customerMail)
      )
    },

    customerBirthdateValidation (): ISingleValidateCheckout {
      const { customerBirthdate } = this

      return buildFieldValidation(
        this.customerBirthdateElement,
        !this.hasVisitRegistry('customerBirthdate') || regexTest(/^\d{2}\/\d{2}\/\d{4}$/, customerBirthdate) && isDateValid(customerBirthdate)
      )
    },

    customerCPFValidation (): ISingleValidateCheckout {
      const { customerCPF } = this

      return buildFieldValidation(
        this.customerCPFElement,
        !this.hasVisitRegistry('customerCPF') || regexTest(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, this.customerCPF) && isCPFValid(customerCPF)
      )
    },

    customerPhoneValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerPhoneElement,
        !this.hasVisitRegistry('customerPhone') || regexTest(/\(\d{2}\)\s\d{4,5}-\d{4}/, this.customerPhone)
      )
    },

    paymentMethodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(this.paymentMethodMessageElement, !isNull(this.selectedPayment))
    },

    customerCreditCardHolderValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardHolderElement,
        !this.hasVisitRegistry('customerCreditCardHolder') || /^(\w{2,})(\s+(\w+))+$/.test(normalizeText(trimText(this.customerCreditCardHolder).replace(/\s{2,}/g, ' '))),
        !this.isCreditCard
      )
    },

    customerCreditCardNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardNumberElement,
        !this.hasVisitRegistry('customerCreditCardNumber') || regexTest(/^(\d{4})(\s\d{4}){2}(\s\d{3,4})$/, trimText(this.customerCreditCardNumber)),
        !this.isCreditCard
      )
    },

    customerCreditCardDateValidation (): ISingleValidateCheckout {
      const { customerCreditCardDate } = this

      return buildFieldValidation(
        this.customerCreditCardDateElement,
        !this.hasVisitRegistry('customerCreditCardDate') || regexTest(/^(1[012]|0[1-9])\/\d{2}$/, customerCreditCardDate) && isExpireDateValid(customerCreditCardDate),
        !this.isCreditCard
      )
    },

    customerCreditCardCVVValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardCVVElement,
        !this.hasVisitRegistry('customerCreditCardCVV') || regexTest(/^\d{3}$/, this.customerCreditCardCVV),
        !this.isCreditCard
      )
    },

    isCreditCardGroupValid (): boolean {
      return [
        this.customerCreditCardHolderValidation.valid,
        this.customerCreditCardNumberValidation.valid,
        this.customerCreditCardDateValidation.valid,
        this.customerCreditCardCVVValidation.valid,
      ].every(Boolean)
    },

    billingCEPValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingCEPElement,
        !this.hasVisitRegistry('billingCEP') || regexTest(/^\d{5}-\d{3}$/, this.billingCEP),
        !this.isCreditCard
      )
    },

    billingAddressValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingAddressElement,
        !this.hasVisitRegistry('billingAddress') || objectSize(trimText(this.billingAddress)) > 2,
        !this.isCreditCard
      )
    },

    billingNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingNumberElement,
        !this.hasVisitRegistry('billingNumber') || objectSize(this.billingNumber) > 0,
        !this.isCreditCard
      )
    },

    billingNeighborhoodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingNeighborhoodElement,
        !this.hasVisitRegistry('billingNeighborhood') || objectSize(this.billingNeighborhood) > 0,
        !this.isCreditCard
      )
    },

    billingCityValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingCityElement,
        !this.hasVisitRegistry('billingCity') || objectSize(this.billingCity) > 2,
        !this.isCreditCard
      )
    },

    billingStateValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingStateElement,
        !this.hasVisitRegistry('billingState') || includes(statesAcronym, this.billingState),
        !this.isCreditCard
      )
    },

    isBillingAddressGroupValid (): boolean {
      return isNull(this.deliveryBillingAddressErrorMessage) && [
        this.billingCEPValidation,
        this.billingAddressValidation,
        this.billingNumberValidation,
        this.billingNeighborhoodValidation,
        this.billingCityValidation,
        this.billingStateValidation,
      ].every(validation => validation.valid)
    },

    deliveryPlaceValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.deliveryPlaceMessageElement,
        this.hasSelectedAddress && isNull(this.deliveryPlaceAddressErrorMessage),
        !this.isCreditCard
      )
    },

    shippingRecipientValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingRecipientElement,
        !this.hasVisitRegistry('shippingRecipient') || regexTest(/^(\w{2,})(\s+(\w+))+$/, normalizeText(trimText(this.shippingRecipient)).replace(/\s{2,}/g, ' ')),
        !this.shouldValidateShippingAddress
      )
    },

    shippingCEPValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingCEPElement,
        !this.hasVisitRegistry('shippingCEP') || regexTest(/^\d{5}-\d{3}$/, this.shippingCEP),
        !this.shouldValidateShippingAddress
      )
    },

    shippingAddressValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingAddressElement,
        !this.hasVisitRegistry('shippingAddress') || objectSize(trimText(this.shippingAddress)) > 2,
        !this.shouldValidateShippingAddress
      )
    },

    shippingNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingNumberElement,
        !this.hasVisitRegistry('shippingNumber') || objectSize(trimText(this.shippingNumber)) > 0,
        !this.shouldValidateShippingAddress
      )
    },

    shippingNeighborhoodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingNeighborhoodElement,
        !this.hasVisitRegistry('shippingNeighborhood') || objectSize(trimText(this.shippingNeighborhood)) > 3,
        !this.shouldValidateShippingAddress
      )
    },

    shippingCityValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingCityElement,
        !this.hasVisitRegistry('shippingCity') || objectSize(trimText(this.shippingCity)) > 2,
        !this.shouldValidateShippingAddress
      )
    },

    shippingStateValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingStateElement,
        !this.hasVisitRegistry('shippingState') || includes(statesAcronym, this.shippingState),
        !this.shouldValidateShippingAddress
      )
    },

    isShippingAddressGroupValid (): boolean {
      return isNull(this.deliveryShippingAddressErrorMessage) && [
        this.shippingCEPValidation,
        this.shippingAddressValidation,
        this.shippingNumberValidation,
        this.shippingNeighborhoodValidation,
        this.shippingCityValidation,
        this.shippingStateValidation,
      ].every(validation => validation.valid)
    },

    deliveryDatesGroupValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.deliveryDateMessageElement,
        !isNull(this.deliveryDate),
        !this.paymentMethodValidation.valid
      )
    },

    deliveryHoursGroupValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.deliveryHourMessageElement,
        !isNull(this.deliveryHour),
        !this.deliveryDatesGroupValidation.valid
      )
    },

    installmentGroupValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.installmentsMessageElement,
        !isNull(this.selectedInstallment),
        !this.isCreditCard || !this.paymentMethodValidation.valid
      )
    },

    notIgnoredFields (): ISingleValidateCheckout[] {
      return [
        this.customerMailValidation,
        this.customerBirthdateValidation,
        this.customerCPFValidation,
        this.customerPhoneValidation,
        this.paymentMethodValidation,
        this.customerCreditCardHolderValidation,
        this.customerCreditCardNumberValidation,
        this.customerCreditCardDateValidation,
        this.customerCreditCardCVVValidation,
        this.billingCEPValidation,
        this.billingAddressValidation,
        this.billingNumberValidation,
        this.billingNeighborhoodValidation,
        this.billingCityValidation,
        this.billingStateValidation,
        this.deliveryPlaceValidation,
        this.shippingRecipientValidation,
        this.shippingCEPValidation,
        this.shippingAddressValidation,
        this.shippingNumberValidation,
        this.shippingNeighborhoodValidation,
        this.shippingCityValidation,
        this.shippingStateValidation,
        this.deliveryDatesGroupValidation,
        this.deliveryHoursGroupValidation,
        this.installmentGroupValidation,
      ].filter(({ ignoreIf }) => includes([false, undefined], ignoreIf))
    },

    firstInvalidField (): Nullable<ISingleValidateCheckout> {
      return this.notIgnoredFields.find(({ valid }) => !valid) ?? NULL_VALUE
    },

    hasSelectedAddress (): boolean {
      return !isNull(this.deliveryPlace)
    },

    isSameAddress (): boolean {
      return this.deliveryPlace === DELIVERY_TYPE_SAME
    },

    isDiffAddress (): boolean {
      return this.deliveryPlace === DELIVERY_TYPE_DIFF
    },

    shouldValidateShippingAddress (): boolean {
      return this.isCreditCard
        ? this.showShippingAddressSelector && !this.isSameAddress
        : true
    },

    showShippingAddressSelector (): boolean {
      return !this.isCreditCard || (this.isCreditCard && this.hasSelectedAddress)
    },

    getParsedAddresses (): IParsedAddressContent {
      const parseState = (acronym: IStateAcronym) => statesMap?.[acronym] ?? EMPTY_STRING

      const parseComplement = (complement: string) => trimText(complement).replace(/-+/g, EMPTY_STRING) || 'N/A'

      const shippingaddress: IParsedAddress = {
        zipPostalCode: this.shippingCEP,
        street: this.shippingAddress,
        number: this.shippingNumber,
        complement: parseComplement(this.shippingComplement),
        neighbourhood: this.shippingNeighborhood,
        city: this.shippingCity,
        state: parseState(this.shippingState)
      }

      const billingaddress: IParsedAddress = {
        zipPostalCode: this.billingCEP,
        street: this.billingAddress,
        number: this.billingNumber,
        complement: parseComplement(this.billingComplement),
        neighbourhood: this.billingNeighborhood,
        city: this.billingCity,
        state: parseState(this.billingState)
      }

      if (this.isCreditCard) {
        return {
          billingaddress,
          shippingaddress: this.isSameAddress
            ? billingaddress
            : shippingaddress
        }
      }

      return {
        shippingaddress,
        billingaddress: shippingaddress,
      }
    },

    getParsedCustomer (): PostOrderCustomer {
      return {
        name: this.isCreditCard
          ? this.customerCreditCardHolder
          : this.shippingRecipient,
        cpf: this.customerCPF,
        email: this.customerMail,
        birthDate: this.customerBirthdate,
        phone: this.customerPhone,
      }
    },

    getParsedDeliveryData (): Omit<PostOrderDelivery, 'delivery_price'> {
      const {
        getSelectedHourDetails,
        getSelectedDateDetails,
      } = this

      return {
        delivery_hour: {
          value: this.deliveryHour as number,
          validator: getSelectedHourDetails?.validator as string,
          has_priority: getSelectedHourDetails?.has_priority as boolean,
        },
        delivery_date: {
          value: this.deliveryDate as number,
          validator: getSelectedDateDetails?.validator as string,
          has_priority: getSelectedDateDetails?.has_priority as boolean,
        },
      }
    },

    getOrderBaseData (): Omit<PostOrder, 'customer'> {
      return {
        user_id: NULL_VALUE,
        coupon_code: this.hasInvalidCoupon || this.hasNullCoupon
          ? NULL_VALUE
          // @ts-ignore
          : this.coupon?.code as string,
        delivery: {
          ...this.getParsedDeliveryData,
          delivery_price: this.deliveryPrice as Omit<PostOrderDeliveryGroup, 'has_priority'>,
        },
      }
    },

    showInstallmentSection (): boolean {
      return this.isCreditCard && objectSize(this.installment ?? []) > 0
    },

    getParsedInstallments (): InstallmentItem<BRLString>[] {
      const { installment } = this

      if (!installment) return []

      return installment.map(({ installments, installment_value }) => ({
        installments,
        installment_value: BRLFormatter.format(installment_value) as BRLString,
      }))
    },

    hasNullCoupon (): boolean {
      return isNull(this.coupon)
    },

    hasAppliedCoupon (): boolean {
      return hasOwn(this.coupon ?? {}, 'cupom_type')
    },

    hasInvalidCoupon (): boolean {
      return hasOwn(this.coupon ?? {}, ERROR_KEY)
    },

    isCouponCodeValid (): boolean {
      const { couponCode } = this

      return objectSize(trimText(couponCode)) > 4 && !regexTest(/[^A-Z\d]/, couponCode)
    },

    getCreditCardToken (): PagSeguroCardEncrypt {
      if (!this.isPagSeguroLoaded) {
        return {
          errors: [],
          hasErrors: false,
          encryptedCard: NULL_VALUE,
        }
      }

      const [
        month,
        year,
      ] = this.customerCreditCardDate.split(SLASH_STRING)

      return window.PagSeguro.encryptCard({
        expMonth: month,
        expYear: '20'.concat(year),
        holder: this.customerCreditCardHolder,
        securityCode: this.customerCreditCardCVV,
        number: numberOnly(this.customerCreditCardNumber),
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxPIKWT6ettkFKqSyfoUpH/550Q8YQtRf7ZYJJbV3U7/4HBtamJT9If4wiLs2YlEfwTPWlB5Cl0jGmkBSQkjIDF+QTOSJviZYKgiuR7Bnavgt+idkcZsd5hM1I6u1uwOJJE3wSSXg+Nw70GZCeg7A6bmq9tOu1827En/ZFKWBXqv9Upc7q/Y6N0XMzZ3CL1j6ZlhnCalQzzaV9whijxK22lIL78gLEUcnmEO7CUX6DyfcdlA13MM4X538k2eYUosdnKafCEDNVcT+PPUeUdJZ0CpBWA9c/XtO0BIbTXHTsDuDlX0r7BF0vMFJMi0D9lkFCavY/kjZEQYhnXMtrWlUWwIDAQAB',
      })
    },

    hasDeliveryDates (): boolean {
      const { deliveryOptions } = this

      return isArray(deliveryOptions?.dates) && objectSize(deliveryOptions?.dates as []) > 0
    },

    hasDeliveryHour (): boolean {
      return !isNull(this.deliveryDate) && objectSize(this.getParsedDeliveryHours) > 0
    },

    getParsedDeliveryHours (): ComputedDeliveryHours[] {
      if (!this.hasDeliveryDates || isNull(this.getSelectedDateDetails)) return []

      const hourList = (this.getSelectedDateDetails as CheckoutDeliveryOption).periods.hours

      return hourList.map(({ label, hour }) => ({
        hour,
        label,
      }))
    },

    quotationPayload (): false | (Omit<PostOrderDelivery, 'delivery_price'> & Pick<CheckoutDeliveryRequestBody, 'cep'>) {
      if ([this.deliveryDate, this.deliveryHour].some(v => isNull(v))) return false

      const shippingCEP = this.getParsedAddresses.shippingaddress.zipPostalCode

      if (!/^\d{5}\-\d{3}$/.test(shippingCEP)) return false

      const {
        delivery_hour,
        delivery_date,
      } = this.getParsedDeliveryData

      return {
        cep: shippingCEP,
        delivery_hour,
        delivery_date,
      }
    },

    getParsedDeliveryDates (): ComputedDeliveryDates[] {
      if (isNull(this.deliveryOptions)) return []

      const selectedDate = this.deliveryDate

      return (this.deliveryOptions as CheckoutDeliveryResponse).dates.map(({ label, shift_days }) => ({
        label,
        shift_days,
        selected: selectedDate === shift_days,
      }))
    },

    getSelectedDateDetails (): Nullable<CheckoutDeliveryOption> {
      if (!this.deliveryDate === NULL_VALUE) return NULL_VALUE

      const selectedDate = this.deliveryOptions?.dates.find(({ shift_days }) => shift_days === this.deliveryDate)

      if (!selectedDate) return NULL_VALUE

      return selectedDate
    },

    getSelectedHourDetails (): Nullable<CheckoutDeliveryHour> {
      if (!this.getSelectedDateDetails || !this.deliveryHour) return NULL_VALUE

      return this.getSelectedDateDetails.periods.hours.find(({ hour }) => hour === this.deliveryHour) ?? NULL_VALUE
    },

    hasPriorityFee (): boolean {
      if (!this.hasDeliveryHour || !this.getSelectedDateDetails || !this.getSelectedHourDetails) return false

      return this.getSelectedDateDetails.has_priority && this.getSelectedHourDetails.has_priority
    },

    priorityFee (): number {
      return this.hasPriorityFee
        ? this.deliveryOptions?.priority_fee as number
        : 0
    },

    priorityFeeFormatted (): string {
      return BRLFormatter.format(this.priorityFee)
    },

    hasSubsidy (): boolean {
      return this.subsidy?.has === true && this.getShippingPrice > 0
    },

    subsidyDiscountPrice (): number {
      return this.subsidy?.has === true
        ? Math.min(this.subsidy.value, this.getShippingPrice) * -1
        : 0
    },

    subsidyDiscountPriceFormatted (): string {
      return BRLFormatter.format(this.subsidyDiscountPrice)
    },

    hasFreeShippingByCartPrice (): boolean {
      return this.getOrderSubtotal >= FREE_SHIPPING_MIN_CART_PRICE
    },

    creditCardAdditionalInfo (): CreditCardPostAdditional {
      const {
        installment,
        isSameAddress,
        getCreditCardToken,
        selectedInstallment,
        customerCreditCardHolder,
      } = this

      return {
        is_same_address: isSameAddress,
        credit_card_info: {
          holderName: customerCreditCardHolder,
          creditCardToken: getCreditCardToken.encryptedCard ?? EMPTY_STRING,
          numberOfPayments: selectedInstallment as number,
          installmentValue: installment
            ?.find(({ installments }) => installments === selectedInstallment)
            ?.installment_value ?? 0
        }
      }
    },
  },

  watch: {
    billingCEP (cep: string, oldCep: string): void {
      this.captureAddress(BILLING_NAME_TOKEN, cep, oldCep).then(succeeded => {
        if (!succeeded) return

        this.deliveryPlaceAddressErrorMessage = NULL_VALUE

        if (this.deliveryPlace === DELIVERY_TYPE_SAME) {
          this.deliveryPlace = NULL_VALUE
        }
      })
    },

    shippingCEP (cep: string, oldCep?: string): void {
      this.deliveryDate = NULL_VALUE
      this.deliveryHour = NULL_VALUE

      this.captureAddress(SHIPPING_NAME_TOKEN, cep, oldCep)
    },

    getOrderPrice: {
      immediate: true,
      handler: function (): void {
        this.refreshInstallments()
      }
    },

    getCreditCardToken (payload: PagSeguroCardEncrypt) {
      if (payload.hasErrors) return

      this.refreshInstallments()
    },

    quotationPayload (payload: false | (Omit<PostOrderDelivery, 'delivery_price'> & Pick<CheckoutDeliveryRequestBody, 'cep'>), oldPayload: false | (Omit<PostOrderDelivery, 'delivery_price'> & Pick<CheckoutDeliveryRequestBody, 'cep'>), cleanup: OnCleanup): void {
      if (!payload) return

      const {
        cep,
        delivery_hour,
        delivery_date,
      } = payload

      if (!/^\d{5}\-\d{3}$/.test(cep)) return

      const controller = getAbortController()

      if (!oldPayload) {
        this.handleDeliveryQuotation(controller)

        return cleanup(() => controller.abort())
      }

      const {
        cep: oldCep,
        delivery_date: oldDeliveryDate,
        delivery_hour: oldDeliveryHour,
      } = oldPayload

      this.handleDeliveryQuotation(controller)

      return cleanup(() => controller.abort())
    },

    getParsedAddresses (currentAddresses: IParsedAddressContent, oldAddresses: IParsedAddressContent): void {
      if (!currentAddresses || !oldAddresses) return

      if (currentAddresses.shippingaddress.zipPostalCode === oldAddresses.shippingaddress.zipPostalCode) return

      if (!/^\d{5}\-\d{3}$/.test(currentAddresses.shippingaddress.zipPostalCode)) return

      if (this.isCreditCard && isNull(this.deliveryPlace)) return

      this.handleSubsidy()
    }
  },

  directives: {
    maskDate: buildMaskDirective(numberOnly, maskDate),

    maskCpf: buildMaskDirective(numberOnly, maskCPFNumber),

    maskPhone: buildMaskDirective(numberOnly, maskPhoneNumber),

    maskCreditCard: buildMaskDirective(numberOnly, maskCardNumber),

    maskCreditCardDate: buildMaskDirective(numberOnly, maskCardDate),

    maskNumberOnly: buildMaskDirective(numberOnly),

    maskCep: buildMaskDirective(numberOnly, maskCEP),

    upperCase: buildMaskDirective(toUpperCase),

    normalize: buildMaskDirective(normalizeText),

    visitedField: {
      mounted (el: HTMLInputElement, { value, instance }: DirectiveBinding<string>) {
        const remover = attachEvent(el, 'blur', () => {
          instance.setVisitedField(value)

          eventMap.delete(el)
        }, { once: true })

        eventMap.set(el, remover)
      },

      unmounted: cleanupDirective,
    },
  },
} satisfies ({
  name: string;
  created: () => void;
  data: () => TalhoCheckoutAppData;
  setup: () => TalhoCheckoutAppSetup;
  methods: TalhoCheckoutAppMethods;
  computed: TalhoCheckoutAppComputedDefinition;
  watch: TalhoCheckoutAppWatch;
  directives: Record<string, ObjectDirective>;
} & ThisType<TalhoCheckoutContext>))

TalhoCheckoutApp.mount('#fechamentodopedido')
