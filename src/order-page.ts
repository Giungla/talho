
import type {
  OrderData,
  OrderAddress,
  ParsedProduct,
  TalhoOrderPageData,
  OrderShippingAddress,
  TalhoOrderPageMethods,
  TalhoOrderPageContext,
  TalhoOrderPageComputedDefinition,
} from '../types/order-page'

import type {
  ResponsePattern
} from '../global'

import {
  NULL_VALUE,
  BRLFormatter,
  XANO_BASE_URL,
  isNull,
  isPageLoading,
  querySelector,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils'

(function () {
  const {
    createApp,
  } = window.Vue

  const FALLBACK_STRING = '-'

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

      isPageLoading(false)
    },

    mounted (): void {
    },

    methods: {
      async getOrder (orderId: string): Promise<ResponsePattern<OrderData>> {
        const defaultErrorMessage = 'Falha ao capturar o pedido'

        try {
          const response = await fetch(`${XANO_BASE_URL}/api:5lp3Lw8X/order-details/${orderId}`, {
            ...buildRequestOptions(),
          })

          if (!response.ok) {
            const error = await response.json()

            return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
          }

          const data: OrderData = await response.json()

          return postSuccessResponse.call(response, data)
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
        return !isNull(this.order?.discount_code)
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
