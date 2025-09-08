
import {
  Order,
  OrderNoteData,
  OrderNoteContext,
  OrderNoteMethods,
  OrderNoteComputedDefinition,
  OrderCompany,
  OrderCustomer,
  OrderItem,
  FinalCOrder, PixDiscount,
} from '../types/order-note'

import type {
  Nullable,
  ResponsePattern
} from '../global'

const {
  createApp,
} = Vue

import {
  NULL_VALUE,
  XANO_BASE_URL,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  objectSize, EMPTY_STRING,
} from '../utils'

const ORDER_IDENTIFIER = 'transactionid'

const PIX_PAYMENT_METHOD = 'pix'
const CREDITCARD_PAYMENT_METHOD = 'creditcard'

const paymentLabelMap = {
  [PIX_PAYMENT_METHOD]: 'PIX',
  [CREDITCARD_PAYMENT_METHOD]: 'Cartão de crédito',
}

const TalhoCheckoutApp = createApp({
  name: 'TalhoOrderNoteApp',

  setup () {
    return {
    }
  },

  data () {
    return {
      order: NULL_VALUE,
    }
  },

  async created (): Promise<void> {
    const searchParams = new URLSearchParams(location.search)

    const transactionId = searchParams.get(ORDER_IDENTIFIER)

    if (!transactionId) {
      console.warn(`[order-note] '${ORDER_IDENTIFIER}' was not provided`)

      return
    }

    const response = await this.getOrder(transactionId)

    if (!response.succeeded) {
      return console.warn(`[order-note] '${ORDER_IDENTIFIER}' provided was not found`)
    }

    this.order = response.data
  },

  methods: {
    async getOrder (transactionid: string): Promise<ResponsePattern<Order>> {
      const defaultErrorMessage = 'Não foi possível encontrar o pedido'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:jiIoKYhH/order/delivery-prepare?${ORDER_IDENTIFIER}=${transactionid}`, {
          ...buildRequestOptions()
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse(error?.message ?? defaultErrorMessage)
        }

        const order: Order = await response.json()

        return postSuccessResponse(order)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },
  },

  computed: {
    company (): Nullable<OrderCompany> {
      return this.order?.company ?? NULL_VALUE
    },

    customer (): Nullable<OrderCustomer> {
      return this.order?.customer ?? NULL_VALUE
    },

    items (): Nullable<OrderItem[]> {
      return this.order?.items ?? NULL_VALUE
    },

    itemsCount (): number {
      return objectSize(this.items ?? [])
    },

    cOrder (): Nullable<FinalCOrder> {
      if (!this.order) return NULL_VALUE

      const {
        date,
        time,
        total,
        number,
        shipping,
        subtotal,
        discounts,
        change_for,
        notes_short,
        observations,
        payment_method,
      } = this.order.order

      return {
        date,
        time,
        total,
        number,
        shipping,
        subtotal,
        discounts,
        change_for,
        notes_short,
        observations,
        payment_method: paymentLabelMap?.[payment_method],
      }
    },

    deliveryDate (): Nullable<string> {
      if (!this.order) return NULL_VALUE

      const { order } = this.order

      return `${order.delivery_date} ${order.delivery_hour}`
    },

    priorityTax (): Nullable<string> {
      const order = this.order?.order

      if (!order) return NULL_VALUE

      return order.has_priority
        ? order?.priority_price
        : NULL_VALUE
    },

    subsidyDiscount (): Nullable<string> {
      const order = this.order?.order

      if (!order) return NULL_VALUE

      return order.has_subsidy
        ? order?.subsidy_price
        : NULL_VALUE
    },

    pixDiscount (): Nullable<PixDiscount> {
      const order = this.order?.order

      if (!order || order.payment_method !== PIX_PAYMENT_METHOD) return NULL_VALUE

      return {
        discountPrice: order.pix_discount_price,
        discountPercentual: order.pix_discount_percentual,
      }
    },

    hasPaid (): boolean {
      return this.order?.order.paid ?? false
    },

    deliveredAt (): Nullable<string> {
      return this.order?.order.delivered_at ?? NULL_VALUE
    },
  },

  watch: {
  },

  directives: {
  },
} satisfies ({
  name: string;
  created: () => Promise<void>;
  data: () => OrderNoteData;
  // setup: () => TalhoCheckoutAppSetup;
  methods: OrderNoteMethods;
  computed: OrderNoteComputedDefinition;
  // watch: TalhoCheckoutAppWatch;
} & ThisType<OrderNoteContext>))

TalhoCheckoutApp.mount('#note-order')

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
