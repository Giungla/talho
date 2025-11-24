
import {
  type IPaginateSchema,
  type ResponsePattern,
} from '../global'

import {
  type OrderManagementItem,
  type OrderManagementListData,
  type OrderManagementItemParsed,
  type OrderManagementListMethods,
  type OrderManagementListContext,
  type RenderableOrderFilter,
  type OrderManagementListComputedDefinition,
} from '../types/order-management-list'

import {
  type OrderStatusKeys,
  type OrderPrepareStatusKeys,
  OrderStatus,
  OrderPrepareStatus,
} from '../types/order'

const {
  createApp,
} = Vue

import {
  NULL_VALUE,
  BRLFormatter,
  XANO_BASE_URL,
  pushIf,
  isStrictEquals,
  timestampDate,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  includes, scrollIntoView, querySelector,
} from '../utils'

const OrderManagementApp = createApp({
  name: 'OrderManagementApp',

  async created (): Promise<void> {
    // const response = await this.getOrders()
    //
    // if (!response.succeeded) return
    //
    // this.orders = response.data
    this.handlePaginate(1)
  },

  data () {
    return {
      startDate: NULL_VALUE,
      orders: NULL_VALUE,
      activeFilter: NULL_VALUE,
      availableFilters: [
        {
          label: 'Não iniciado',
          name: OrderPrepareStatus.NOTSTARTED,
        },

        {
          label: 'Em preparação',
          name: OrderPrepareStatus.PREPARING,
        },

        {
          label: 'Preparado',
          name: OrderPrepareStatus.PREPARED,
        },

        {
          label: 'Pronto para entrega',
          name: OrderPrepareStatus.DELIVERYREADY,
        },

        {
          label: 'Pedido entregue',
          name: OrderStatus.COMPLETED,
        }
      ],
    }
  },

  methods: {
    async getOrders (page: number = 1): Promise<ResponsePattern<IPaginateSchema<OrderManagementItem>>> {
      const defaultErrorMessage = 'Houve uma falha com a busca de pedidos'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:YomXpzWs/order/list?page=${page}`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const orders: IPaginateSchema<OrderManagementItem> = await response.json()

        return postSuccessResponse.call(response, orders)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    applyFilter (name: OrderStatusKeys | OrderPrepareStatusKeys): void {
      if (isStrictEquals(this.activeFilter, name)) return

      this.activeFilter = name
    },

    getFilterByToken (token: OrderStatusKeys | OrderPrepareStatusKeys): RenderableOrderFilter | undefined {
      return this.getAppliableFilters.find(({ name }) => isStrictEquals(name, token)) as RenderableOrderFilter | undefined
    },

    async handlePaginate (page: number): Promise<void> {
      const response = await this.getOrders(page)

      if (!response.succeeded) return

      this.orders = response.data

      scrollIntoView(orderManagementList, {
        block: 'start',
        behavior: 'smooth',
      })
    },
  },

  computed: {
    hasOrders (): boolean {
      const { orders } = this

      const itemsReceived = orders?.itemsReceived

      return typeof itemsReceived === 'number' && itemsReceived > 0
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
        ? orders.items.filter(({ prepare_status, status, }) => {
          switch (activeFilter) {
            case OrderStatus.ASSIGNING_DRIVER:
            case OrderStatus.CANCELED:
            case OrderStatus.ON_GOING:
            case OrderStatus.PICKED_UP:
            case OrderStatus.REJECTED:
            case OrderStatus.EXPIRED:
            case OrderStatus.COMPLETED:
              return isStrictEquals(status, activeFilter)
            case OrderPrepareStatus.NOTSTARTED:
            case OrderPrepareStatus.PREPARING:
            case OrderPrepareStatus.PREPARED:
            case OrderPrepareStatus.DELIVERYREADY:
              return !isStrictEquals(status, OrderStatus.COMPLETED) && isStrictEquals(prepare_status, activeFilter)
          }
        })
        // @ts-ignore
        : orders.items

      return filteredOrders.map(({ total, transaction_id, created_at, order_items, prepare_status, status, ...order }) => {
        const filterStatus = status === OrderStatus.COMPLETED
          ? status
          : prepare_status

        return {
          ...order,
          created_date: timestampDate(created_at),
          items_count: order_items,
          price: BRLFormatter.format(total / 100),
          url: `/adm/ficha-de-pedido?transactionid=${transaction_id}`,
          ...(filterStatus && {
            delivery_status: this.getFilterByToken(filterStatus),
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
          className: filter.name?.toLowerCase(),
          name: filter.name,
        })
      }, [] as RenderableOrderFilter[])
    },

    getAvailableStatus (): (OrderStatusKeys | OrderPrepareStatusKeys)[] {
      if (!this.hasOrders) return []

      const statusList: (OrderStatusKeys | OrderPrepareStatusKeys)[] = []

      // @ts-ignore
      for (const { prepare_status, status } of this.orders?.items) {
        // pushIf(prepare_status && !statusList.includes(prepare_status), statusList, prepare_status)
        pushIf(!statusList.includes(prepare_status), statusList, prepare_status)

        pushIf(status && !statusList.includes(status), statusList, status)
      }

      return statusList
    },

    hasPrevPage (): boolean {
      return this.orders?.prevPage !== NULL_VALUE
    },

    hasNextPage (): boolean {
      return this.orders?.nextPage !== NULL_VALUE
    },

    hasLastPage (): boolean {
      const orders = this.orders

      return includes([
        orders?.nextPage,
        orders?.curPage,
      ], orders?.pageTotal)
    },

    hasFirstPage (): boolean {
      const curPage = this.orders?.curPage

      return typeof curPage === 'number' && curPage > 2
    },
  },
} satisfies {
  name: string;
  created: () => Promise<void>;
  data: () => OrderManagementListData;
  methods: OrderManagementListMethods;
  computed: OrderManagementListComputedDefinition;
} & ThisType<OrderManagementListContext>)

const orderManagementList = querySelector('#order-management-list')

OrderManagementApp.mount(orderManagementList)

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
