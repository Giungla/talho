import {
  ComputedFinalPrices, CreateCartProduct,
  FunctionErrorPattern,
  FunctionSucceededPattern, Nullable, Prices,
  ResponsePattern,
  SignupStateStatus,
  SingleProductPageProduct,
  SingleProductPageState,
  SingleProductPageStateHandler,
} from "../global";

(function () {
  const COOKIE_SEPARATOR = '; '
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const COOKIE_NAME = '__Host-Talho-AuthToken'
  const STORAGE_KEY_NAME = 'talho_cart_items'
  const CART_SWITCH_CLASS = 'carrinhoflutuante--visible'

  const CART_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io/api:79PnTkh_'

  /** Quantidade mínima de produtos permitidos no carrinho */
  const MIN_PRODUCT_QUANTITY = 1
  /** Quantidade máxima de produtos permitados no carrinho */
  const MAX_PRODUCT_QUANTITY = 10

  const _state: SingleProductPageState = {
    quantity: 1,
    product: null,
    selectedVariation: null,
  }

  const state = new Proxy<SingleProductPageState>(_state, {
    get (
      target,
      key: keyof (SingleProductPageState & SingleProductPageStateHandler)
    ): any {
      switch (key) {
        case 'variationsCount':
          return target.product?.variations.length ?? 0
        case 'hasPriceDifference':
          {
            const { price, full_price } = state.prices

            return price !== full_price
          }
        case 'prices':
          {
            const { product, selectedVariation } = target

            if (!product || !state.hasSelectedVariation) return buildPriceResponse<number>()

            const selectedSKU = product.variations.find(sku => sku.id === selectedVariation)

            if (!selectedSKU) return buildPriceResponse()

            return buildPriceResponse(
              selectedSKU.price,
              selectedSKU.full_price
            )
          }
        case 'BRLPrices':
          {
            const { price, full_price } = state.prices

            return buildPriceResponse(
              BRLFormatter.format(price),
              BRLFormatter.format(full_price),
            )
          }
        case 'computedFinalPrices':
          {
            const { quantity, prices } = state

            const price = prices.price * quantity
            const full_price = prices.full_price * quantity

            return {
              price: {
                price,
                full_price,
              },
              currency: {
                price: BRLFormatter.format(price),
                full_price: BRLFormatter.format(full_price),
              },
            } satisfies ComputedFinalPrices
          }
        case 'hasSelectedVariation':
          return target.selectedVariation !== null
        default:
          return Reflect.get(target, key)
      }
    },

    set <K extends keyof SingleProductPageState> (
      target: SingleProductPageState,
      key: K,
      value: SingleProductPageState[K]
    ): boolean {
      const isApplied = Reflect.set(target, key, value)

      switch (key) {
        case 'quantity':
          changeTextContent(renderQuantityElement, String(value ?? 1))
          renderProductPrice()
          break
        case 'selectedVariation':
          renderProductVariations()
          Reflect.set(state, 'quantity', 1)
          break
        case 'product':
          {
            const product = value as Nullable<SingleProductPageProduct>

            Reflect.set(state, 'selectedVariation', product?.variations[0].id)
          }
      }

      return isApplied
    }
  }) as (SingleProductPageState & SingleProductPageStateHandler)

  const minusButton = querySelector<'a'>('[data-wtf-quantity-minus]')
  const plusButton = querySelector<'a'>('[data-wtf-quantity-plus]')
  const renderQuantityElement = querySelector<'div'>('[data-wtf-quantity-value]')

  const priceViewer = querySelector('[data-wtf-price]')
  const fullPriceViewer = querySelector('[data-wtf-full-price]')
  const totalPriceViewer = querySelector('[data-wtf-total]')

  const skuList = querySelector('[data-wtf-sku-list]')
  const skuItem = querySelector('[data-wtf-sku-item]')

  const buyButton = querySelector<'a'>('[data-wtf-comprar]')

  const BRLFormatter = new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  })

  function querySelector<
    K extends keyof HTMLElementTagNameMap,
    T extends HTMLElementTagNameMap[K] | Element | null = HTMLElementTagNameMap[K] | null
  >(
    selector: K | string,
    node: HTMLElement | Document | null = document
  ): T {
    if (!node) return null as T

    return node.querySelector(selector as string) as T;
  }

  function attachEvent <
    T extends HTMLElement | Document,
    K extends T extends HTMLElement
      ? keyof HTMLElementEventMap
      : keyof DocumentEventMap
  > (
    node: T | null,
    eventName: K,
    callback: (event: T extends HTMLElement
      ? HTMLElementEventMap[K extends keyof HTMLElementEventMap ? K : never]
      : DocumentEventMap[K extends keyof DocumentEventMap ? K : never]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): VoidFunction | void {
    if (!node) return

    node.addEventListener(eventName, callback as EventListener, options)

    return () => node.removeEventListener(eventName, callback as EventListener, options)
  }

  function isPageLoading (status: boolean) {
    toggleClass(querySelector('[data-wtf-loader]'), GENERAL_HIDDEN_CLASS, !status)
  }

  function changeTextContent (element: ReturnType<typeof querySelector>, textContent: string) {
    if (!element) return

    element.textContent = textContent
  }

  function addAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string, value: string) {
    if (!element) return

    element.setAttribute(qualifiedName, value)
  }

  function removeAttribute (element: ReturnType<typeof querySelector>, qualifiedName: string) {
    if (!element) return

    element.removeAttribute(qualifiedName)
  }

  function addClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.add(...className)
  }

  function removeClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.remove(...className)
  }

  function toggleClass (element: ReturnType<typeof querySelector>, className: string, force?: boolean): boolean {
    if (!element) return false

    return element.classList.toggle(className, force)
  }

  function postErrorResponse (message: string): FunctionErrorPattern {
    return {
      message,
      succeeded: false
    }
  }

  function postSuccessResponse <T = void> (response: T): FunctionSucceededPattern<T> {
    return {
      data: response,
      succeeded: true
    }
  }

  function buildPriceResponse <T = number> (
    price: T = 0 as T,
    full_price: T = 0 as T,
  ): Prices<T> {
    return {
      price,
      full_price,
    }
  }

  async function getProduct (): Promise<ResponsePattern<SingleProductPageProduct>> {
    const defaultErrorMessage = 'Houve uma falha ao capturar o produto'

    try {
      const splittedPathname = location.pathname.split('/')

      const response = await fetch(`${CART_BASE_URL}/product/single-product-page`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: 1,
          reference_id: splittedPathname[splittedPathname.length - 1],
        })
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: SingleProductPageProduct = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  function changeProductQuantity (increment: number) {
    const newQuantity = increment + state.quantity

    const clampedQuantity = Math.max(MIN_PRODUCT_QUANTITY, Math.min(newQuantity, MAX_PRODUCT_QUANTITY))

    if (clampedQuantity === state.quantity) return

    state.quantity = clampedQuantity
  }

  function changeSelectedVariation (variationID: number) {
    const variationExists = state.product?.variations.some(({ id  }) => id === variationID)

    if (!variationExists) return

    state.selectedVariation = variationID
  }

  async function buyProduct (event: MouseEvent) {
    event.preventDefault()

    const { quantity, product, selectedVariation } = state

    if (!selectedVariation || !product) return

    const response = await addProductToCart({
      quantity,
      sku_id: selectedVariation,
      reference_id: product.slug,
    })

    // TODO: Implementar lógica corretamente
    if (!response.succeeded) {
      return alert('A adição falhou')
    }

    state.quantity = 1

    addClass(querySelector('#carrinho-flutuante'), CART_SWITCH_CLASS)

    localStorage.setItem(STORAGE_KEY_NAME, JSON.stringify(response.data))
  }

  async function addProductToCart (item: CreateCartProduct): Promise<ResponsePattern<CreateCartProduct>> {
    const defaultErrorMessage = 'Falha ao adicionar o produto'

    try {
      const response = await fetch(`${CART_BASE_URL}/cart/handle`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item,
          operation: 'add',
        }),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse(error?.message ?? defaultErrorMessage)
      }

      const data: CreateCartProduct = await response.json()

      return postSuccessResponse(data)
    } catch (e) {
      return postErrorResponse(`[CATCH] ${defaultErrorMessage}`)
    }
  }

  function renderProductVariations () {
    if (!skuList || !skuItem || !state.product) return

    const { selectedVariation, product } = state

    const variationsFragment = document.createDocumentFragment()

    for (const variation of product?.variations) {
      const variationElement = document.createElement('div')

      addClass(variationElement, 'text-block')
      toggleClass(variationElement, 'selecionado', selectedVariation === variation.id)

      changeTextContent(variationElement, variation.label)

      attachEvent(variationElement, 'click', () => changeSelectedVariation(variation.id))

      variationsFragment.appendChild(variationElement)
    }

    skuList.replaceChildren(variationsFragment)
  }

  function renderProductPrice () {
    const product = state.product

    if (!product || !state.hasSelectedVariation) return

    const getPriceViewer = (parent: ReturnType<typeof querySelector>) => querySelector('[data-wtf-price-value]', parent as HTMLElement)

    const { BRLPrices, hasPriceDifference, computedFinalPrices } = state

    changeTextContent(getPriceViewer(priceViewer), BRLPrices.price)
    changeTextContent(getPriceViewer(fullPriceViewer), BRLPrices.full_price)
    changeTextContent(getPriceViewer(totalPriceViewer), computedFinalPrices.currency.price)

    toggleClass(priceViewer, GENERAL_HIDDEN_CLASS, !hasPriceDifference)
    toggleClass(fullPriceViewer, GENERAL_HIDDEN_CLASS, !hasPriceDifference)
  }

  getProduct()
    .then(response => {
      if (!response.succeeded) {
        return
      }

      state.product = response.data
    })
    .then(() => {
      attachEvent(plusButton, 'click', () => changeProductQuantity(1))
      attachEvent(minusButton, 'click', () => changeProductQuantity(-1))

      attachEvent(buyButton, 'click', buyProduct)
    })
})()
