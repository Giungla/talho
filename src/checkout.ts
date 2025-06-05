
import {
  CartResponse, ComputedDeliveryDate, CouponDefinition, CreditCardPostOrder, DeliveryDate,
  FunctionErrorPattern,
  FunctionSucceededPattern, GetCouponRequestBody, GetInstallmentsBody,
  IAddressType, ICouponType, InstallmentItem,
  IOrderAddressType,
  IParsedAddress,
  IParsedAddressContent, ISingleOrderCoupon, ISingleOrderCouponError,
  ISinglePaymentKey,
  ISingleValidateCheckout, ISODateString,
  IStateAcronym,
  Nullable, PagSeguroCardEncrypt,
  ParsedProductList, PostOrder, PostOrderCustomer,
  ResponsePattern,
  TalhoCheckoutAppComputed,
  TalhoCheckoutAppData,
  TalhoCheckoutAppSetup,
  TalhoCheckoutContext,
  VIACEPFromXano
} from '../global'

// @ts-expect-error
import type { DirectiveBinding, Ref, CreateAppFunction } from 'vue'

(function () {
  const ref = Vue.ref as Ref
  const createApp: CreateAppFunction = Vue.createApp

  const EMPTY_STRING = ''
  const NULL_VALUE = null

  const CEP_LENGTH = 8

  const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io'

  const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`

  const PAYMENT_BASE_URL = `${XANO_BASE_URL}/api:5lp3Lw8X`

  const DELIVERY_BASE_URL = `${XANO_BASE_URL}/api:24B7O9Aj`

  const REQUEST_HEADERS = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }

  const POST_REQUEST = {
    method: 'POST',
    ...REQUEST_HEADERS,
  }

  const MIN_AVAILABLE_INSTALLMENT_COUNT = 1
  const MAX_AVAILABLE_INSTALLMENT_COUNT = 2

  const STORAGE_KEY_NAME = 'talho_cart_items'

  const statesMap = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AP': 'Amapá',
    'AM': 'Amazonas',
    'BA': 'Bahia',
    'CE': 'Ceará',
    'DF': 'Distrito Federal',
    'ES': 'Espírito Santo',
    'GO': 'Goiás',
    'MA': 'Maranhão',
    'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais',
    'PA': 'Pará',
    'PB': 'Paraíba',
    'PR': 'Paraná',
    'PE': 'Pernambuco',
    'PI': 'Piauí',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia',
    'RR': 'Roraima',
    'SC': 'Santa Catarina',
    'SP': 'São Paulo',
    'SE': 'Sergipe',
    'TO': 'Tocantins'
  }

  const statesAcronym = Object.keys(statesMap) as IStateAcronym[]

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

  const BRLFormatter = new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  })

  function hasOwn (object: object, key: PropertyKey): boolean {
    return Object.hasOwn(object, key)
  }

  function clamp (min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function stringify <T extends object> (value: T): string {
    return JSON.stringify(value)
  }

  function normalizeText (text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, EMPTY_STRING)
  }

  function numberOnly (value: string): string {
    return value.replace(/\D+/g, EMPTY_STRING)
  }

  function trimText (text: string): string {
    return text.trim()
  }

  function objectSize <T extends string | any[]> (value: T): number {
    return value.length
  }

  function scrollIntoView (element: HTMLElement, args: boolean | ScrollIntoViewOptions) {
    element.scrollIntoView(args)
  }

  function isExpireDateValid (expireDate: string): boolean {
    const tokens = expireDate.split('/')

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
        .join('/')
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

      return response.join('/')
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

  function isArray (arg: any): boolean {
    return Array.isArray(arg)
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
        const remover = attachEvent(el, 'input', (event) => {
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
    ] = date.split('/')

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

  function postErrorResponse (message: string): FunctionErrorPattern {
    return {
      message,
      succeeded: false
    }
  }

  function postSuccessResponse <T = void> (response: T): FunctionSucceededPattern<T> {
    return {
      data: response,
      succeeded: true
    }
  }

  function querySelector<
    K extends keyof HTMLElementTagNameMap,
    T extends HTMLElementTagNameMap[K] | Element | null = HTMLElementTagNameMap[K] | null
  >(
    selector: K | string,
    node: HTMLElement | Document | null = document
  ): T {
    if (!node) return NULL_VALUE as T

    return node.querySelector(selector as string) as T
  }

  function attachEvent <
    T extends HTMLElement | Document,
    K extends T extends HTMLElement
      ? keyof HTMLElementEventMap
      : keyof DocumentEventMap
  > (
    node: T | null,
    eventName: K,
    callback: (event: T extends HTMLElement
      ? HTMLElementEventMap[K extends keyof HTMLElementEventMap ? K : never]
      : DocumentEventMap[K extends keyof DocumentEventMap ? K : never]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): VoidFunction | void {
    if (!node) return

    node.addEventListener(eventName, callback as EventListener, options)

    return () => node.removeEventListener(eventName, callback as EventListener, options)
  }

  async function searchAddress (cep: string): Promise<ResponsePattern<VIACEPFromXano>> {
    const defaultErrorMessage = 'Não foi possível encontrar o endereço'

    cep = numberOnly(cep)

    if (cep.length !== CEP_LENGTH) return postErrorResponse(defaultErrorMessage)

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}`)

      if (!response.ok) {
        const error =  await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const address: VIACEPFromXano = await response.json()

      return postSuccessResponse(address)
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

  const TalhoCheckoutApp = createApp(
    (
      {
        name: 'TalhoCheckoutApp',

        setup (): TalhoCheckoutAppSetup {
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

          const deliveryPlaceElement = ref<HTMLElement | null>(NULL_VALUE)

          const shippingRecipientElement = ref<HTMLInputElement | null>(NULL_VALUE)
          const shippingCEPElement = ref<HTMLInputElement | null>(NULL_VALUE)
          const shippingAddressElement = ref<HTMLInputElement | null>(NULL_VALUE)
          const shippingNumberElement = ref<HTMLInputElement | null>(NULL_VALUE)
          const shippingNeighborhoodElement = ref<HTMLInputElement | null>(NULL_VALUE)
          const shippingCityElement = ref<HTMLInputElement | null>(NULL_VALUE)
          const shippingStateElement = ref<HTMLInputElement | null>(NULL_VALUE)

          const couponCodeElement = ref<HTMLInputElement | null>(NULL_VALUE)

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

            deliveryPlaceElement,

            shippingRecipientElement,
            shippingCEPElement,
            shippingAddressElement,
            shippingNumberElement,
            shippingNeighborhoodElement,
            shippingCityElement,
            shippingStateElement,

            couponCodeElement,
          }
        },

        data (): TalhoCheckoutAppData {
          return {
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
            deliveryDates: NULL_VALUE,
          }
        },

        created (this: TalhoCheckoutContext): void {
          this.refreshCart()

          window.addEventListener('storage', (e) => {
            if (e.key !== STORAGE_KEY_NAME) return

            this.refreshCart()
          })
        },

        methods: <ThisType<TalhoCheckoutContext>> {
          async getCart (): Promise<ResponsePattern<CartResponse>> {
            const defaultErrorMessage = 'Falha ao capturar os produtos'

            try {
              const response = await fetch(`${CART_BASE_URL}/cart/get`, {
                ...REQUEST_HEADERS,
                credentials: 'include',
              })

              if (!response.ok) {
                const error = await response.json()

                return postErrorResponse(error?.message ?? defaultErrorMessage)
              }

              const data: CartResponse = await response.json()

              return postSuccessResponse(data)
            } catch (e) {
              return postErrorResponse(defaultErrorMessage)
            }
          },

          refreshCart (): void {
            this.getCart().then(cartData => {
              if (!cartData.succeeded) return

              this.productlist = cartData.data
            })
          },

          async getInstallments (): Promise<ResponsePattern<InstallmentItem[]>> {
            const defaultErrorMessage = 'Falha ao capturar o parcelamento'

            try {
              const response = await fetch(`${PAYMENT_BASE_URL}/calculatefees`, {
                ...POST_REQUEST,
                cache: 'force-cache',
                body: stringify<GetInstallmentsBody>({
                  amount: this.getOrderPrice,
                  cardBin: this.customerCreditCardNumber
                    .replace(/\D+/g, EMPTY_STRING)
                    .slice(0, 8)
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

          async refreshInstallments (): Promise<void> {
            if (!this.isCreditCard) return

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
              this.handleDeliveryDates()
            }

            if (method !== CREDIT_CARD_PAYMENT) {
              this.clearCreditCardData()
            }

            if (method === CREDIT_CARD_PAYMENT && !this.isPagSeguroLoaded) {
              this.loadPagSeguro()
            }

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

            const paymentMap = {
              pix: this.handleProcessPIX,
              creditcard: this.handleProcessCreditCard,
              error: async (): Promise<ResponsePattern<void>> => {
                return postErrorResponse('Houve uma falha no envio de seu pedido')
              }
            }

            let execPayment = paymentMap?.[this.selectedPayment ?? 'error']

            const response = await execPayment()

            if (!response.succeeded) {
              alert('Pagamento falhou')

              return
            }

            console.log('Pagamento foi gerado')
            console.log(response.data)
          },

          async handleProcessPIX (): Promise<ResponsePattern<void>> {
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

          async handleProcessCreditCard (): Promise<ResponsePattern<void>> {
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
                  creditCardInfo: {
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
          },

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
            if (addressType === 'billing') {
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

            this.deliveryPlace = deliveryPlace
          },

          async captureAddress (addressType: IOrderAddressType, cep: string, oldCep?: string): Promise<void> {
            if (!regexTest(/^\d{5}-\d{3}$/, cep) || cep === oldCep) return

            const fieldKey: `${IOrderAddressType}CEP` = `${addressType}CEP`

            const address = await searchAddress(cep)

            if (!address.succeeded) {
              this[fieldKey] = EMPTY_STRING

              this.setVisitedField(fieldKey)

              return
            }

            this.feedAddress(addressType, address.data)
          },

          async captureCoupon (): Promise<ResponsePattern<ISingleOrderCoupon>> {
            const defaultErrorMessage = 'Falha ao capturar o cupom indicado'

            try {
              const response = await fetch(`${PAYMENT_BASE_URL}/get_coupon`, {
                ...POST_REQUEST,
                credentials: 'include',
                body: stringify<GetCouponRequestBody>({
                  verify_amount: true,
                  coupon_code: this.couponCode,
                  cpf: this.customerCPF && NULL_VALUE,
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

          async handleSearchCoupon (): Promise<void> {
            if (this.isCouponPending) return

            this.isCouponPending = true

            const response = await this.captureCoupon()

            this.isCouponPending = false

            if (!response.succeeded) {
              this.coupon = {
                error: true,
                code: this.couponCode,
                message: response.message,
              }

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

          async captureAvailableDeliveryDates (): Promise<ResponsePattern<DeliveryDate[]>> {
            const defaultErrorMessage = 'Falha ao capturar as datas'

            try {
              const response = await fetch(`${DELIVERY_BASE_URL}/delivery_dates`, {
                cache: 'force-cache',
              })

              if (!response.ok) {
                const error = await response.json()

                return postErrorResponse(error?.message ?? defaultErrorMessage)
              }

              const data: DeliveryDate[] = await response.json()

              return postSuccessResponse(data)
            } catch (e) {
              return postErrorResponse(defaultErrorMessage)
            }
          },

          async handleDeliveryDates () {
            const response = await this.captureAvailableDeliveryDates()

            if (!response.succeeded) return

            this.deliveryDates = response.data
          },

          setDeliveryDate (shiftDays: number): void {
            const date = this.deliveryDates?.find(date => date.shiftDays === shiftDays)?.date

            if (!date || this.deliveryDate === date) return

            this.deliveryDate = date
          },
        },

        computed: <ThisType<TalhoCheckoutContext>> {
          hasSelectedPaymentMethod (): boolean {
            return this.selectedPayment !== NULL_VALUE
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
            return [
              this.getOrderSubtotal,
              this.getShippingPrice,
              this.getCouponDiscountPrice,
            ].reduce((finalPrice, price) => {
              return finalPrice + price
            }, 0)
          },

          getOrderPriceFormatted (): string {
            return BRLFormatter.format(this.getOrderPrice)
          },

          getShippingPrice (): number {
            return 34.90 // TODO: Retornar o valor correto do frete
          },

          getShippingPriceFormatted (): string {
            return BRLFormatter.format(this.getShippingPrice)
          },

          getCouponDiscountPrice (): number {
            if (this.hasNullCoupon || this.hasInvalidCoupon) return 0

            const {
              value,
              is_percentage
            } = this.coupon as ISingleOrderCoupon

            const selectedPrice = this.getParsedPriceForApplyDiscount

            if (is_percentage) {
              return Math.min(value / 100, 1) * (selectedPrice * -1)
            }

            return Math.min(selectedPrice, value) * -1
          },

          getCouponDiscountPriceFormatted (): string {
            return BRLFormatter.format(this.getCouponDiscountPrice)
          },

          getParsedPriceForApplyDiscount (): number {
            if (this.hasNullCoupon || this.hasInvalidCoupon) return 0

            return {
              subtotal: this.getOrderSubtotal,
              shipping: this.getShippingPrice,
              product_id: 0,
            }[(this.coupon as ISingleOrderCoupon).cupom_type]
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
            return buildFieldValidation(this.paymentMethodMessageElement, this.selectedPayment !== NULL_VALUE)
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
            return [
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
              this.deliveryPlaceElement,
              this.hasSelectedAddress,
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
            return [
              this.shippingCEPValidation,
              this.shippingAddressValidation,
              this.shippingNumberValidation,
              this.shippingNeighborhoodValidation,
              this.shippingCityValidation,
              this.shippingStateValidation,
            ].every(validation => validation.valid)
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
            ].filter(({ ignoreIf }) => includes([false, undefined], ignoreIf))
          },

          firstInvalidField (): Nullable<ISingleValidateCheckout> {
            return this.notIgnoredFields.find(({ valid }) => !valid) ?? NULL_VALUE
          },

          hasSelectedAddress (): boolean {
            return this.deliveryPlace !== NULL_VALUE
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

          getOrderBaseData (): Omit<PostOrder, 'customer'> {
            return {
              user_id: null,
              coupon_code: null,
            }
          },

          showInstallmentSection (): boolean {
            return this.isCreditCard && objectSize(this.installment ?? []) > 0
          },

          getParsedInstallments (): InstallmentItem<string>[] {
            const { installment } = this

            if (!installment) return []

            return installment.map(({ installments, installment_value }) => ({
              installments,
              installment_value: BRLFormatter.format(installment_value)
            }))
          },

          hasNullCoupon (): boolean {
            return this.coupon === NULL_VALUE
          },

          hasAppliedCoupon (): boolean {
            return hasOwn(this.coupon ?? {}, 'cupom_type')
          },

          hasInvalidCoupon (): boolean {
            return hasOwn(this.coupon ?? {}, 'error')
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
            ] = this.customerCreditCardDate.split('/')

            return window.PagSeguro.encryptCard({
              expMonth: month,
              expYear: '20'.concat(year),
              holder: this.customerCreditCardHolder,
              securityCode: this.customerCreditCardCVV,
              number: numberOnly(this.customerCreditCardNumber),
              publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr4bK4jsAnaNt2kM4tDquGhO0mDIN4NIA+NRFHmhXs1UEyGy4XGIUf9kHZX2pfSOHBRS56dmLts78hcuXIYE40M3HUrD7TYLvSn2J/niOkSoXCYJZIzTgkDymHDRs83J5MKQjz5kGRnHxrRib8vJCz352rXgN04wKZGMs1HL40FY0WJqAD//9c6qCpk0wf4xAjklWJCHmOsZYUpkEFQQ1jiKiiNQJyXEkMN88YjfI8jqZYaaBqyFKVKPIIANIpXJXc2C5kHym79Dp8R0yX4KSyOORWiWm8z2OQnp8yjyRHzH9fnKjtf2iVg3qCqSt2sseJ5pCYMwIEnNfsaQl20b4lwIDAQAB',
            })
          },

          hasDeliveryDates (): boolean {
            const { deliveryDates } = this

            return isArray(deliveryDates) && objectSize(deliveryDates as DeliveryDate[]) > 0
          },

          getParsedDeliveryDates (): ComputedDeliveryDate[] {
            if (!this.hasDeliveryDates) return []

            const { deliveryDate } = this
            const deliveryDates = this.deliveryDates as DeliveryDate[]

            return deliveryDates.map(({ date, shiftDays }) => {
              const _date = new Date(`${date}T00:00:00`)

              return <ComputedDeliveryDate>{
                shiftDays,
                selected: deliveryDate === date,
                date: _date.toLocaleDateString('pt-BR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                }),
              }
            })
          }
        },

        watch: <ThisType<TalhoCheckoutContext>> {
          billingCEP (cep: string, oldCep?: string): void {
            this.captureAddress('billing', cep, oldCep)
          },

          shippingCEP (cep: string, oldCep?: string): void {
            this.captureAddress('shipping', cep, oldCep)
          },

          getOrderPrice: <ThisType<TalhoCheckoutContext>> {
            immediate: true,
            handler () {
              if (!this.isCreditCard) return

              this.installment = NULL_VALUE
              this.selectedInstallment = NULL_VALUE

              this.refreshInstallments()
            }
          }
        },

        directives: <ThisType<TalhoCheckoutContext>> {
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
              const remover = attachEvent(el, 'blur', (event) => {
                instance.setVisitedField(value)

                eventMap.delete(el)
              }, { once: true })

              eventMap.set(el, remover)
            },

            unmounted: cleanupDirective,
          }
        },
      }
    )
  )

  TalhoCheckoutApp.mount('#fechamentodopedido')
})()
