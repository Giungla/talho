
import {
  OrderData,
  OrderAddress,
  TalhoOrderPageData,
  OrderShippingAddress,
  TalhoOrderPageMethods,
  TalhoOrderPageContext,
  TalhoOrderPageComputedDefinition, ParsedProduct, DeliveryOrder,
} from '../types/order-page'

import type {
  FunctionErrorPattern,
  FunctionSucceededPattern
} from '../global'

(function () {
  const {
    ref,
    createApp,
  } = window.Vue

  const EMPTY_STRING = ''
  const NULL_VALUE = null
  const FALLBACK_STRING = '-'
  const GENERAL_HIDDEN_CLASS = 'oculto'

  const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io/api:5lp3Lw8X'

  const BRLFormatter = new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  })

  function toggleClass (element: ReturnType<typeof querySelector>, className: string, force?: boolean): boolean {
    if (!element) return false

    return element.classList.toggle(className, force)
  }

  function setPageLoader (status?: boolean): boolean {
    return toggleClass(querySelector('[data-wtf-loader]'), GENERAL_HIDDEN_CLASS, !status)
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

  const TalhoOrderPage = createApp({
    name: 'TalhoOrderPage',

    setup () {},

    data () {
      return {
        order: NULL_VALUE,
      }
    },

    async created (): Promise<void> {
      const searchParams = new URLSearchParams(location.search)

      const transactionId = searchParams.get('order')

      if (!transactionId) {
        location.href = '/'

        return
      }

      const response = await this.getOrder(transactionId)

      if (!response.succeeded) {
        location.href = '/'

        return
      }

      this.order = response.data

      setPageLoader(false)
    },

    mounted (): void {
    },

    methods: {
      async getOrder (orderId: string) {
        const defaultErrorMessage = 'Falha ao capturar o pedido'

        try {
          const response = await fetch(`${XANO_BASE_URL}/order-details/${orderId}`, {
            headers: {
              Accept: 'application/json',
            },
          })

          if (!response.ok) {
            const error = await response.json()

            return postErrorResponse(error?.message ?? defaultErrorMessage)
          }

          const data: OrderData = await response.json()

          return postSuccessResponse(data)
        } catch (e) {
          return postErrorResponse(defaultErrorMessage)
        }
      },
    },

    computed: {
      name (): string {
        return this.order?.name ?? FALLBACK_STRING
      },

      email (): string {
        return this.order?.email ?? FALLBACK_STRING
      },

      cpf (): string {
        return this.order?.cpf_cnpj ?? FALLBACK_STRING
      },

      phone (): string {
        return this.order?.phone ?? FALLBACK_STRING
      },

      shipping (): OrderShippingAddress {
        const {
          number = FALLBACK_STRING,
          cep = FALLBACK_STRING,
          address = FALLBACK_STRING,
          state = FALLBACK_STRING,
          city = FALLBACK_STRING,
          complement = FALLBACK_STRING,
          neighborhood = FALLBACK_STRING,
          user_name = FALLBACK_STRING,
        } = this.order?.delivery.address ?? {}

        return {
          user_name,
          cep,
          address,
          number,
          complement,
          neighborhood,
          city,
          state,
        }
      },

      billing (): OrderAddress {
        const {
          cep = FALLBACK_STRING,
          address = FALLBACK_STRING,
          number = FALLBACK_STRING,
          complement = FALLBACK_STRING,
          neighborhood = FALLBACK_STRING,
          city = FALLBACK_STRING,
          state = FALLBACK_STRING,
        } = this.order?.billing_address ?? {}

        return {
          cep,
          address,
          number,
          complement,
          neighborhood,
          city,
          state,
        }
      },

      hasOrderDiscount (): boolean {
        return this.order?.discount_code !== NULL_VALUE
      },

      getOrderSubtotalPriceFormatted (): string {
        const price = this.order?.order_items.reduce((acc, { unit_price, quantity }) => {
          return acc + unit_price * quantity
        }, 0)

        return BRLFormatter.format(price ? (price / 100) : 0)
      },

      getOrderPriceFormatted (): string {
        const total = this.order?.total

        return BRLFormatter.format(
          typeof total === 'number'
            ? (total / 100)
            : 0
        )
      },

      getOrderShipping (): number {
        const price = this.order?.delivery.quotation_price

        return typeof price === 'number'
          ? (price / 100)
          : 0
      },

      getOrderShippingPriceFormatted (): string {
        return BRLFormatter.format(this.getOrderShipping)
      },

      getOrderDiscountPriceFormatted (): string {
        return BRLFormatter.format((this.order?.discount ?? 0) * -1)
      },

      getParsedProducts (): ParsedProduct[] {
        const {
          order_items = []
        } = this.order ?? {}

        return order_items.map(({ name, product_id, unit_price, quantity  }) => ({
          quantity,
          title: name,
          key: product_id,
          unit_amount: BRLFormatter.format(unit_price / 100),
          final_price: BRLFormatter.format((unit_price * quantity) / 100),
        }) satisfies ParsedProduct)
      },

      hasPriority (): boolean {
        return this.order?.delivery.has_priority ?? false
      },

      getPriorityFee (): number {
        return this.hasPriority
          ? (this.order?.delivery.priority_price as number / 100)
          : 0
      },

      getPriorityFeePriceFormatted (): string {
        return BRLFormatter.format(this.getPriorityFee)
      },

      hasSubsidy (): boolean {
        return this.order?.delivery.has_subsidy ?? false
      },

      getDeliverySubsidy (): number {
        if (!this.hasSubsidy) return 0

        return -1 * Math.min(
          this.getOrderShipping,
          this.order?.delivery.subsidy_price as number / 100,
        )
      },

      getDeliverySubsidyPriceFormatted (): string {
        return BRLFormatter.format(this.getDeliverySubsidy)
      },
    },
  } satisfies {
    name: string,
    setup: () => void,
    created: () => Promise<void>;
    mounted: () => void;
    data: () => TalhoOrderPageData,
    methods: TalhoOrderPageMethods,
    computed: TalhoOrderPageComputedDefinition,
  } & ThisType<TalhoOrderPageContext>)

  TalhoOrderPage.mount(querySelector('#orderapp'))
})()
