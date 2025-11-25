
import {
  type Nullable,
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
  type OrderManagementFilter,
  type AvailableFilterStatus,
} from '../types/order-management-list'

import {
  type OrderStatusKeys,
  type OrderPrepareStatusKeys,
  OrderStatus,
  OrderPrepareStatus,
} from '../types/order'

const {
  nextTick,
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
  includes,
  scrollIntoView,
  querySelector,
  bindURL,
  isNull,
} from '../utils'

const OrderManagementApp = createApp({
  name: 'OrderManagementApp',

  async created (): Promise<void> {
    // const response = await this.getOrders()
    //
    // if (!response.succeeded) return
    //
    // this.orders = response.data
    this.refreshURLState = bindURL<OrderManagementFilter>(
      'filter',
      () => this.filter,
      (filter: OrderManagementFilter) => this.filter = filter,
    )

    this.refresh(false)
  },

  data () {
    return {
      startDate: NULL_VALUE,
      orders: NULL_VALUE,
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
      refreshURLState: NULL_VALUE,
      filter: {
        page: 1,
        status: NULL_VALUE,
      },
    }
  },

  methods: {
    async getOrders (): Promise<ResponsePattern<IPaginateSchema<OrderManagementItem>>> {
      const defaultErrorMessage = 'Houve uma falha com a busca de pedidos'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:YomXpzWs/order/list${this.getFilteringQueryParams}`, {
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

    getFilterByToken (token: OrderStatusKeys | OrderPrepareStatusKeys): RenderableOrderFilter | undefined {
      return this.getAppliableFilters.find(({ name }) => isStrictEquals(name, token)) as RenderableOrderFilter | undefined
    },

    async refresh (shouldUpdateURL: boolean = true): Promise<void> {
      const response = await this.getOrders()

      if (!response.succeeded) return

      this.orders = response.data

      await nextTick(() => {
        scrollIntoView(orderManagementList, {
          block: 'start',
          behavior: 'smooth',
        })

        if (!shouldUpdateURL) return

        this.refreshURLState?.()
      })
    },

    async handlePaginate (page: number): Promise<void> {
      this.filter.page = page

      this.refresh()
    },

    async handleStatus (status: Nullable<AvailableFilterStatus>): Promise<void> {
      this.filter = {
        ...this.filter,
        page: 1,
        status,
      }

      this.refresh()
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

      // @ts-ignore
      return this.orders?.items.map(({ total, transaction_id, created_at, order_items, prepare_status, status, ...order }) => {
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
      })
    },

    getAppliableFilters (): RenderableOrderFilter[] {
      return this.availableFilters.map<RenderableOrderFilter>(({ name, ...filter}) => {
        return {
          ...filter,
          name,
          className: name?.toLowerCase(),
        }
      }, [] as RenderableOrderFilter[])
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

    getFilteringQueryParams (): string {
      const filters = this.filter

      const queryParams: string[] = []

      for (const [key, value] of Object.entries(filters)) {
        switch (key) {
          case 'page':
            pushIf(true, queryParams, [key, value].join('='))
            break
          case 'status':
            pushIf(!isNull(value), queryParams, [key, value].join('='))
            break
        }
      }

      return '?' +  queryParams.join('&')
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
