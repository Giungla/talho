
import type {
  ResponsePattern
} from '../global'

import {
  OrderManagementItem,
  OrderManagementListData,
  OrderManagementItemParsed,
  OrderManagementListMethods,
  OrderManagementListContext,
  AvailablePrepareFilterNames,
  RenderableOrderFilter,
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
      activeFilter: NULL_VALUE,
      availableFilters: [
        {
          label: 'Em preparação',
          name: 'PREPARING',
        },

        {
          label: 'Preparado',
          name: 'PREPARED',
        },

        {
          label: 'Pronto para entrega',
          name: 'DELIVERYREADY',
        },
      ],
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

    applyFilter (name: AvailablePrepareFilterNames): void {
      if (this.activeFilter === name) return

      this.activeFilter = name
    },

    getFilterByToken (token: AvailablePrepareFilterNames): RenderableOrderFilter | undefined {
      return this.getAppliableFilters.find(({ name }) => name === token) as RenderableOrderFilter | undefined
    },
  },

  computed: {
    hasOrders (): boolean {
      const { orders } = this

      return Array.isArray(orders) && orders.length > 0
    },

    getParsedOrders (): OrderManagementItemParsed[] {
      if (!this.hasOrders) return []

      const {
        orders,
        activeFilter,
      } = this

      // @ts-ignore
      const filteredOrders: OrderManagementItem[] = activeFilter !== null
        // @ts-ignore
        ? orders.filter(({ prepare_status }) => prepare_status === activeFilter)
        : orders

      return filteredOrders.map(({ total, transaction_id, created_at, order_items, prepare_status, ...order }) => {
        const delivery_status = prepare_status !== null && this.getFilterByToken(prepare_status)

        return {
          ...order,
          created_date: timestampDate(created_at),
          items_count: order_items,
          price: BRLFormatter.format(total / 100),
          url: `/adm/ficha-de-pedido?transactionid=${transaction_id}`,
          ...(delivery_status && {
            delivery_status,
          }),
        }
      }) ?? []
    },

    getAppliableFilters (): RenderableOrderFilter[] {
      if (!this.hasOrders) return []

      const { getAvailableStatus } = this

      return this.availableFilters.reduce((filters, filter) => {
        if (!getAvailableStatus.includes(filter.name)) return filters

        return filters.concat({
          ...filter,
          className: filter.name.toLowerCase(),
        })
      }, [] as RenderableOrderFilter[])
    },

    getAvailableStatus (): AvailablePrepareFilterNames[] {
      if (!this.hasOrders) return []

      const status: AvailablePrepareFilterNames[] = []

      // @ts-ignore
      for (const { prepare_status } of this.orders) {
        if (!prepare_status || status.includes(prepare_status)) continue

        status.push(prepare_status)
      }

      return status
    },
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
