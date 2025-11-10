
import {
  type OrderData,
  type OrderAddress,
  type ParsedProduct,
  type TalhoOrderPageData,
  type OrderShippingAddress,
  type TalhoOrderPageMethods,
  type TalhoOrderPageContext,
  type TalhoOrderPageComputedDefinition,
} from '../types/order-page'

import {
  type ResponsePattern,
} from '../global'

import {
  type PurchaseTrackingParams,
} from '../types/tracking'

import {
  NULL_VALUE,
  BRLFormatter,
  XANO_BASE_URL,
  isNull,
  buildURL,
  stringify,
  isPageLoading,
  querySelector,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  getTrackingCookies,
} from '../utils'

const {
  createApp,
} = window.Vue

const FALLBACK_STRING = '-'

const REASON_PARAM = 'reason'

const TalhoOrderPage = createApp({
  name: 'TalhoOrderPage',

  data () {
    return {
      order: NULL_VALUE,
    }
  },

  async created (): Promise<void> {
    const searchParams = new URLSearchParams(location.search)

    const transactionId = searchParams.get('order')

    if (!transactionId) {
      location.href = buildURL('/', {
        [REASON_PARAM]: 'trasactionid_not_found',
      })

      return
    }

    const response = await this.getOrder(transactionId)

    if (!response.succeeded) {
      location.href = buildURL('/', {
        [REASON_PARAM]: 'order_not_found',
      })

      return
    }

    this.order = response.data

    isPageLoading(false)

    this.logPurchase(transactionId, 3)
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

    async logPurchase (orderId: string, retry: number = 0): Promise<void> {
      const defaultErrorMessage = 'Falha ao registrar log do pedido'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/log/purchase`, {
          ...buildRequestOptions(getTrackingCookies(), 'POST'),
          keepalive: true,
          priority: 'high',
          body: stringify<PurchaseTrackingParams>({
            transactionid: orderId,
          }),
        })

        if (!response.ok) {
          return retry > 0
            ? this.logPurchase(orderId, retry - 1)
            : console.warn(defaultErrorMessage)
        }

        response.json().then(() => console.info('Log do pedido finalizado'))
      } catch (e) {
        console.warn(defaultErrorMessage)
      }
    }
  },

  computed: {
    isPIXPayment (): boolean {
      return this.order?.payment_method === 'pix'
    },

    hasPIXDiscount (): boolean {
      const percentualDiscount = this.order?.pix_discount_percentual ?? 0

      return percentualDiscount > 0
    },

    getDiscountPIXPrice (): string {
      return BRLFormatter.format((this.order?.pix_discount_price ?? 0) / 100 * -1)
    },

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
      const price = this.order?.subtotal ?? 0

      return BRLFormatter.format(price / 100)
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
      return BRLFormatter.format(((this.order?.discount ?? 0) / 100) * -1)
    },

    getParsedProducts (): ParsedProduct[] {
      const {
        order_items = []
      } = this.order ?? {}

      return order_items.map(({ name, product_id, unit_price, quantity, image  }) => ({
        imageStyle: `background-image: url('${image}');`,
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

    hasFreeShippingByCartPrice (): boolean {
      return this.order?.delivery.has_freeship_by_cart_price ?? false
    },
  },
} satisfies {
  name: string,
  // setup: () => void,
  created: () => Promise<void>;
  // mounted: () => void;
  data: () => TalhoOrderPageData,
  methods: TalhoOrderPageMethods,
  computed: TalhoOrderPageComputedDefinition,
} & ThisType<TalhoOrderPageContext>)

TalhoOrderPage.mount(querySelector('#orderapp'))

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
