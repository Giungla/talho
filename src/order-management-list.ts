
import {
  type Nullable,
  type ResponsePattern,
  type ResponsePatternCallback,
  type FunctionSucceededPattern,
  type IPaginatedSchemaAddon,
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
  type OrderManagementDateLimitObject,
  type OrderManagementDateLimits, OrderFilter,
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
  isNull,
  attachEvent,
  querySelector,
  scrollIntoView,
  objectSize,
  splitText,
} from '../utils/dom'

import {
  SLASH_STRING,
  XANO_BASE_URL,
} from '../utils/consts'

import {
  BRLFormatter,
} from '../utils/mask'

import {
  pushIf,
  includes,
} from '../utils/array'

import {
  formatDate,
  timestampDate,
} from '../utils/dates'

import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  bindURL,
} from '../utils/url-stateful'

import {
  eventMap,
  cleanupDirective,
} from '../utils/vue'

import {
  type Directive,
} from 'vue'

function isInvalidDate (date: Nullable<string>): date is null {
  return !date || objectSize(date) === 0
}

function clearDateGetter (date: Nullable<string>): Nullable<string> {
  return isInvalidDate(date)
    ? NULL_VALUE
    : formatDate(date, dateTimeFormatOptions)
}

function handleDateSetter (date: Nullable<string>): Nullable<string> {
  return isInvalidDate(date)
    ? NULL_VALUE
    : date
}

const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC',
}

function getSpecificLimitDate (timestamp: number): Nullable<string> {
  const timeDifference = 60 * 60 * 3 * 1000

  const date = new Date(timestamp - timeDifference).toISOString()

  return splitText(date, 'T').at(0) ?? NULL_VALUE
}

const OrderManagementApp = createApp({
  name: 'OrderManagementApp',

  async created (): Promise<void> {
    this.refreshURLState = bindURL<OrderManagementFilter>(
      'filter',
      () => this.filter,
      (filter: OrderManagementFilter) => this.filter = filter,
    )

    this.refresh(false)
      .then(this.resetFilterDates)
      .then(() => {
        // reset dates each 30min and refetch orders
        setTimeout(() => {
          location.href = location.hostname + location.pathname
        }, 30 * 60 * 1000)
      })
  },

  data () {
    return {
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
        },

        {
          label: 'Pedido em análise',
          name: OrderStatus.CANCELED,
        }
      ],
      refreshURLState: NULL_VALUE,
      filter: {
        page: 1,
        status: NULL_VALUE,
        endDate: NULL_VALUE,
        startDate: NULL_VALUE,
      },
    }
  },

  methods: ({
    async getOrders <T extends IPaginatedSchemaAddon<OrderManagementItem, OrderManagementDateLimitObject>> (): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Houve uma falha com a busca de pedidos'

      try {
        const response = await fetch(`${XANO_BASE_URL}/api:YomXpzWs/order/list${this.getFilteringQueryParams}`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const orders: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, orders)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    getFilterByToken (token: OrderStatusKeys | OrderPrepareStatusKeys): RenderableOrderFilter | undefined {
      return this.getAppliableFilters.find<RenderableOrderFilter>((filter: OrderFilter) => filter.name === token)
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

    resetFilterDates (): void {
      const {
        newest,
        oldest,
      } = this.getLimits

      this.filter.startDate ??= oldest
      this.filter.endDate   ??= newest
    },

    handleResetDates (): void {
      this.filter = {
        ...this.filter,
        page: 1,
        endDate: NULL_VALUE,
        startDate: NULL_VALUE,
      }

      this.resetFilterDates()

      this.refresh()
    },
  } satisfies OrderManagementListMethods & ThisType<OrderManagementListContext>),

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
        const filterStatus = includes([OrderStatus.COMPLETED, OrderStatus.CANCELED], status as string)
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
          delivery_date: splitText(order.date, '-')
            .reverse()
            .join(SLASH_STRING)
            .concat(` às ${order.hour}hrs`),
        } satisfies OrderManagementItemParsed
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
      return !isNull(this.orders?.prevPage)
    },

    hasNextPage (): boolean {
      return !isNull(this.orders?.nextPage)
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
          case 'endDate':
            pushIf(!isInvalidDate(value), queryParams, ['final_date', value].join('='))
            break
          case 'startDate':
            pushIf(!isInvalidDate(value), queryParams, ['start_date', value].join('='))
        }
      }

      return '?' +  queryParams.join('&')
    },

    endDate: {
      get (): Nullable<string> {
        return clearDateGetter(this.filter.endDate)
      },

      set (date: Nullable<string>): void {
        this.filter.endDate = handleDateSetter(date)

        const { endDate } = this.filter

        if (isNull(endDate)) {
          this.filter.endDate = this.getLimits.newest
        }

        if (!this.hasReversedDates) {
          this.handlePaginate(1)

          return
        }

        this.filter.startDate = this.getLimits.oldest
      },
    },

    startDate: {
      get (): Nullable<string> {
        return clearDateGetter(this.filter.startDate)
      },

      set (date: Nullable<string>): void {
        this.filter.startDate = handleDateSetter(date)

        const { startDate } = this.filter

        if (isNull(startDate)) {
          this.filter.startDate = this.getLimits.oldest
        }

        if (!this.hasReversedDates) {
          this.handlePaginate(1)

          return
        }

        this.filter.endDate = this.getLimits.newest
      },
    },

    hasReversedDates (): boolean {
      const {
        endDate,
        startDate,
      } = this.filter

      if (isInvalidDate(endDate) || isInvalidDate(startDate)) return false

      const finalDate = new Date(`${endDate}T23:59:59`)
      const initialDate = new Date(`${startDate}T00:00:00`)

      return initialDate.getTime() > finalDate.getTime()
    },

    getLimits (): OrderManagementDateLimits<Nullable<string>> {
      const orders = this.orders

      if (isNull(orders)) {
        return {
          oldest: NULL_VALUE,
          newest: NULL_VALUE,
        }
      }

      const {
        oldest,
        newest,
      } = orders.dateLimits

      return {
        oldest: getSpecificLimitDate(oldest),
        newest: getSpecificLimitDate(newest),
      }
    },
  },

  directives: {
    showPickerOnFocus: {
      mounted (el: HTMLInputElement) {
        const removerFn = attachEvent(el, 'focus', () => {
          try {
            el.showPicker()
          } catch (e) {}
        })

        eventMap.set(el, removerFn)
      },

      unmounted: cleanupDirective,
    },
  },
} satisfies {
  name: string;
  created: () => Promise<void>;
  data: () => OrderManagementListData;
  methods: OrderManagementListMethods;
  computed: OrderManagementListComputedDefinition;
  directives: Record<string, Directive>,
} & ThisType<OrderManagementListContext>)

const orderManagementList = querySelector('#order-management-list')

OrderManagementApp.mount(orderManagementList as Element)

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
  if (e.persisted) window.location.reload()
})
