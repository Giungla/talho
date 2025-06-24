
import {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  ISplitCookieObject,
  ResponsePattern,
} from '../global'

import {
  Order,
  OrderGetters,
  OrderProxy,
  Orders,
  OrdersProperties
} from '../types/user-orders'

(function () {
  const NULL_VALUE = null
  const COOKIE_SEPARATOR = '; '
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const COOKIE_NAME = '__Host-Talho-AuthToken'
  const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io'

  function splitText (value: string, separator: string | RegExp, limit?: number): string[] {
    return value.split(separator, limit)
  }

  function getCookie (name: string): string | false {
    const selectedCookie = splitText(document.cookie, COOKIE_SEPARATOR).find(cookie => {
      const { name: cookieName } = splitCookie(cookie)

      return cookieName === name
    })

    return selectedCookie
      ? splitCookie(selectedCookie).value
      : false
  }

  function splitCookie (cookie: string): ISplitCookieObject {
    const [name, value] = splitText(cookie, '=')

    return {
      name,
      value
    }
  }

  const authCookie = getCookie(COOKIE_NAME)

  if (!authCookie) {
    location.href = '/acessos/entrar'

    return
  }

  // @ts-ignore
  const orders = new Proxy({
    list: [],
  } as OrderProxy, {
    get <T extends Orders, K extends OrdersProperties> (target: T, key: K) {
      const ordersSize = objectSize(target.list)

      switch (key) {
        case 'hasOrders':
          return ordersSize > 0
        case 'ordersCount':
          return ordersSize
        default:
          return target[key as Exclude<OrdersProperties, keyof OrderGetters>]
      }
    },

    set <T extends Orders, K extends keyof Orders> (target: T, key: K, value: T[K]): boolean {
      const isApplied = Reflect.set(target, key, value)

      if (!isApplied) return isApplied

      switch (key) {
        case 'list':
          renderOrders()

          break
      }

      return true
    }
  }) satisfies OrderProxy

  function changeTextContent (element: ReturnType<typeof querySelector>, textContent: string) {
    if (!element) return

    element.textContent = textContent
  }

  function addClass (element: ReturnType<typeof querySelector>, ...className: string[]): void {
    if (!element) return

    element.classList.add(...className)
  }

  function removeClass (element: ReturnType<typeof querySelector>, ...className: string[]): void {
    if (!element) return

    element.classList.remove(...className)
  }

  function toggleClass (element: ReturnType<typeof querySelector>, className: string, force?: boolean): boolean {
    if (!element) return false

    return element.classList.toggle(className, force)
  }

  function isArray <T = any> (arg: any): arg is T[] {
    return Array.isArray(arg)
  }

  function querySelector <
    K extends keyof HTMLElementTagNameMap,
    T extends HTMLElementTagNameMap[K] | Element | null = HTMLElementTagNameMap[K] | null
  > (
    selector: K | string,
    node: HTMLElement | Document | null = document
  ): T {
    if (!node) return NULL_VALUE as T

    return node.querySelector(selector as string) as T
  }

  function attachEvent <
    T extends HTMLElement | Document,
    K extends T extends HTMLElement
      ? keyof HTMLElementEventMap
      : keyof DocumentEventMap
  > (
    node: T,
    eventName: K,
    callback: (event: T extends HTMLElement
      ? HTMLElementEventMap[K extends keyof HTMLElementEventMap ? K : never]
      : DocumentEventMap[K extends keyof DocumentEventMap ? K : never]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): VoidFunction {
    node.addEventListener(eventName, callback as EventListener, options)

    return () => node.removeEventListener(eventName, callback as EventListener, options)
  }

  function objectSize <T extends string | any[]> (value: T): number {
    return value.length
  }

  function postSuccessResponse <T = void> (response: T): FunctionSucceededPattern<T> {
    return {
      data: response,
      succeeded: true
    }
  }

  function postErrorResponse (message: string): FunctionErrorPattern {
    return {
      message,
      succeeded: false
    }
  }

  async function getOrders (): Promise<ResponsePattern<Order[]>> {
    const defaultMessage = ''

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/orders`, {
        headers: {
          Accept: 'application/json',
          Authorization: authCookie as string,
        },
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultMessage)
      }

      const data = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultMessage)
    }
  }

  function replaceChildren (
    node: ReturnType<typeof querySelector>,
    ...nodes: (DocumentFragment | Element | null)[]
  ) {
    if (!node) return

    document.replaceChildren(...nodes.filter(Boolean) as Element[])
  }

  function removeElementFromDOM (node: ReturnType<typeof querySelector>): void {
    if (!node) return

    return node.remove()
  }

  const noOrdersElement = querySelector<'div'>('[data-wtf-has-no-orders]')

  const orderTemplate = querySelector<'div'>('[data-wtf-order-template]')
  const ordersContainer = querySelector<'div'>('[data-wtf-orders-container]')

  const orderItem = querySelector<'div'>('[data-wtf-product-item]', ordersContainer)

  const evaluatedTemplate = querySelector<'div'>('[data-wtf-evaluated]')
  const notRatedTemplate = querySelector<'div'>('[data-wtf-not-rated]')
  const evaluationForm = querySelector<'div'>('[data-wtf-evaluation-form]')

  for (const element of [evaluatedTemplate, notRatedTemplate, evaluationForm, orderItem]) {
    removeElementFromDOM(element)
  }

  function createFragment (): ReturnType<typeof document.createDocumentFragment> {
    return document.createDocumentFragment()
  }

  function renderOrders (): void {
    const {
      list,
      hasOrders,
    } = orders

    if (!ordersContainer || !orderTemplate || !orderItem) return

    toggleClass(noOrdersElement, GENERAL_HIDDEN_CLASS, hasOrders)
    toggleClass(ordersContainer, GENERAL_HIDDEN_CLASS, !hasOrders)

    const fragment = createFragment()

    for (const order of list) {
      const template = orderTemplate.cloneNode(true) as HTMLElement

      changeTextContent(querySelector('[data-wtf-order-total]', template), order.total)
      changeTextContent(querySelector('[data-wtf-order-status]', template), order.status)
      changeTextContent(querySelector('[data-wtf-created-at]', template), order.created_at)
      changeTextContent(querySelector('[data-wtf-payment-method]', template), order.payment_method)
      changeTextContent(querySelector('[data-wtf-transaction-id]', template), order.transaction_id)
      //data-wtf-evaluated Avaliado
      //data-wtf-not-rated Não avaliado
      //data-wtf-evaluation-form Formulário de avaliação

      const orderItemsContainer = querySelector<'div'>('[data-wtf-product-list]', template) as HTMLElement

      for (const { name, sku_id, product_id, quantity, unit_price, image } of order.order_items) {
        const itemTemplate = orderItem.cloneNode(true) as HTMLElement

        orderItemsContainer.insertAdjacentElement('afterbegin', itemTemplate)
      }

      fragment.appendChild(template)
    }

    replaceChildren(ordersContainer, fragment)
  }

  getOrders().then(response => {
    if (!response.succeeded) return

    orders.list = response.data
  })

})()
