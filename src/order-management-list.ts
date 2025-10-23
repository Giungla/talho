
import type {
  ResponsePattern
} from '../global'

import {
  OrderManagementItem,
  OrderManagementListData,
  OrderManagementItemParsed,
  OrderManagementListMethods,
  OrderManagementListContext,
  OrderManagementListComputedDefinition,
} from '../types/order-management-list'

const {
  createApp,
} = Vue

import {
  NULL_VALUE,
  BRLFormatter,
  XANO_BASE_URL,
  timestampDate,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils'

const OrderManagementApp = createApp({
  name: 'OrderManagementApp',

  async created (): Promise<void> {
    const response = await this.getOrders()

    if (!response.succeeded) return

    this.orders = response.data
  },

  data () {
    return {
      orders: NULL_VALUE,
    }
  },

  methods: {
    async getOrders (): Promise<ResponsePattern<OrderManagementItem[]>> {
      const defaultErrorMessage = 'Houve uma falha com a busca de pedidos'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:YomXpzWs/order/list`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const orders: OrderManagementItem[] = await response.json()

        return postSuccessResponse.call(response, orders)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },
  },

  computed: {
    hasOrders (): this is { orders: OrderManagementItem[] } {
      const { orders } = this

      return Array.isArray(orders) && orders.length > 0
    },

    getParsedOrders (): OrderManagementItemParsed[] {
      if (!this.hasOrders) return []

      return this.orders?.map(({ total, transaction_id, created_at, order_items, ...order }) => {
        return {
          ...order,
          created_date: timestampDate(created_at),
          items_count: order_items,
          price: BRLFormatter.format(total / 100),
          url: `/adm/ficha-de-pedido?transactionid=${transaction_id}`,
        }
      }) ?? []
    }
  },
} satisfies {
  name: string;
  created: () => Promise<void>;
  data: () => OrderManagementListData;
  methods: OrderManagementListMethods;
  computed: OrderManagementListComputedDefinition;
} & ThisType<OrderManagementListContext>)

OrderManagementApp.mount('#order-management-list')

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
