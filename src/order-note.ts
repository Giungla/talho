
import {
  type Order,
  type OrderNoteData,
  type OrderNoteContext,
  type OrderNoteMethods,
  type OrderNoteComputedDefinition,
  type OrderCompany,
  type OrderCustomer,
  type OrderItem,
  type FinalCOrder,
  type PixDiscount,
  type PatchPrepareStatusParams,
  type AvailableFilterChangeOptions,
  type PatchPreparedStatusResponse,
} from '../types/order-note'

import {
  type Nullable,
  type ResponsePattern,
  type ResponsePatternCallback,
  type FunctionSucceededPattern,
} from '../global'

import {
  OrderStatus,
  OrderPrepareStatus,
} from '../types/order'

import {
  type AvailableFilterStatus,
} from '../types/order-management-list'

const {
  createApp,
} = Vue

import {
  NULL_VALUE,
  isNull,
  stringify,
  objectSize,
} from '../utils/dom'

import {
  XANO_BASE_URL,
} from '../utils/consts'

import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  EnumHttpMethods,
} from '../types/http'

import {
  push,
  pushIf,
} from '../utils/array'

const ORDER_IDENTIFIER = 'transactionid'

const PIX_PAYMENT_METHOD = 'pix'
const CREDITCARD_PAYMENT_METHOD = 'creditcard'

const paymentLabelMap = {
  [PIX_PAYMENT_METHOD]: 'PIX',
  [CREDITCARD_PAYMENT_METHOD]: 'Cartão de crédito',
}

const XANO_ORDER_NOTE_BASE_PATH = `${XANO_BASE_URL}/api:YomXpzWs`

function buildAvailableFilterOption (filterKey: AvailableFilterStatus): AvailableFilterChangeOptions {
  return {
    filterKey,
    label: stateLabels[filterKey],
  }
}

const stateLabels: Record<AvailableFilterStatus, string> = ({
  [OrderPrepareStatus.NOTSTARTED]: 'Não iniciado',
  [OrderPrepareStatus.PREPARING]: 'Pedido em preparação',
  [OrderPrepareStatus.PREPARED]: 'Pedido preparado',
  [OrderPrepareStatus.DELIVERYREADY]: 'Pedido pronto para entrega',
  [OrderStatus.CANCELED]: 'Pedido em análise',
  [OrderStatus.COMPLETED]: 'Pedido entregue',
}) as const

const TalhoCheckoutApp = createApp({
  name: 'TalhoOrderNoteApp',

  data (): OrderNoteData {
    return {
      order: NULL_VALUE,
      messageTimer: NULL_VALUE,
      prepareMessage: NULL_VALUE,
      prepare_status: {
        selected: OrderPrepareStatus.NOTSTARTED,
        current: NULL_VALUE,
      },
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

    this.syncOrderStatuses()
  },

  methods: {
    async getOrder <T extends Order> (transactionid: string): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Não foi possível encontrar o pedido'

      try {
        const response = await fetch(`${XANO_ORDER_NOTE_BASE_PATH}/order/delivery-prepare?${ORDER_IDENTIFIER}=${transactionid}`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const order: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, order)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async handleOrderStatus (): Promise<void> {
      if (this.messageTimer) {
        this.clearMessage()
      }

      const order = this.order

      const { prepare_status: localPrepareStatus } = this

      if (!order || !localPrepareStatus) return

      const response = await this.setOrderStatus(order.order.number, localPrepareStatus.selected)

      if (!response.succeeded) {
        this.prepare_status.current  = this.finalOrderStatus
        this.prepare_status.selected = this.finalOrderStatus

        this.prepareMessage = response.message

        this.messageTimer = setTimeout(this.clearMessage, 5000)

        return
      }

      const {
        status,
        prepare_status,
      } = response.data

      this.order = {
        ...order,
        order: {
          ...order.order,
          status,
          prepare_status,
        },
      }

      this.prepare_status.current = this.finalOrderStatus

      this.prepareMessage = 'Modificado com sucesso'

      this.messageTimer = setTimeout(this.clearMessage, 5000)
    },

    async setOrderStatus <T extends PatchPreparedStatusResponse> (order_id: number, prepare_status: AvailableFilterStatus): Promise<ResponsePattern<T>> {
      const defaultErrorMessage = 'Não foi possível alterar o status de preparação'

      try {
        const response = await fetch(`${XANO_ORDER_NOTE_BASE_PATH}/order/delivery-status`, {
          ...buildRequestOptions([], EnumHttpMethods.PATCH),
          body: stringify<PatchPrepareStatusParams>({
            order_id,
            prepare_status,
          })
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const order: T = await response.json()

        return postSuccessResponse.call<Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>>(response, order)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    printPage (): void {
      window.print()
    },

    clearMessage (): void {
      if (!isNull(this.messageTimer)) {
        clearTimeout(this.messageTimer)

        this.messageTimer = NULL_VALUE
      }

      this.prepareMessage = NULL_VALUE
    },

    syncOrderStatuses (): void {
      const finalOrderStatus = this.finalOrderStatus

      this.prepare_status = {
        current: finalOrderStatus,
        selected: finalOrderStatus,
      }
    },
  },

  computed: {
    finalOrderStatus: {
      get (): AvailableFilterStatus {
        const order = this.order?.order ?? NULL_VALUE

        if (isNull(order)) return OrderPrepareStatus.NOTSTARTED

        const {
          status,
          prepare_status,
        } = order

        return isNull(status)
          ? prepare_status
          : status
      },

      set (prepare_status: AvailableFilterStatus): void {
        this.prepare_status.selected = prepare_status
      }
    },

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
        has_free_shipping,
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
        has_free_shipping,
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

    getAvailableFilterChangeOptions (): AvailableFilterChangeOptions[] {
      const order = this.order

      if (!order) return []

      const {
        status,
        prepare_status,
      } = order.order

      const options: AvailableFilterStatus[] = [
        // O item abaixo será adicionado condicionalmente à lista
        // OrderPrepareStatus.NOTSTARTED
        OrderPrepareStatus.PREPARING,
        OrderPrepareStatus.PREPARED,
        OrderPrepareStatus.DELIVERYREADY,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELED,
      ]

      const response: AvailableFilterChangeOptions[] = []

      // Inclui condicionalmente a opção "Não iniciado" na lista de forma que o pedido possa ser resetado uma vez que for cancelado ou quando o pedido ainda não tiver sido iniciado
      pushIf(
        (!isNull(status) && status === OrderStatus.CANCELED) || prepare_status === OrderPrepareStatus.NOTSTARTED,
        response,
        buildAvailableFilterOption(OrderPrepareStatus.NOTSTARTED)
      )

      // Inclui as opções "Pedido em preparação", "Pedido preparado", "Pedido pronto para entrega", "Entregue" e "Cancelado" por padrão
      for (const option of options) {
        push(response, buildAvailableFilterOption(option))
      }

      return response
    },
  },

  // watch: {
  // },
  //
  // directives: {
  // },
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
