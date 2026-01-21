
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
  type ResponsePatternCallback,
  type FunctionSucceededPattern,
} from '../global'

// import {
//   type PurchaseTrackingParams,
// } from '../types/tracking'
//
// import {
//   getTrackingCookies,
//   clearTrackingCookies,
//   getMetaTrackingCookies,
// } from '../utils/adTracking'

import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  NULL_VALUE,
  isNull,
  buildURL,
  // stringify,
  isPageLoading,
} from '../utils/dom'

import {
  DASH_STRING,
  SLASH_STRING,
  XANO_BASE_URL,
} from '../utils/consts'

import {
  BRLFormatter,
} from '../utils/mask'

const {
  createApp,
} = window.Vue

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
      location.href = buildURL(SLASH_STRING, {
        [REASON_PARAM]: 'trasactionid_not_found',
      })

      return
    }

    const response = await this.getOrder(transactionId)

    if (!response.succeeded) {
      location.href = buildURL(SLASH_STRING, {
        [REASON_PARAM]: 'order_not_found',
      })

      return
    }

    this.order = response.data

    isPageLoading(false)

    // this.logPurchase(transactionId, 3)
  },

  methods: {
    async getOrder <T extends OrderData> (orderId: string): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Falha ao capturar o pedido'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:5lp3Lw8X/order-details/${orderId}`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: T = await response.json()

        return postSuccessResponse.call<
          Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>
        >(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    // async logPurchase (orderId: string, retry: number = 0): Promise<void> {
    //   const defaultErrorMessage = 'Falha ao registrar log do pedido'
    //
    //   try {
    //     const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/log/purchase`, {
    //       ...buildRequestOptions([...getTrackingCookies(), ...getMetaTrackingCookies()], 'POST'),
    //       keepalive: true,
    //       priority: 'high',
    //       body: stringify<PurchaseTrackingParams>({
    //         transactionid: orderId,
    //       }),
    //     })
    //
    //     if (!response.ok) {
    //       return retry > 0
    //         ? this.logPurchase(orderId, retry - 1)
    //         : console.warn(defaultErrorMessage)
    //     }
    //
    //     response.json().then(() => console.info('Log do pedido finalizado'))
    //   } catch (e) {
    //     console.warn(defaultErrorMessage)
    //   } finally {
    //     clearTrackingCookies()
    //   }
    // }
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
      return this.order?.name ?? DASH_STRING
    },

    email (): string {
      return this.order?.email ?? DASH_STRING
    },

    cpf (): string {
      return this.order?.cpf_cnpj ?? DASH_STRING
    },

    phone (): string {
      return this.order?.phone ?? DASH_STRING
    },

    shipping (): OrderShippingAddress {
      const {
        number = DASH_STRING,
        cep = DASH_STRING,
        address = DASH_STRING,
        state = DASH_STRING,
        city = DASH_STRING,
        complement = DASH_STRING,
        neighborhood = DASH_STRING,
        user_name = DASH_STRING,
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
        cep          = DASH_STRING,
        address      = DASH_STRING,
        number       = DASH_STRING,
        complement   = DASH_STRING,
        neighborhood = DASH_STRING,
        city         = DASH_STRING,
        state        = DASH_STRING,
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
      const { order } = this

      return BRLFormatter.format(
        isNull(order)
          ? 0
          : order.subtotal / 100
      )
    },

    getOrderPriceFormatted (): string {
      const { order } = this

      return BRLFormatter.format(
        isNull(order)
          ? 0
          : order.total / 100
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

TalhoOrderPage.mount('#orderapp')

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
