
import {
  type BRLString,
  type CartResponse,
  type ComputedDeliveryHours,
  type FunctionSucceededPattern,
  type GetCouponRequestBody,
  type GetInstallmentsBody,
  type IAddressType,
  type InstallmentItem,
  type IOrderAddressType,
  type IParsedAddress,
  type IParsedAddressContent,
  type ISingleOrderCoupon,
  type ISingleOrderCouponError,
  type ISinglePaymentKey,
  type ISingleValidateCheckout,
  type IStateAcronym,
  type Nullable,
  type PagSeguroCardEncrypt,
  type ParsedProductList,
  type PostOrder,
  type PostOrderCustomer,
  type ResponsePattern,
  type TalhoCheckoutAppComputedDefinition,
  type TalhoCheckoutAppData,
  type TalhoCheckoutAppMethods,
  type TalhoCheckoutAppSetup,
  type TalhoCheckoutAppWatch,
  type TalhoCheckoutContext,
  type VIACEPFromXano,
  type OnCleanup,
  type SubsidyResponse,
  type PostOrderDelivery,
  type PostOrderDeliveryGroup,
  type CreditCardPostAdditional,
  type PaymentResponseMap,
  type UserPartialCheckout,
  type UserAddressCheckout,
} from '../global'

import {
  type Ref,
  type ObjectDirective,
  type DirectiveBinding,
} from 'vue'

import {
  type SearchAddressCheckout,
  type CheckoutDeliveryRequestBody,
  type CheckoutDeliveryPriceResponse,
  type CheckoutDeliveryOption,
  type ComputedDeliveryDates,
  type CheckoutDeliveryResponse,
  type CheckoutDeliveryHour,
} from '../types/checkout'

import {
  AbandonmentFields,
  AbandonmentFieldsNames,
  type CartAbandonmentParams,
} from '../types/abandonment'

const {
  ref,
  createApp,
} = Vue

import {
  eventMap,
  BLUR_EVENT,
  NULL_VALUE,
  SLASH_STRING,
  EMPTY_STRING,
  XANO_BASE_URL,
  FREE_SHIPPING_MIN_CART_PRICE,
  BRLFormatter,
  statesMap,
  statesAcronym,
  STORAGE_KEY_NAME,
  pushIf,
  regexTest,
  cleanupDirective,
  buildMaskDirective,
  maskDate,
  maskCPFNumber,
  maskPhoneNumber,
  maskCEP,
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
  toUpperCase,
  includes,
  isCPFValid,
  isDateValid,
  splitText,
  trim,
  EMAIL_REGEX_VALIDATION,
  DATE_REGEX_VALIDATION,
  CPF_REGEX_VALIDATION,
  PHONE_REGEX_VALIDATION,
  FULLNAME_REGEX_VALIDATION,
  CEP_REGEX_VALIDATION,
  replaceDuplicatedSpaces,
} from '../utils'

const ERROR_KEY = 'error'

const SHIPPING_NAME_TOKEN = 'shipping'
const BILLING_NAME_TOKEN = 'billing'

const CEP_LENGTH = 8

