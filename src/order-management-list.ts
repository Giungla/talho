
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
  OrderManagementListComputedDefinition, AvailableStatusFilterNames,
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
  buildRequestOptions, pushIf,
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

        {
          label: 'Entregue',
          name: 'COMPLETED',
        }
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

    applyFilter (name: AvailablePrepareFilterNames | AvailableStatusFilterNames): void {
      if (this.activeFilter === name) return

      this.activeFilter = name
    },

    getFilterByToken (token: AvailablePrepareFilterNames | AvailableStatusFilterNames): RenderableOrderFilter | undefined {
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
        ? orders.filter(({ prepare_status, status, }) => prepare_status === activeFilter || status === activeFilter)
        : orders

      return filteredOrders.map(({ total, transaction_id, created_at, order_items, prepare_status, status, ...order }) => {
        const first_valid_status = [status, prepare_status].find(Boolean)

        return {
          ...order,
          created_date: timestampDate(created_at),
          items_count: order_items,
          price: BRLFormatter.format(total / 100),
          url: `/adm/ficha-de-pedido?transactionid=${transaction_id}`,
          ...(first_valid_status && {
            delivery_status: this.getFilterByToken(first_valid_status),
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

    getAvailableStatus (): (AvailablePrepareFilterNames | AvailableStatusFilterNames)[] {
      if (!this.hasOrders) return []

      const statusList: (AvailablePrepareFilterNames | AvailableStatusFilterNames)[] = []

      // @ts-ignore
      for (const { prepare_status, status } of this.orders) {
        pushIf(prepare_status && !statusList.includes(prepare_status), statusList, prepare_status)

        pushIf(status && !statusList.includes(status), statusList, status)
      }

      return statusList
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
