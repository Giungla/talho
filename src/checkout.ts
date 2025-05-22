
import {
  CartResponse,
  FunctionErrorPattern, FunctionSucceededPattern,
  ISinglePaymentKey,
  Nullable, ResponsePattern,
  TalhoCheckoutAppComputed,
  TalhoCheckoutAppData, TalhoCheckoutAppSetup, TalhoCheckoutContext
} from '../global'

(function () {
  const {
    ref,
    createApp,
    defineComponent
  } = Vue

  const CART_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io/api:79PnTkh_'

  const REQUEST_HEADERS = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }

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

  function normalizeText (text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  function numberOnly (value: string): string {
    return value.replace(/\D+/g, '')
  }

  function scrollIntoView (element: HTMLElement, args: boolean | ScrollIntoViewOptions) {
    element.scrollIntoView(args)
  }

  function maskPhoneNumber (value: string): string {
    const replacer = (
      _: string,
      d1: Nullable<string>,
      d2: Nullable<string>,
      d3: Nullable<string>,
    ) => {
      const response = []

      d1 && response.push(`(${d1}`)
      d2 && response.push(`) ${d2}`)
      d3 && response.push(`-${d3}`)

      return response.join('')
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
      const response = []

      g1 && response.push(`${g1}`)
      g2 && response.push(`.${g2}`)
      g3 && response.push(`.${g3}`)
      g4 && response.push(`-${g4}`)

      return response.join('')
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
      const response = []

      g1 && response.push(g1)
      g2 && response.push(g2)
      g3 && response.push(g3)
      g4 && response.push(g4)

      return response.join(' ')
    })
  }

  function maskCardDate (value: string): string {
    return value.replace(/^(\d{0,2})(\d{0,2})/, (
      _: string,
      g1: Nullable<string>,
      g2: Nullable<string>,
    ) => {
      const response = []

      g1 && response.push(g1)
      g2 && response.push(g2)

      return response.join('/')
    })
  }

  function maskCEP (value: string): string {
    return value.replace(/^(\d{0,5})(\d{0,3})/, (
      _: string,
      g1: Nullable<string>,
      g2: Nullable<string>,
    ) => {
      const response = []

      g1 && response.push(g1)
      g2 && response.push(g2)

      return response.join('-')
    })
  }

  function toUpperCase (value: string): string {
    return value.toUpperCase()
  }

  function isArray (arg: any): boolean {
    return Array.isArray(arg)
  }

  function pushIf (condition: Boolean) {}

  function buildMaskDirective (...mappers: ((value: string) => string)[]) {
    return {
      mounted (el: HTMLInputElement) {
        const remover = attachEvent(el, 'input', (event) => {
          if (!event.isTrusted) return

          const target = event.target as HTMLInputElement

          target.value = mappers.reduce((value, callbackFn) => callbackFn(value), target.value ?? '')

          el.dispatchEvent(INPUT_EVENT)
        })

        eventMap.set(el, remover)
      },

      unmounted (el: HTMLInputElement) {
        const cleanup = eventMap.get(el)

        cleanup?.()
      },
    }
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
    if (!node) return null as T

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

  const TalhoCheckoutApp = createApp(
    defineComponent(
      {
        name: 'TalhoCheckoutApp',

        setup (): TalhoCheckoutAppSetup {
          const customerCPF = ref<string>('')
          const customerMail = ref<string>('')
          const customerPhone = ref<string>('')
          const customerBirthdate = ref<string>('')

          const customerCreditCardCVV = ref<string>('')
          const customerCreditCardDate = ref<string>('')
          const customerCreditCardNumber = ref<string>('')
          const customerCreditCardHolder = ref<string>('')

          return {
            customerCPF,
            customerMail,
            customerPhone,
            customerBirthdate,

            customerCreditCardCVV,
            customerCreditCardDate,
            customerCreditCardNumber,
            customerCreditCardHolder,
          }
        },

        data (): TalhoCheckoutAppData {
          return {
            productlist: null,
            selectedPayment: null,
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
            deliveryPlace: null,
            deliveryPlaces: [
              {
                token: DELIVERY_TYPE_SAME,
                label: 'Mesmo endereço de cobrança do cartão'
              },
              {
                token: DELIVERY_TYPE_DIFF,
                label: 'Entregar em um endereço diferente'
              }
            ]
          }
        },

        mounted (this: TalhoCheckoutContext) {
          this.getCart().then(cartData => {
            if (!cartData.succeeded) return

            this.productlist = cartData.data
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

          setSelectedPaymentMethod (method: ISinglePaymentKey) {
            if (this.selectedPayment === method) return

            this.selectedPayment = method
          }
        },

        computed: <ThisType<TalhoCheckoutContext>> {
          isCreditCard () {
            return this.selectedPayment === CREDIT_CARD_PAYMENT
          },

          getOrderPrice () {
            return this.productlist?.order_price ?? 0
          },

          getOrderPriceFormatted () {
            return BRLFormatter.format(this.getOrderPrice)
          },

          getShippingPrice () {
            return 0 // TODO: Retornar o valor correto do frete
          },

          getShippingPriceFormatted () {
            return BRLFormatter.format(this.getShippingPrice)
          },

          getParsedProducts () {
            const productlist = this.productlist?.items

            if (!isArray(productlist)) return []

            return this.productlist?.items.map(({ name, imageUrl, quantity, price }) => {
              return ({
                name: name,
                image: imageUrl,
                quantity: quantity,
                price: BRLFormatter.format(price),
                finalPrice: BRLFormatter.format(price * quantity),
              })
            })
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
        }
      }
    )
  )

  TalhoCheckoutApp.mount('#fechamentodopedido')
})()
