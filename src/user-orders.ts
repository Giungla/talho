
import type {
  Nullable,
  ResponsePattern,
  CreateCartProduct,
} from '../global'

import type {
  Order,
  Orders,
  OrderProxy,
  OrderGetters,
  ProductReview,
  OrdersProperties,
  CreateProductReview, OrderItem,
} from '../types/user-orders'

import type {
  AddToCartParams
} from '../types/single-page-product'

import {
  NULL_VALUE,
  BRLFormatter,
  XANO_BASE_URL,
  STORAGE_KEY_NAME,
  GENERAL_HIDDEN_CLASS,
  stringify,
  isAuthenticated,
  buildRequestOptions,
  postErrorResponse,
  postSuccessResponse,
  querySelector,
  addClass,
  toggleClass,
  changeTextContent,
  addAttribute,
  attachEvent,
  removeClass,
  objectSize,
  removeAttribute,
} from '../utils'

(function () {
  const DISABLED_ATTR = 'disabled'
  const CART_SWITCH_CLASS = 'carrinhoflutuante--visible'

  const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`

  const acquiring = new Set<string>()

  function max (...n: number[]): number {
    return Math.max(...n)
  }

  if (!isAuthenticated()) {
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

  async function getOrders (): Promise<ResponsePattern<Order[]>> {
    const defaultMessage = 'Falha ao buscar os pedidos'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/orders`, {
        ...buildRequestOptions(),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultMessage)
      }

      const data = await response.json()

      return postSuccessResponse.call(response, data)
    } catch (e) {
      return postErrorResponse(defaultMessage)
    }
  }

  async function postReview ({ comment, rating, product_id }: CreateProductReview): Promise<ResponsePattern<CreateProductReview>> {
    const defaultMessage = 'Falha ao gerar a avaliação, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:9ixgU7Er/ratings/${product_id}/create`, {
        ...buildRequestOptions([], 'POST'),
        body: stringify<ProductReview>({
          rating,
          comment,
        }),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultMessage)
      }

      const data = await response.json()

      return postSuccessResponse.call(response, data)
    } catch (e) {
      return postErrorResponse(defaultMessage)
    }
  }

  async function addProductToCart (item: CreateCartProduct): Promise<ResponsePattern<CreateCartProduct>> {
    const defaultErrorMessage = 'Falha ao adicionar o produto'

    try {
      const response = await fetch(`${CART_BASE_URL}/cart/handle`, {
        ...buildRequestOptions([], 'POST'),
        body: stringify<AddToCartParams>({
          item,
          operation: 'add',
        }),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
      }

      const data: CreateCartProduct = await response.json()

      return postSuccessResponse.call(response, data)
    } catch (e) {
      return postErrorResponse(`[CATCH] ${defaultErrorMessage}`)
    }
  }

  function replaceChildren (
    node: ReturnType<typeof querySelector>,
    ...nodes: (DocumentFragment | Element | null)[]
  ) {
    if (!node) return

    node.replaceChildren(...nodes.filter(Boolean) as Element[])
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

  async function buyAgain ({ sku_id, slug }: Pick<OrderItem, 'sku_id' | 'slug'>): Promise<void> {
    if (acquiring.has(slug)) return

    acquiring.add(slug)

    const response = await addProductToCart({
      sku_id,
      quantity: 1,
      reference_id: slug,
    })

    if (!response.succeeded) {
      acquiring.delete(slug)

      return
    }

    addClass(querySelector('#carrinho-flutuante'), CART_SWITCH_CLASS)

    localStorage.setItem(STORAGE_KEY_NAME, stringify<CreateCartProduct>(response.data))

    acquiring.delete(slug)
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

      const orderItemsContainer = querySelector<'div'>('[data-wtf-product-list]', template) as HTMLElement

      for (const { name, slug, product_id, sku_id, quantity, unit_price, image, review, has_stock } of order.order_items) {
        const itemTemplate = orderItem.cloneNode(true) as HTMLElement
        const reviewSection = querySelector('[data-wtf-review-area]', itemTemplate) as HTMLElement

        addAttribute(
          querySelector<'a'>('[data-wtf-product-anchor]', itemTemplate), 'href', `/produtos/${slug}`
        )

        const addToCartCTA = querySelector<'img'>('[data-wtf-buy-again-cta]', itemTemplate)

        if (has_stock) {
          attachEvent(addToCartCTA, 'click', () => buyAgain({ sku_id, slug }))
        } else {
          removeElementFromDOM(addToCartCTA)
        }

        changeTextContent(querySelector('[data-wtf-product-name]', itemTemplate), name)
        changeTextContent(querySelector('[data-wtf-product-price]', itemTemplate), BRLFormatter.format(unit_price / 100))
        changeTextContent(querySelector('[data-wtf-product-subtotal]', itemTemplate), BRLFormatter.format(unit_price * quantity / 100))

        if (review === undefined) {
          const notRatedClone = (notRatedTemplate?.cloneNode(true) ?? NULL_VALUE) as Nullable<HTMLElement>
          const evaluationFormClone = (evaluationForm?.cloneNode(true) ?? NULL_VALUE) as Nullable<HTMLElement>

          removeClass(notRatedClone, GENERAL_HIDDEN_CLASS)

          if (order.pago) {
            attachEvent(querySelector<'img'>('[data-wtf-not-rated-cta]', notRatedClone), 'click', () => {
              showEvaluationForm(product_id, notRatedClone, evaluationFormClone)
            }, { once: true })

            removeElementFromDOM(querySelector('[data-wtf-not-rated-unpaid]', notRatedClone))
          } else {
            removeElementFromDOM(querySelector('[data-wtf-not-rated-paid]', notRatedClone))
            removeElementFromDOM(querySelector<'img'>('[data-wtf-not-rated-cta]', notRatedClone))
          }

          replaceChildren(reviewSection, notRatedClone, evaluationFormClone)
        } else {
          const templateClone = evaluatedTemplate?.cloneNode(true) as HTMLElement

          changeTextContent(querySelector('[data-wtf-evaluated-comment]', templateClone), review.comment)

          drawReviewStars(templateClone, review.rating)

          removeClass(templateClone, GENERAL_HIDDEN_CLASS)

          replaceChildren(reviewSection, templateClone)
        }

        orderItemsContainer.insertAdjacentElement('afterbegin', itemTemplate)
      }

      fragment.appendChild(template)
    }

    replaceChildren(ordersContainer, fragment)
  }

  function drawReviewStars (reviewNode: ReturnType<typeof querySelector>, rating: number): void {
    if (!reviewNode) return

    const starsSection = querySelector('[data-wtf-evaluated-star-section]', reviewNode as HTMLElement)

    if (!starsSection) return

    const children = max(starsSection.childElementCount - max(1, rating), 0)

    for (let index = 0; index++ < children;) {
      removeElementFromDOM(starsSection.lastElementChild)
    }
  }

  function showEvaluationForm (
    product_id: number,
    notRatedView: ReturnType<typeof querySelector>,
    evaluationFormView: ReturnType<typeof querySelector>
  ) {
    if (!notRatedView || !evaluationFormView) return

    addClass(notRatedView, GENERAL_HIDDEN_CLASS)
    removeClass(evaluationFormView, GENERAL_HIDDEN_CLASS)

    const reviewForm = querySelector('form', evaluationFormView as HTMLElement)

    const reviewFormParent = reviewForm?.parentElement

    if (!reviewForm || !reviewFormParent) return

    const unusedFormAttributes: string[] = [
      'id',
      'name',
      'method',
      'data-name',
      'aria-label',
      'data-wf-page-id',
      'data-wf-element-id',
      'data-turnstile-sitekey'
    ]

    for (const attr of unusedFormAttributes) {
      removeAttribute(reviewForm, attr)
    }

    removeElementFromDOM(reviewForm)

    replaceChildren(reviewFormParent)
    reviewFormParent.insertAdjacentHTML('afterbegin', reviewForm.outerHTML)

    const _reviewForm = querySelector('form', evaluationFormView as HTMLElement) as HTMLFormElement

    removeAttribute(querySelector('[type="submit"]', _reviewForm), DISABLED_ATTR)

    attachEvent(_reviewForm, 'submit', async (event: SubmitEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!event.isTrusted || !event.submitter) return

      addAttribute(event.submitter, DISABLED_ATTR, DISABLED_ATTR)

      const response = await postReview({
        product_id,
        comment: _reviewForm.comment.value,
        rating: parseInt(_reviewForm.rating.value),
      })

      if (!response.succeeded) {
        // TODO: Necessário tratar o erro

        removeAttribute(event.submitter, DISABLED_ATTR)

        return
      }

      drawReviewedArea(response.data, _reviewForm)
    })
  }

  function drawReviewedArea (payload: CreateProductReview, reviewForm: ReturnType<typeof querySelector<'form'>>): void {
    if (!reviewForm) return

    const reviewArea = reviewForm.closest('[data-wtf-review-area]')

    if (!reviewArea) return

    const reviewedTemplate = evaluatedTemplate?.cloneNode(true)

    if (!reviewedTemplate) return

    drawReviewStars(reviewedTemplate as HTMLElement, payload.rating)

    changeTextContent(querySelector('[data-wtf-evaluated-comment]', reviewedTemplate as HTMLElement), payload.comment)

    removeClass(reviewedTemplate as HTMLElement, GENERAL_HIDDEN_CLASS)

    replaceChildren(reviewArea, reviewedTemplate as HTMLElement)
  }

  getOrders().then(response => {
    if (!response.succeeded) return

    orders.list = response.data
  })

})()
