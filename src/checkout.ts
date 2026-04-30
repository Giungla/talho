
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
  type TalhoCheckoutAppData,
  type TalhoCheckoutAppSetup,
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
  type ResponsePatternCallback,
  type FunctionErrorPattern,
  type QuotationPayloadReturns,
} from '../global'

import {
  type SearchAddressCheckout,
  type CheckoutDeliveryPriceResponse,
  type CheckoutDeliveryOption,
  type ComputedDeliveryDates,
  type CheckoutDeliveryResponse,
  type CheckoutDeliveryHour,
} from '../types/checkout'

import {
  AbandonmentFields,
  type CartAbandonmentParams,
  type AbandonmentFieldsNames,
} from '../types/abandonment'

const parseState = (acronym: string) => statesMap?.[acronym as IStateAcronym] ?? EMPTY_STRING

const parseComplement = (complement: string) => trim(complement).replace(/-+/g, EMPTY_STRING) || 'N/A'

import {
  statesMap,
  statesAcronym,
  DASH_STRING,
  SLASH_STRING,
  EMPTY_STRING,
  XANO_BASE_URL,
  STORAGE_KEY_NAME,
  SUBSIDY_MIN_CART_PRICE,
  FREE_SHIPPING_MIN_CART_PRICE,
} from '../utils/consts'

import {
  pushIf,
  includes,
} from '../utils/array'

import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  clamp,
  decimalRound,
} from '../utils/math'

import {
  isCPFValid,
  isDateValid,
  isExpireDateValid,
} from '../utils/validation'

import {
  eventMap,
  cleanupDirective,
  buildMaskDirective,
} from '../utils/vue'

import {
  NULL_VALUE,
  SCROLL_INTO_VIEW_DEFAULT_ARGS,
  CEP_REGEX_VALIDATION,
  CPF_REGEX_VALIDATION,
  DATE_REGEX_VALIDATION,
  EMAIL_REGEX_VALIDATION,
  PHONE_REGEX_VALIDATION,
  FULLNAME_REGEX_VALIDATION,
  trim,
  isNull,
  isArray,
  buildURL,
  regexTest,
  splitText,
  stringify,
  numberOnly,
  objectSize,
  attachEvent,
  isPageLoading,
  normalizeText,
  scrollIntoView,
  replaceDuplicatedSpaces,
  isInputInstance,
  focusInput,
} from '../utils/dom'

import {
  BLUR_EVENT,
} from '../utils/events'

import {
  maskCEP,
  maskDate,
  toUpperCase,
  BRLFormatter,
  maskCardDate,
  maskCPFNumber,
  maskPhoneNumber,
  maskCardNumber,
} from '../utils/mask'

import {
  EnumHttpMethods,
} from '../types/http'

import {
  getTrackingCookies,
  clearTrackingCookies,
  getMetaTrackingCookies,
} from '../utils/adTracking'

import {
  recoverFields,
  storeSingleField,
  clearStoredFields,
} from '../utils/registerUserInfo'

import {
  type DirectiveBinding,
  ref,
  nextTick,
  createApp,
  defineComponent,
} from 'vue'

import {
  initiateCheckoutTracking,
} from '../utils/tracking'

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

function buildFieldValidation (
  field: Nullable<HTMLElement>,
  valid: boolean,
  ignoreIf?: boolean,
): ISingleValidateCheckout {
  return {
    field,
    valid,
    ...(ignoreIf && ({ ignoreIf })),
  }
}