const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`
const PAYMENT_BASE_URL = `${XANO_BASE_URL}/api:5lp3Lw8X`
const DELIVERY_BASE_URL = `${XANO_BASE_URL}/api:24B7O9Aj`

const ERROR_CODE_NOT_FOUND = 'ERROR_CODE_NOT_FOUND'
const ERROR_CODE_BAD_REQUEST = 'ERROR_CODE_BAD_REQUEST'

const CEP_MESSAGES: Record<string, string> = {
  [ERROR_CODE_NOT_FOUND]: 'O CEP indicado não foi localizado.',
  [ERROR_CODE_BAD_REQUEST]: 'Não realizamos entregas na sua região.',
}

const PAGSEGURO_PUBLIC_KEY = document.currentScript?.getAttribute('data-public-key')

if (!PAGSEGURO_PUBLIC_KEY) {
  console.warn('[Checkout] public key must be provided as a parameter to this file')
}

const MIN_AVAILABLE_INSTALLMENT_COUNT = 1
const MAX_AVAILABLE_INSTALLMENT_COUNT = 2

const DELIVERY_TYPE_SAME = 'same'
const DELIVERY_TYPE_DIFF = 'diff'

const PIX_PAYMENT = 'pix'
const CREDIT_CARD_PAYMENT = 'creditcard'

// const ALLOWED_PAYMENT_METHODS = [
//   PIX_PAYMENT,
//   CREDIT_CARD_PAYMENT,
// ]

function getAbortController () {
  return new AbortController()
}

function hasOwn (object: object, key: PropertyKey): boolean {
  return Object.hasOwn(object, key)
}

function scrollIntoView (element: HTMLElement, args: boolean | ScrollIntoViewOptions) {
  element.scrollIntoView(args)
}

function isExpireDateValid (expireDate: string): boolean {
  const tokens = splitText(expireDate, SLASH_STRING)

  if (objectSize(tokens) !== 2) return false

  const [monthStr, yearStr] = tokens

  const month = parseInt(monthStr, 10)
  const shortYear = parseInt(yearStr, 10)

  if (isNaN(month) || isNaN(shortYear) || month < 1 || month > 12) return false

  const currentDate = new Date()
  const fullYear = 2000 + (shortYear < 100 ? shortYear : 0)

  const expireDateTime = new Date(fullYear, month, 0, 23, 59, 59)

  return expireDateTime > currentDate
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

async function searchAddress ({ cep, deliveryMode }: SearchAddressCheckout): Promise<ResponsePattern<VIACEPFromXano>> {
  const defaultErrorMessage = 'Não foi possível encontrar o endereço'

  cep = numberOnly(cep)

  if (objectSize(cep) !== CEP_LENGTH) return postErrorResponse(defaultErrorMessage)

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}/checkout`, {
      ...buildRequestOptions([], 'POST'),
      body: stringify<Pick<SearchAddressCheckout, 'deliveryMode'>>({
        deliveryMode,
      })
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.code ?? defaultErrorMessage)
    }

    const address: VIACEPFromXano = await response.json()

    return postSuccessResponse.call(response, address) as FunctionSucceededPattern<VIACEPFromXano>
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
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
      user: NULL_VALUE,
      errorMessage: NULL_VALUE,
      hasPendingPayment: false,
      isSubmitted: false,
      productlist: NULL_VALUE,
      visitedFields: [],
      selectedPayment: NULL_VALUE,
      availablePayments: [
        {
          label: 'Cartão de crédito',
          method: CREDIT_CARD_PAYMENT,
        },
        {
          label: 'PIX',
          method: PIX_PAYMENT,
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

      selectedBillingAddressId: NULL_VALUE,
      selectedShippingAddressId: NULL_VALUE,
    }
  },

  created (): void {
    Promise.allSettled([
      this.getLoggedInUser().then(response => {
        if (!response.succeeded) return

        this.user = response.data
      }),
      this.refreshCart().then(() => isPageLoading(false))
    ])

    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY_NAME) return

      this.refreshCart()
    })
  },

  methods: {
    setPreviousAddress (addressId: number, addressType: IOrderAddressType): void {
      const selectedAddress = this.user?.address_list.find(address => address.id === addressId)

      if (!selectedAddress) return

      const {
        id,
        cep,
        address,
        number,
        city,
        complement,
        state,
        neighborhood,
      } = selectedAddress

      this[`${addressType}CEP`] = cep
      this[`${addressType}Address`] = address
      this[`${addressType}Number`] = number
      this[`${addressType}Complement`] = complement
      this[`${addressType}City`] = city
      this[`${addressType}State`] = state
      this[`${addressType}Neighborhood`] = neighborhood

      if (addressType === SHIPPING_NAME_TOKEN) {
        this.selectedShippingAddressId = id

        return
      }

      if (addressType === BILLING_NAME_TOKEN) {
        this.selectedBillingAddressId = id
      }
    },

    async getLoggedInUser (): Promise<ResponsePattern<UserPartialCheckout>> {
      const defaultErrorMessage = 'Falha na captura do usuário'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/checkout`, {
          ...buildRequestOptions([]),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage, true)
        }

        const user: UserPartialCheckout = await response.json()

        return postSuccessResponse.call(response, user)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async getCart (): Promise<ResponsePattern<CartResponse>> {
      const defaultErrorMessage = 'Falha ao capturar os produtos'

      try {
        const response = await fetch(`${CART_BASE_URL}/cart/get`, {
          ...buildRequestOptions([]),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: CartResponse = await response.json()

        return postSuccessResponse.call(response, data) as FunctionSucceededPattern<CartResponse>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async refreshCart (): Promise<void> {
      if (this.hasPendingPayment) return

      return this.getCart()
        .then(cartData => {
          if (!cartData.succeeded) return

          if (objectSize(cartData.data.items) === 0) {
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

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call(response, data) as FunctionSucceededPattern<InstallmentItem[]>
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
        this.errorMessage = response.message

        this.hasPendingPayment = !isPageLoading(false)

        return
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

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call(response, data) as FunctionSucceededPattern<PaymentResponseMap[T]>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    triggerValidations (): void {
      const notIgnoredFields: ISingleValidateCheckout<Nullable<HTMLElement>>[] = this.notIgnoredFields

      for (const { field } of notIgnoredFields) {
        field?.dispatchEvent(BLUR_EVENT)
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

      if (deliveryPlace === DELIVERY_TYPE_SAME && regexTest(/^\d{5}\-\d{3}$/, this.billingCEP) && this.isBillingAddressGroupValid) {
        searchAddress({
          cep: this.billingCEP,
          deliveryMode: true
        }).then(address => {
          if (address.succeeded) return

          this.deliveryPlaceAddressErrorMessage = CEP_MESSAGES?.[address.message] ?? address.message
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
        const { message } = address

        this[fieldKey] = EMPTY_STRING

        this.setVisitedField(fieldKey)

        // if (addressType === SHIPPING_NAME_TOKEN) {
        //   this.deliveryShippingAddressErrorMessage = address.message
        // }

        this.deliveryShippingAddressErrorMessage = addressType === SHIPPING_NAME_TOKEN && message !== ERROR_CODE_NOT_FOUND
          ? (CEP_MESSAGES?.[message] ?? CEP_MESSAGES[ERROR_CODE_BAD_REQUEST])
          : NULL_VALUE

        // if (addressType === BILLING_NAME_TOKEN) {
        //   this.deliveryBillingAddressErrorMessage = address.message
        // }
        this.deliveryBillingAddressErrorMessage = addressType === BILLING_NAME_TOKEN && message !== ERROR_CODE_NOT_FOUND
          ? (CEP_MESSAGES?.[message] ?? CEP_MESSAGES[ERROR_CODE_BAD_REQUEST])
          : NULL_VALUE

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
            cpf: trim(this.customerCPF),
            has_subsidy: this.subsidy?.has ?? false,
            delivery_cep: this.getParsedAddresses.shippingaddress.zipPostalCode,
            has_selected_delivery: !isNull(this.deliveryHour) && !isNull(this.deliveryDate)
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call(response, data)
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

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: CheckoutDeliveryResponse = await response.json()

        return postSuccessResponse.call(response, data) as FunctionSucceededPattern<CheckoutDeliveryResponse>
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

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: CheckoutDeliveryPriceResponse = await response.json()

        return postSuccessResponse.call(response, data) as FunctionSucceededPattern<CheckoutDeliveryPriceResponse>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async handleSubsidy (): Promise<void> {
      const shippingCEP = this.getParsedAddresses.shippingaddress.zipPostalCode

      if (!regexTest(/^\d{5}\-\d{3}$/, shippingCEP)) return

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

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: SubsidyResponse = await response.json()

        return postSuccessResponse.call(response, data) as FunctionSucceededPattern<SubsidyResponse>
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async createAbandonmentCart (payload: CartAbandonmentParams): Promise<ResponsePattern<void>> {
      const defaultErrorMessage = 'Houve uma ao gerar o carrinho'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:EuHZTAGr/abandonment/post`, {
          ...buildRequestOptions([], 'POST'),
          keepalive: true,
          priority: 'high',
          body: stringify<CartAbandonmentParams>(payload),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call(response, data)
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
      ]

      pushIf(this.hasPIXDiscount, finalPrice, this.PIXDiscountPrice)

      return decimalRound(
        finalPrice.reduce((accPrice, price) => accPrice + price, 0),
        2
      )
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
        imageStyle: `background-image: url('${imageUrl}')`,
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
        !this.hasVisitRegistry('customerMail') || regexTest(EMAIL_REGEX_VALIDATION, this.customerMail)
      )
    },

    customerBirthdateValidation (): ISingleValidateCheckout {
      const { customerBirthdate } = this

      return buildFieldValidation(
        this.customerBirthdateElement,
        !this.hasVisitRegistry('customerBirthdate') || regexTest(DATE_REGEX_VALIDATION, customerBirthdate) && isDateValid(customerBirthdate)
      )
    },

    customerCPFValidation (): ISingleValidateCheckout {
      const { customerCPF } = this

      return buildFieldValidation(
        this.customerCPFElement,
        !this.hasVisitRegistry('customerCPF') || regexTest(CPF_REGEX_VALIDATION, this.customerCPF) && isCPFValid(customerCPF)
      )
    },

    customerPhoneValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerPhoneElement,
        !this.hasVisitRegistry('customerPhone') || regexTest(PHONE_REGEX_VALIDATION, this.customerPhone)
      )
    },

    paymentMethodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(this.paymentMethodMessageElement, !isNull(this.selectedPayment))
    },

    customerCreditCardHolderValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardHolderElement,
        !this.hasVisitRegistry('customerCreditCardHolder') || regexTest(FULLNAME_REGEX_VALIDATION, replaceDuplicatedSpaces(normalizeText(trim(this.customerCreditCardHolder)))),
        !this.isCreditCard
      )
    },

    customerCreditCardNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardNumberElement,
        !this.hasVisitRegistry('customerCreditCardNumber') || regexTest(/^(\d{4})(\s\d{4}){2}(\s\d{3,4})$/, trim(this.customerCreditCardNumber)),
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
        !this.hasVisitRegistry('customerCreditCardCVV') || regexTest(/^\d{3,4}$/, this.customerCreditCardCVV),
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
        !this.hasVisitRegistry('billingCEP') || regexTest(CEP_REGEX_VALIDATION, this.billingCEP),
        !this.isCreditCard
      )
    },

    billingAddressValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingAddressElement,
        !this.hasVisitRegistry('billingAddress') || objectSize(trim(this.billingAddress)) > 2,
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
        !this.hasVisitRegistry('shippingRecipient') || regexTest(/^(\w{2,})(\s+(\w+))+$/, replaceDuplicatedSpaces(normalizeText(trim(this.shippingRecipient)))),
        !this.shouldValidateShippingAddress
      )
    },

    shippingCEPValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingCEPElement,
        !this.hasVisitRegistry('shippingCEP') || regexTest(CEP_REGEX_VALIDATION, this.shippingCEP),
        !this.shouldValidateShippingAddress
      )
    },

    shippingAddressValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingAddressElement,
        !this.hasVisitRegistry('shippingAddress') || objectSize(trim(this.shippingAddress)) > 2,
        !this.shouldValidateShippingAddress
      )
    },

    shippingNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingNumberElement,
        !this.hasVisitRegistry('shippingNumber') || objectSize(trim(this.shippingNumber)) > 0,
        !this.shouldValidateShippingAddress
      )
    },

    shippingNeighborhoodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingNeighborhoodElement,
        !this.hasVisitRegistry('shippingNeighborhood') || objectSize(trim(this.shippingNeighborhood)) > 3,
        !this.shouldValidateShippingAddress
      )
    },

    shippingCityValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingCityElement,
        !this.hasVisitRegistry('shippingCity') || objectSize(trim(this.shippingCity)) > 2,
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

      const parseComplement = (complement: string) => trim(complement).replace(/-+/g, EMPTY_STRING) || 'N/A'

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

      return objectSize(trim(couponCode)) > 4 && !regexTest(/[^A-Z\d]/, couponCode)
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
      ] = splitText(this.customerCreditCardDate, SLASH_STRING)

      return window.PagSeguro.encryptCard({
        expMonth: month,
        expYear: '20'.concat(year),
        holder: this.customerCreditCardHolder,
        securityCode: this.customerCreditCardCVV,
        number: numberOnly(this.customerCreditCardNumber),
        publicKey: PAGSEGURO_PUBLIC_KEY as string,
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

      if (!regexTest(/^\d{5}\-\d{3}$/, shippingCEP)) return false

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

    hasPIXDiscount (): boolean {
      return this.selectedPayment === PIX_PAYMENT && (this.deliveryOptions?.pix_discount ?? 0) > 0
    },

    PIXDiscountPrice (): number {
      if (!this.hasPIXDiscount) return 0

      const discountPIX = this.deliveryOptions?.pix_discount ?? 0

      return decimalRound(discountPIX / 100 * -this.getOrderSubtotal, 2)
    },

    PIXDiscountPriceFormatted (): string {
      return BRLFormatter.format(this.PIXDiscountPrice)
    },

    userAddresses (): UserAddressCheckout[] {
      const user = this.user

      if (!user || objectSize(user.address_list) === 0) return []

      return user.address_list.map(({ address, number, cep, ...rest }) => ({
        ...rest,
        address,
        number,
        cep,
        complete: `${address}, ${number} ${cep}`
      }))
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

      if (!regexTest(/^\d{5}\-\d{3}$/, cep)) return

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

      if (!regexTest(/^\d{5}\-\d{3}$/, currentAddresses.shippingaddress.zipPostalCode)) return

      if (this.isCreditCard && isNull(this.deliveryPlace)) return

      this.handleSubsidy()
    },

    user (user: Nullable<UserPartialCheckout>): void {
      if (!user) return

      this.customerPhone     = user.telephone ?? ''
      this.customerCPF       = user.cpf ?? ''
      this.customerBirthdate = user.birthday
        ?.split('-')
        .reverse()
        .join('/') ?? ''
      this.customerMail      = user.email ?? ''
    },
  },

  directives: {
    // v-trim
    trim: buildMaskDirective(trim),

    // v-remove-duplicated-spaces
    removeDuplicatedSpaces: buildMaskDirective(replaceDuplicatedSpaces),

    // v-mask-date
    maskDate: buildMaskDirective(numberOnly, maskDate),

    // v-mask-cpf
    maskCpf: buildMaskDirective(numberOnly, maskCPFNumber),

    // v-mask-phone
    maskPhone: buildMaskDirective(numberOnly, maskPhoneNumber),

    // v-mask-credit-card
    maskCreditCard: buildMaskDirective(numberOnly, maskCardNumber),

    // v-mask-credit-card-date
    maskCreditCardDate: buildMaskDirective(numberOnly, maskCardDate),

    // v-mask-number-only
    maskNumberOnly: buildMaskDirective(numberOnly),

    // v-mask-cep
    maskCep: buildMaskDirective(numberOnly, maskCEP),

    // v-uppercase
    upperCase: buildMaskDirective(toUpperCase),

    // v-normalize
    normalize: buildMaskDirective(normalizeText),

    // v-visited-field
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

    // v-capture-abandonment
    captureAbandonment: {
      mounted (el: HTMLInputElement, binding: DirectiveBinding<null, string, AbandonmentFieldsNames>) {
        eventMap.set(
          el,
          attachEvent(el, 'change', (event: InputEvent) => {
            if (!event.isTrusted || !binding.arg) return

            const field = binding.arg as AbandonmentFieldsNames

            const validators: Record<AbandonmentFieldsNames, RegExp | (() => RegExp)> = ({
              [AbandonmentFields.EMAIL]: EMAIL_REGEX_VALIDATION,
              [AbandonmentFields.PHONE]: PHONE_REGEX_VALIDATION,
              [AbandonmentFields.USERNAME]: FULLNAME_REGEX_VALIDATION,
              [AbandonmentFields.SHIPPING_CEP]: CEP_REGEX_VALIDATION,
              [AbandonmentFields.BILLING_CEP]: CEP_REGEX_VALIDATION,
            })

            const trimmedValue = trim(el.value)

            const regexValidator = validators?.[field] ?? null
            const selectedValue = field === AbandonmentFields.EMAIL
              ? replaceDuplicatedSpaces(normalizeText(trimmedValue))
              : trimmedValue

            if (!regexValidator || !regexTest(regexValidator, selectedValue)) return

            const instance = binding.instance as TalhoCheckoutContext

            instance.createAbandonmentCart({
              field,
              value: trimmedValue,
            })
          })
        )
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

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