async function searchAddress <T extends VIACEPFromXano> ({ cep, deliveryMode }: SearchAddressCheckout): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível encontrar o endereço'

  cep = numberOnly(cep)

  if (objectSize(cep) !== CEP_LENGTH) return postErrorResponse(defaultErrorMessage)

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}/checkout`, {
      ...buildRequestOptions([], EnumHttpMethods.POST),
      body: stringify<Omit<SearchAddressCheckout, 'cep'>>({
        deliveryMode,
      }),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.code ?? defaultErrorMessage)
    }

    const address: T = await response.json()

    return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, address)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

const TalhoCheckoutApp = defineComponent({
  name: 'TalhoCheckoutApp',

  setup (): TalhoCheckoutAppSetup {
    return {
      customerCPF: ref<string>(EMPTY_STRING),
      customerMail: ref<string>(EMPTY_STRING),
      customerPhone: ref<string>(EMPTY_STRING),
      customerBirthdate: ref<string>(EMPTY_STRING),

      customerCreditCardCVV: ref<string>(EMPTY_STRING),
      customerCreditCardDate: ref<string>(EMPTY_STRING),
      customerCreditCardNumber: ref<string>(EMPTY_STRING),
      customerCreditCardHolder: ref<string>(EMPTY_STRING),

      billingCEP: ref<string>(EMPTY_STRING),
      billingAddress: ref<string>(EMPTY_STRING),
      billingNumber: ref<string>(EMPTY_STRING),
      billingComplement: ref<string>(EMPTY_STRING),
      billingNeighborhood: ref<string>(EMPTY_STRING),
      billingCity: ref<string>(EMPTY_STRING),
      billingState: ref<string>(EMPTY_STRING),

      shippingRecipient: ref<string>(EMPTY_STRING),
      shippingCEP: ref<string>(EMPTY_STRING),
      shippingAddress: ref<string>(EMPTY_STRING),
      shippingNumber: ref<string>(EMPTY_STRING),
      shippingComplement: ref<string>(EMPTY_STRING),
      shippingNeighborhood: ref<string>(EMPTY_STRING),
      shippingCity: ref<string>(EMPTY_STRING),
      shippingState: ref<string>(EMPTY_STRING),

      couponCode: ref<string>(EMPTY_STRING),

      customerMailElement: ref<HTMLInputElement | null>(NULL_VALUE),
      customerCPFElement: ref<HTMLInputElement | null>(NULL_VALUE),
      customerPhoneElement: ref<HTMLInputElement | null>(NULL_VALUE),
      customerBirthdateElement: ref<HTMLInputElement | null>(NULL_VALUE),

      paymentMethodMessageElement: ref<HTMLInputElement | null>(NULL_VALUE),

      customerCreditCardCVVElement: ref<HTMLInputElement | null>(NULL_VALUE),
      customerCreditCardDateElement: ref<HTMLInputElement | null>(NULL_VALUE),
      customerCreditCardNumberElement: ref<HTMLInputElement | null>(NULL_VALUE),
      customerCreditCardHolderElement: ref<HTMLInputElement | null>(NULL_VALUE),

      billingCEPElement: ref<HTMLInputElement | null>(NULL_VALUE),
      billingAddressElement: ref<HTMLInputElement | null>(NULL_VALUE),
      billingNumberElement: ref<HTMLInputElement | null>(NULL_VALUE),
      billingNeighborhoodElement: ref<HTMLInputElement | null>(NULL_VALUE),
      billingCityElement: ref<HTMLInputElement | null>(NULL_VALUE),
      billingStateElement: ref<HTMLInputElement | null>(NULL_VALUE),

      deliveryPlaceMessageElement: ref<HTMLElement | null>(NULL_VALUE),

      shippingRecipientElement: ref<HTMLInputElement | null>(NULL_VALUE),
      shippingCEPElement: ref<HTMLInputElement | null>(NULL_VALUE),
      shippingAddressElement: ref<HTMLInputElement | null>(NULL_VALUE),
      shippingNumberElement: ref<HTMLInputElement | null>(NULL_VALUE),
      shippingNeighborhoodElement: ref<HTMLInputElement | null>(NULL_VALUE),
      shippingCityElement: ref<HTMLInputElement | null>(NULL_VALUE),
      shippingStateElement: ref<HTMLInputElement | null>(NULL_VALUE),

      deliveryDateMessageElement: ref<HTMLElement | null>(NULL_VALUE),

      deliveryHourMessageElement: ref<HTMLElement | null>(NULL_VALUE),

      installmentsMessageElement: ref<HTMLElement | null>(NULL_VALUE),

      couponCodeElement: ref<HTMLInputElement | null>(NULL_VALUE),

      deliveryPlaceAddressErrorMessage: ref<Nullable<string>>(NULL_VALUE),

      deliveryBillingAddressErrorMessage: ref<Nullable<string>>(NULL_VALUE),

      deliveryShippingAddressErrorMessage: ref<Nullable<string>>(NULL_VALUE),
    }
  },

  data (): TalhoCheckoutAppData {
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
          label: 'Mesmo endereço de cobrança do cartão',
        },
        {
          token: DELIVERY_TYPE_DIFF,
          label: 'Entregar em um endereço diferente',
        }
      ],
      installment: NULL_VALUE,
      selectedInstallment: NULL_VALUE,
      installmentMessage: NULL_VALUE,
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
    const recoveredFields = recoverFields()

    this.shippingCEP          = recoveredFields?.shipping_cep ?? EMPTY_STRING
    this.shippingAddress      = recoveredFields?.shipping_address ?? EMPTY_STRING
    this.shippingNumber       = recoveredFields?.shipping_number ?? EMPTY_STRING
    this.shippingComplement   = recoveredFields?.shipping_complement ?? EMPTY_STRING
    this.shippingNeighborhood = recoveredFields?.shipping_neighborhood ?? EMPTY_STRING
    this.shippingCity         = recoveredFields?.shipping_city ?? EMPTY_STRING
    this.shippingState        = recoveredFields?.shipping_state ?? EMPTY_STRING

    this.billingCEP          = recoveredFields?.billing_cep ?? EMPTY_STRING
    this.billingAddress      = recoveredFields?.billing_address ?? EMPTY_STRING
    this.billingNumber       = recoveredFields?.billing_number ?? EMPTY_STRING
    this.billingComplement   = recoveredFields?.billing_complement ?? EMPTY_STRING
    this.billingNeighborhood = recoveredFields?.billing_neighborhood ?? EMPTY_STRING
    this.billingCity         = recoveredFields?.billing_city ?? EMPTY_STRING
    this.billingState        = recoveredFields?.billing_state ?? EMPTY_STRING

    Promise.allSettled([
      this.getLoggedInUser().then((response: ResponsePattern<UserPartialCheckout>) => {
        if (!response.succeeded) {
          this.customerMail      = recoveredFields?.email ?? EMPTY_STRING
          this.customerCPF       = recoveredFields?.cpf ?? EMPTY_STRING
          this.customerPhone     = recoveredFields?.phone ?? EMPTY_STRING
          this.customerBirthdate = recoveredFields?.birthdate ?? EMPTY_STRING

          return
        }

        this.user = response.data
      }),
      this.refreshCart().then(() => {
        isPageLoading(false)
      }),
      initiateCheckoutTracking().then(response => {
        if (!response.succeeded) return

        const {
          event_id,
          event_body,
        } = response.data.meta

        fbq?.('track', 'InitiateCheckout', event_body, {
          eventID: event_id,
        })
      }),
    ])

    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY_NAME) return

      this.refreshCart()
    })
  },

  methods: {
    /**
     * Permite a seleção de um endereço previamente criado
     */
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

      this[`${addressType}CEP`]          = cep
      this[`${addressType}Address`]      = address
      this[`${addressType}Number`]       = number
      this[`${addressType}Complement`]   = complement
      this[`${addressType}City`]         = city
      this[`${addressType}State`]        = state
      this[`${addressType}Neighborhood`] = neighborhood

      if (addressType === SHIPPING_NAME_TOKEN) {
        this.selectedShippingAddressId = id

        return
      }

      if (addressType === BILLING_NAME_TOKEN) {
        this.selectedBillingAddressId = id
      }
    },

    /**
     * Captura os dados do usuário logado, caso exista
     */
    async getLoggedInUser <T extends UserPartialCheckout> (): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Falha na captura do usuário'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/checkout`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call<Response, [string, boolean?, ResponsePatternCallback?], FunctionErrorPattern>(response, error?.message ?? defaultErrorMessage, true)
        }

        const user: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, user)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async getCart <T extends CartResponse> (): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Falha ao capturar os produtos'

      try {
        const response = await fetch(`${CART_BASE_URL}/cart/get`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, data)
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
              reason: 'empty_cart',
            })

            return
          }

          this.productlist = cartData.data
        })
    },

    async getInstallments <T extends InstallmentItem[]> (): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Falha ao capturar o parcelamento'

      try {
        const response = await fetch(`${PAYMENT_BASE_URL}/calculatefees`, {
          ...buildRequestOptions([], EnumHttpMethods.POST),
          body: stringify<GetInstallmentsBody>({
            amount: this.getOrderPrice,
            cardBin: this.customerCreditCardNumber
              .replace(/\D+/g, EMPTY_STRING)
              .slice(0, 8),
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async refreshInstallments (): Promise<void> {
      if (!this.isCreditCard || !this.isCreditCardGroupValid || this.getCreditCardToken.hasErrors) return

      this.installment         = NULL_VALUE
      this.selectedInstallment = NULL_VALUE
      this.installmentMessage  = NULL_VALUE

      const response = await this.getInstallments()

      if (!response.succeeded) {
        this.installmentMessage = response.message

        return
      }

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

      const selectedPayment = this.selectedPayment

      this.triggerValidations()

      if (!this.isSubmitted) {
        this.isSubmitted = true

        nextTick(() => this.handlePayment(e))

        return
      }

      const firstInvalidField = this.firstInvalidField

      if (firstInvalidField && firstInvalidField.field) {
        const {
          field,
        } = firstInvalidField

        scrollIntoView(field, SCROLL_INTO_VIEW_DEFAULT_ARGS)

        if (isInputInstance(field)) {
          setTimeout(focusInput, 500, field, {
            preventScroll: false,
          } satisfies FocusOptions)
        }

        return
      }

      if (isNull(selectedPayment)) return

      this.hasPendingPayment = !isPageLoading(true)

      const response = await this.handlePostPayment(selectedPayment)

      if (!response.succeeded) {
        this.errorMessage = response.message

        this.hasPendingPayment = !isPageLoading(false)

        return
      }

      clearStoredFields()
      // clearTrackingCookies()

      const path: Record<ISinglePaymentKey, string> = {
        [PIX_PAYMENT]: 'pix',
        [CREDIT_CARD_PAYMENT]: 'confirmacao-do-pedido',
      }

      const redirectURL: string = path[selectedPayment]

      localStorage.removeItem(STORAGE_KEY_NAME)

      location.href = buildURL(['/pagamento', redirectURL].join(SLASH_STRING), {
        order: response.data.transactionid,
      })
    },

    async handlePostPayment <T extends ISinglePaymentKey> (paymentType: T): Promise<ResponsePattern<PaymentResponseMap[T]>> {
      const defaultErrorMessage = 'Falha ao gerar o pedido'

      try {
        const response = await fetch(`${PAYMENT_BASE_URL}/payment/process/${paymentType}`, {
          ...buildRequestOptions([
            ...getTrackingCookies(),
            ...getMetaTrackingCookies(),
          ], EnumHttpMethods.POST),
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

        const data: PaymentResponseMap[T] = await response.json()

        return postSuccessResponse.call<
          Response, [PaymentResponseMap[T], ResponsePatternCallback?], FunctionSucceededPattern<PaymentResponseMap[T]>
        >(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    triggerValidations (): void {
      const notIgnoredFields = this.notIgnoredFields

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

      if (deliveryPlace === DELIVERY_TYPE_SAME && regexTest(CEP_REGEX_VALIDATION, this.billingCEP) && this.isBillingAddressGroupValid) {
        searchAddress({
          cep: this.billingCEP,
          deliveryMode: true,
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
      if (!regexTest(CEP_REGEX_VALIDATION, cep) || cep === oldCep) return false

      const fieldKey: `${IOrderAddressType}CEP` = `${addressType}CEP`

      const address = await searchAddress({
        cep,
        deliveryMode: addressType === SHIPPING_NAME_TOKEN,
      })

      if (!address.succeeded) {
        const { message } = address

        this[fieldKey] = EMPTY_STRING

        this.setVisitedField(fieldKey)

        this.deliveryShippingAddressErrorMessage = addressType === SHIPPING_NAME_TOKEN && message !== ERROR_CODE_NOT_FOUND
          ? (CEP_MESSAGES?.[message] ?? CEP_MESSAGES[ERROR_CODE_BAD_REQUEST])
          : NULL_VALUE

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

    async captureCoupon <T extends ISingleOrderCoupon> (): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Falha ao capturar o cupom indicado'

      try {
        const response = await fetch(`${PAYMENT_BASE_URL}/get_coupon`, {
          ...buildRequestOptions([], EnumHttpMethods.POST),
          body: stringify<GetCouponRequestBody>({
            verify_amount: true,
            coupon_code: this.couponCode,
            cpf: trim(this.customerCPF),
            has_subsidy: this.subsidy?.has ?? false,
            delivery_cep: this.getParsedAddresses.shippingaddress.zipPostalCode,
            has_selected_delivery: !isNull(this.deliveryHour) && !isNull(this.deliveryDate),
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, data)
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

    /**
     * Carrega a lib do PagSeguro para gerar a encriptação dos dados do cartão
     */
    loadPagSeguro (): void {
      const script = document.createElement('script')

      script.async = true
      script.src = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js'
      script.onload = () => {
        this.isPagSeguroLoaded = true
      }

      document.head.appendChild(script)
    },

    /**
     * Reseta os dados da seção "Cartão de crédito"
     */
    clearCreditCardData (): void {
      this.customerCreditCardHolder = EMPTY_STRING
      this.customerCreditCardNumber = EMPTY_STRING
      this.customerCreditCardDate   = EMPTY_STRING
      this.customerCreditCardCVV    = EMPTY_STRING
    },

    /**
     * Captura e altera o estado com as datas e horários disponíveis para entrega
     */
    async handleDeliveryOptions (): Promise<void> {
      const response = await this.captureDeliveryOptions()

      if (!response.succeeded) return

      this.deliveryOptions = response.data
    },

    /**
     * Captura as datas e períodos de entrega disponíveis
     */
    async captureDeliveryOptions <T extends CheckoutDeliveryResponse> (): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Falha ao capturar as opções de entrega'

      try {
        const response = await fetch(`${DELIVERY_BASE_URL}/delivery`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    /**
     * Configura uma data de envio
     */
    setDeliveryDate (shiftDays: number): void {
      if (this.deliveryDate === shiftDays || !this.deliveryOptions) return

      const deliveryOption = this.deliveryOptions.dates.find(({ shift_days }) => shift_days === shiftDays)

      if (!deliveryOption) return

      this.deliveryDate  = deliveryOption.shift_days
      this.deliveryHour  = NULL_VALUE
      this.deliveryPrice = NULL_VALUE
    },

    /**
     * Configura um horário de entrega
     */
    setDeliveryHour (_hour: number): void {
      if (this.deliveryHour === _hour || this.getSelectedDateDetails?.periods.periods_count === 0) return

      this.deliveryHour = _hour
    },

    /**
     * Captura os dados de cotação de entrega do pedido
     */
    async handleDeliveryQuotation (controller: AbortController): Promise<void> {
      this.isDeliveryLoading = true

      const response = await this.captureDeliveryQuotation(controller)

      if (!response.succeeded) return

      const {
        total: value,
        validator,
      } = response.data

      this.deliveryPrice = ({
        value,
        validator,
      } satisfies Omit<PostOrderDeliveryGroup, 'has_priority'>)

      this.isDeliveryLoading = false
    },

    /**
     * Captura uma e retorna uma cotação para entrega na Lalamove
     */
    async captureDeliveryQuotation <T extends CheckoutDeliveryPriceResponse> (controller: AbortController): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Falha ao gerar uma cotação'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:i6etHc7G/site/checkout-delivery`, {
          ...buildRequestOptions([], EnumHttpMethods.POST),
          signal: controller.signal,
          body: stringify<
            Exclude<QuotationPayloadReturns, false>
          >(this.quotationPayload as Exclude<QuotationPayloadReturns, false>),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    /**
     * Captura e salva no estado os dados de subsídio
     */
    async handleSubsidy (): Promise<void> {
      const shippingCEP = this.getParsedAddresses.shippingaddress.zipPostalCode

      if (!regexTest(CEP_REGEX_VALIDATION, shippingCEP)) return

      const response = await this.verifyForSubsidy(numberOnly(shippingCEP))

      this.subsidy = response.succeeded
        ? response.data
        : NULL_VALUE
    },

    /**
     * Verifica se o CEP que será usado para entrega do pedido possui subsídio
     */
    async verifyForSubsidy <T extends SubsidyResponse> (cep: string): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Houve uma falha na verificação'

      try {
        const response = await fetch(`${DELIVERY_BASE_URL}/delivery/${cep}/subsidy`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    /**
     * Gera um novo carrinho abandonado
     */
    async createAbandonmentCart (payload: CartAbandonmentParams): Promise<ResponsePattern<void>> {
      const defaultErrorMessage = 'Houve uma ao gerar o carrinho'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:EuHZTAGr/abandonment/post`, {
          ...buildRequestOptions([], EnumHttpMethods.POST),
          keepalive: true,
          priority: 'high',
          body: stringify<CartAbandonmentParams>(payload),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data = await response.json()

        return postSuccessResponse.call<Response, [void, ResponsePatternCallback?], FunctionSucceededPattern<void>>(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },
  },

  computed: {
    /**
     * Verifica se existe um meio de pagamento selecionado
     */
    hasSelectedPaymentMethod (): boolean {
      return !isNull(this.selectedPayment)
    },

    /**
     * `true` se o metodo de pagamento selecionado for `creditcard`
     */
    isCreditCard (): boolean {
      return this.selectedPayment === CREDIT_CARD_PAYMENT
    },

    /**
     * Captura o subtotal do pedido
     */
    getOrderSubtotal (): number {
      return this.productlist?.order_price ?? 0
    },

    /**
     * Retorna o valor de `getOrderSubtotal` formatado em BRL
     */
    getOrderSubtotalFormatted (): string {
      return BRLFormatter.format(this.getOrderSubtotal)
    },

    /**
     * Captura o valor total que será cobrado no pedido
     */
    getOrderPrice (): number {
      const finalPrice = [
        this.getOrderSubtotal,
        this.getShippingPrice,
        this.priorityFee,
        // this.subsidyDiscountPrice,
        this.getCouponDiscountPrice,
      ]

      pushIf(this.hasSubsidy, finalPrice, this.subsidyDiscountPrice)
      pushIf(this.hasPIXDiscount, finalPrice, this.PIXDiscountPrice)

      return decimalRound(
        finalPrice.reduce((accPrice, price) => accPrice + price, 0),
        2,
      )
    },

    /**
     * Retorna o valor de `getOrderPrice` formatado em BRL
     */
    getOrderPriceFormatted (): string {
      return BRLFormatter.format(this.getOrderPrice)
    },

    /**
     * Captura o valor que será cobrado sobre o envio, retornará zero sempre que o valor do subtotal for igual ou maior a 400
     */
    getShippingPrice (): number {
      const {
        deliveryPrice,
        hasFreeShippingByCartPrice,
      } = this

      if (hasFreeShippingByCartPrice) return 0

      return isNull(deliveryPrice)
        ? 0
        : deliveryPrice.value / 100
    },

    /**
     * Retorna o valor de `getShippingPrice` formatado em BRL ou a mensagem 'Frete grátis' se o valor do carrinho for maior ou igual a 400 BRL
     */
    getShippingPriceFormatted (): string {
      if (this.hasFreeShippingByCartPrice) return 'Frete grátis'

      return BRLFormatter.format(this.getShippingPrice)
    },

    /**
     * Retorna o desconto fornecido pelo cupom aplicado (retorna 0 ou valor negativo)
     */
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

    /**
     * Retorna o valor de `getShippingPriceFormatted` formatado em BRL
     */
    getCouponDiscountPriceFormatted (): string {
      return BRLFormatter.format(this.getCouponDiscountPrice)
    },

    /**
     * Retorna o preço onde deverá ser aplicado o cupom de desconto
     * Se o cupom for do tipo `subtotal` retorna o valor de `getOrderSubtotal`
     * Se o cupom for do tipo `shipping` retorna o valor de `getShippingPrice`
     * Se o cupom for do tipo `product_id` será retornado o valor do produto em questão
     */
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

    /**
     * Dados do produto
     */
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

    /**
     * Verifica se os dados básicos do usuário são válidos
     */
    isPersonalDataValid (): boolean {
      return !this.isSubmitted || [
        this.customerMailValidation.valid,
        this.customerBirthdateValidation.valid,
        this.customerCPFValidation.valid,
        this.customerPhoneValidation.valid,
      ].every(Boolean)
    },

    /**
     * Verifica se o e-mail informado é válido
     */
    customerMailValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerMailElement,
        !this.hasVisitRegistry('customerMail') || regexTest(EMAIL_REGEX_VALIDATION, this.customerMail),
      )
    },

    /**
     * Verifica se a data de nascimento recebida é válida
     */
    customerBirthdateValidation (): ISingleValidateCheckout {
      const { customerBirthdate } = this

      return buildFieldValidation(
        this.customerBirthdateElement,
        !this.hasVisitRegistry('customerBirthdate') || regexTest(DATE_REGEX_VALIDATION, customerBirthdate) && isDateValid(customerBirthdate),
      )
    },

    /**
     * Verifica se o CPF fornecido é válido
     */
    customerCPFValidation (): ISingleValidateCheckout {
      const { customerCPF } = this

      return buildFieldValidation(
        this.customerCPFElement,
        !this.hasVisitRegistry('customerCPF') || regexTest(CPF_REGEX_VALIDATION, this.customerCPF) && isCPFValid(customerCPF),
      )
    },

    /**
     * Verifica se o cliente forneceu um telefone válido
     */
    customerPhoneValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerPhoneElement,
        !this.hasVisitRegistry('customerPhone') || regexTest(PHONE_REGEX_VALIDATION, this.customerPhone),
      )
    },

    /**
     * Verifica se o usuário selecionou um meio de pagamento
     */
    paymentMethodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(this.paymentMethodMessageElement, !isNull(this.selectedPayment))
    },

    /**
     * Verifica se o nome impresso no cartão é válido
     */
    customerCreditCardHolderValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardHolderElement,
        !this.hasVisitRegistry('customerCreditCardHolder') || regexTest(FULLNAME_REGEX_VALIDATION, replaceDuplicatedSpaces(normalizeText(trim(this.customerCreditCardHolder)))),
        !this.isCreditCard,
      )
    },

    customerCreditCardNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardNumberElement,
        !this.hasVisitRegistry('customerCreditCardNumber') || regexTest(/^(\d{4})(\s\d{4}){2}(\s\d{3,4})$/, trim(this.customerCreditCardNumber)),
        !this.isCreditCard,
      )
    },

    customerCreditCardDateValidation (): ISingleValidateCheckout {
      const { customerCreditCardDate } = this

      return buildFieldValidation(
        this.customerCreditCardDateElement,
        !this.hasVisitRegistry('customerCreditCardDate') || regexTest(/^(1[012]|0[1-9])\/\d{2}$/, customerCreditCardDate) && isExpireDateValid(customerCreditCardDate),
        !this.isCreditCard,
      )
    },

    customerCreditCardCVVValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.customerCreditCardCVVElement,
        !this.hasVisitRegistry('customerCreditCardCVV') || regexTest(/^\d{3,4}$/, this.customerCreditCardCVV),
        !this.isCreditCard,
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
        !this.isCreditCard,
      )
    },

    billingAddressValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingAddressElement,
        !this.hasVisitRegistry('billingAddress') || objectSize(trim(this.billingAddress)) > 2,
        !this.isCreditCard,
      )
    },

    billingNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingNumberElement,
        !this.hasVisitRegistry('billingNumber') || objectSize(this.billingNumber) > 0,
        !this.isCreditCard,
      )
    },

    billingNeighborhoodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingNeighborhoodElement,
        !this.hasVisitRegistry('billingNeighborhood') || objectSize(this.billingNeighborhood) > 0,
        !this.isCreditCard,
      )
    },

    billingCityValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingCityElement,
        !this.hasVisitRegistry('billingCity') || objectSize(this.billingCity) > 2,
        !this.isCreditCard,
      )
    },

    billingStateValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.billingStateElement,
        !this.hasVisitRegistry('billingState') || includes(statesAcronym, this.billingState),
        !this.isCreditCard,
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
        !this.isCreditCard,
      )
    },

    shippingRecipientValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingRecipientElement,
        !this.hasVisitRegistry('shippingRecipient') || regexTest(/^(\w{2,})(\s+(\w+))+$/, replaceDuplicatedSpaces(normalizeText(trim(this.shippingRecipient)))),
        !this.shouldValidateShippingAddress,
      )
    },

    shippingCEPValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingCEPElement,
        !this.hasVisitRegistry('shippingCEP') || regexTest(CEP_REGEX_VALIDATION, this.shippingCEP),
        !this.shouldValidateShippingAddress,
      )
    },

    shippingAddressValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingAddressElement,
        !this.hasVisitRegistry('shippingAddress') || objectSize(trim(this.shippingAddress)) > 2,
        !this.shouldValidateShippingAddress,
      )
    },

    shippingNumberValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingNumberElement,
        !this.hasVisitRegistry('shippingNumber') || objectSize(trim(this.shippingNumber)) > 0,
        !this.shouldValidateShippingAddress,
      )
    },

    shippingNeighborhoodValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingNeighborhoodElement,
        !this.hasVisitRegistry('shippingNeighborhood') || objectSize(trim(this.shippingNeighborhood)) > 3,
        !this.shouldValidateShippingAddress,
      )
    },

    shippingCityValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingCityElement,
        !this.hasVisitRegistry('shippingCity') || objectSize(trim(this.shippingCity)) > 2,
        !this.shouldValidateShippingAddress,
      )
    },

    shippingStateValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.shippingStateElement,
        !this.hasVisitRegistry('shippingState') || includes(statesAcronym, this.shippingState),
        !this.shouldValidateShippingAddress,
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
        !this.paymentMethodValidation.valid,
      )
    },

    deliveryHoursGroupValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.deliveryHourMessageElement,
        !isNull(this.deliveryHour),
        !this.deliveryDatesGroupValidation.valid,
      )
    },

    installmentGroupValidation (): ISingleValidateCheckout {
      return buildFieldValidation(
        this.installmentsMessageElement,
        !isNull(this.selectedInstallment),
        !this.isCreditCard || !this.paymentMethodValidation.valid,
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
      const shippingaddress: IParsedAddress = {
        zipPostalCode: this.shippingCEP,
        street: this.shippingAddress,
        number: this.shippingNumber,
        complement: parseComplement(this.shippingComplement),
        neighbourhood: this.shippingNeighborhood,
        city: this.shippingCity,
        state: parseState(this.shippingState),
      }

      const billingaddress: IParsedAddress = {
        zipPostalCode: this.billingCEP,
        street: this.billingAddress,
        number: this.billingNumber,
        complement: parseComplement(this.billingComplement),
        neighbourhood: this.billingNeighborhood,
        city: this.billingCity,
        state: parseState(this.billingState),
      }

      if (this.isCreditCard) {
        return {
          billingaddress,
          shippingaddress: this.isSameAddress
            ? billingaddress
            : shippingaddress,
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
      return this.isCreditCard && (objectSize(this.installment ?? []) > 0 || !isNull(this.installmentMessage))
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

      return isArray(deliveryOptions?.dates) && objectSize(deliveryOptions?.dates) > 0
    },

    hasDeliveryHour (): boolean {
      return !isNull(this.deliveryDate) && objectSize(this.getParsedDeliveryHours) > 0
    },

    getParsedDeliveryHours (): ComputedDeliveryHours[] {
      const { getSelectedDateDetails } = this

      if (!this.hasDeliveryDates || isNull(getSelectedDateDetails)) return []

      return getSelectedDateDetails.periods.hours.map(({ label, hour }) => ({
        hour,
        label,
      }))
    },

    quotationPayload (): QuotationPayloadReturns {
      if ([this.deliveryDate, this.deliveryHour].some(isNull)) return false

      const shippingCEP = this.getParsedAddresses.shippingaddress.zipPostalCode

      if (!regexTest(CEP_REGEX_VALIDATION, shippingCEP)) return false

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
      const { deliveryOptions, deliveryDate } = this

      if (isNull(deliveryOptions)) return []

      return deliveryOptions.dates.map(({ label, shift_days }) => ({
        label,
        shift_days,
        selected: deliveryDate === shift_days,
      }))
    },

    getSelectedDateDetails (): Nullable<CheckoutDeliveryOption> {
      const {
        deliveryDate,
        deliveryOptions,
      } = this

      if (isNull(deliveryDate) || isNull(deliveryOptions)) return NULL_VALUE

      const selectedDate = deliveryOptions.dates.find(({ shift_days }) => shift_days === deliveryDate)

      return selectedDate ?? NULL_VALUE
    },

    getSelectedHourDetails (): Nullable<CheckoutDeliveryHour> {
      const {
        deliveryHour,
        getSelectedDateDetails,
      } = this

      if (isNull(getSelectedDateDetails) || isNull(this.deliveryHour)) return NULL_VALUE

      const selectedHour = getSelectedDateDetails.periods.hours.find(({ hour }) => hour === deliveryHour)

      return selectedHour ?? NULL_VALUE
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
      const { subsidy } = this

      if (isNull(subsidy)) return false

      return subsidy.has && this.getShippingPrice > 0 && this.getOrderSubtotal >= SUBSIDY_MIN_CART_PRICE && !this.hasFreeShippingByCartPrice
    },

    subsidyDiscountPrice (): number {
      const { subsidy } = this

      if (isNull(subsidy)) return 0

      return subsidy.has
        ? Math.min(subsidy.value, this.getShippingPrice) * -1
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
      const {
        deliveryOptions,
        selectedPayment,
      } = this

      if (isNull(deliveryOptions) || isNull(selectedPayment)) return false

      return selectedPayment === PIX_PAYMENT && deliveryOptions.pix_discount > 0
    },

    PIXDiscountPrice (): number {
      const {
        hasPIXDiscount,
        deliveryOptions,
      } = this

      if (!hasPIXDiscount || isNull(deliveryOptions)) return 0

      return decimalRound(deliveryOptions.pix_discount / 100 * -this.getOrderSubtotal, 2)
    },

    PIXDiscountPriceFormatted (): string {
      return BRLFormatter.format(this.PIXDiscountPrice)
    },

    userAddresses (): UserAddressCheckout[] {
      const { user } = this

      if (!user || objectSize(user.address_list) === 0) return []

      return user.address_list.map(({ address, number, cep, ...rest }) => ({
        ...rest,
        address,
        number,
        cep,
        complete: `${address}, ${number} ${cep}`,
      }))
    },

    showDeliveryPrice (): boolean {
      return !isNull(this.deliveryPrice) || this.hasFreeShippingByCartPrice
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
      // TODO: Verificar meio de tipar corretamente este watcher
      // TODO: Verificar se é possível subtituir essa abordagem pela chamada do método no `created`
      // @ts-ignore
      handler: function (): void {
        this.refreshInstallments()
      },
    },

    getCreditCardToken (payload: PagSeguroCardEncrypt) {
      if (payload.hasErrors) return

      this.refreshInstallments()
    },

    quotationPayload (
      payload: QuotationPayloadReturns,
      oldPayload: QuotationPayloadReturns,
      cleanup: OnCleanup,
    ): void {
      if (!payload) return

      const {
        cep,
        // delivery_hour,
        // delivery_date,
      } = payload

      if (!regexTest(CEP_REGEX_VALIDATION, cep)) return

      const controller = getAbortController()

      if (!oldPayload) {
        this.handleDeliveryQuotation(controller)

        return cleanup(controller.abort)
      }

      const {
        cep: oldCep,
        // delivery_date: oldDeliveryDate,
        // delivery_hour: oldDeliveryHour,
      } = oldPayload

      this.handleDeliveryQuotation(controller)

      return cleanup(controller.abort)
    },

    getParsedAddresses (currentAddresses: IParsedAddressContent, oldAddresses: IParsedAddressContent): void {
      if (!currentAddresses || !oldAddresses) return

      if (currentAddresses.shippingaddress.zipPostalCode === oldAddresses.shippingaddress.zipPostalCode) return

      if (!regexTest(CEP_REGEX_VALIDATION, currentAddresses.shippingaddress.zipPostalCode)) return

      if (this.isCreditCard && isNull(this.deliveryPlace)) return

      this.handleSubsidy()
    },

    user (user: Nullable<UserPartialCheckout>): void {
      if (!user) return

      this.customerPhone     = user.telephone ?? EMPTY_STRING
      this.customerCPF       = user.cpf ?? EMPTY_STRING
      this.customerBirthdate = user.birthday
        ?.split(DASH_STRING)
        .reverse()
        .join(SLASH_STRING) ?? EMPTY_STRING
      this.customerMail      = user.email ?? EMPTY_STRING
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
          // TODO: Encontrar maneira de tipar corretamente a instância do componente abaixo
          // @ts-ignore
          instance.setVisitedField(value)

          eventMap.delete(el)
        }, { once: true })

        eventMap.set(el, remover)
      },

      unmounted: cleanupDirective,
    },

    // v-capture-abandonment
    captureAbandonment: {
      // mounted (el: HTMLInputElement, binding: DirectiveBinding<null, string, AbandonmentFieldsNames>) {
      mounted (el: HTMLInputElement, binding: DirectiveBinding<null, string, string>) {
        eventMap.set(
          el,
          attachEvent(el, 'change', (event: Event) => {
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

    // v-save-field
    saveField: {
      mounted (el: HTMLInputElement, { arg }: DirectiveBinding<string>): void {
        eventMap.set(
          el,
          attachEvent(el, 'change', (event: Event) => {
            if (!event.isTrusted || !arg) return

            const target = event.target

            if (!(target instanceof HTMLInputElement)) return

            storeSingleField(arg, target.value)
          })
        )
      },

      unmounted: cleanupDirective,
    },
  },
})

createApp(TalhoCheckoutApp).mount('#fechamentodopedido')

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
