
import type {
  CartOperation,
  CartResponse,
  CartResponseItem,
  CreateCartProduct,
  FloatingCartState,
  GroupFloatingCartState,
  ResponsePattern,
  TypeMap,
  TypeofResult,
} from '../global';

import {
  NULL_VALUE,
  BRLFormatter,
  XANO_BASE_URL,
  STORAGE_KEY_NAME,
  GENERAL_HIDDEN_CLASS,
  FREE_SHIPPING_MIN_CART_PRICE,
  safeParseJson,
  querySelector,
  attachEvent,
  toggleClass,
  objectSize,
  hasClass,
  isArray,
  postErrorResponse,
  changeTextContent,
  postSuccessResponse,
  buildRequestOptions, stringify, addClass,
} from '../utils'

const CART_SWITCH_CLASS = 'carrinhoflutuante--visible'

const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`

const MAX_PRODUCT_QUANTITY = 10

const _state: FloatingCartState = {
  cart: NULL_VALUE,
  fetched: NULL_VALUE,
  isPending: false,
  isCartOpened: true,
}

const state = new Proxy(_state, {
  get <K extends keyof GroupFloatingCartState> (
    target: FloatingCartState,
    key: K,
  ) {
    switch (key) {
      case 'hasFreeShipping':
        //TODO: Improve
        return (target.cart?.order_price ?? 0) > FREE_SHIPPING_MIN_CART_PRICE
      case 'missingForFreeShipping':
        return Math.max(0, FREE_SHIPPING_MIN_CART_PRICE - (target.cart?.order_price ?? 0))
      case 'getOrderPrice':
        return BRLFormatter.format(target.cart?.order_price ?? 0)
      default:
        return Reflect.get(target, key)
    }
  },

  set <K extends keyof FloatingCartState> (
    target: FloatingCartState,
    key: K,
    value: FloatingCartState[K]
  ) {
    const isApplied = Reflect.set(target, key, value)

    if (!isApplied) return isApplied

    switch (key) {
      case 'isPending':
        break
      case 'isCartOpened':
        refreshCartItems()
        break
      case 'cart':
        renderCart()

        handlePromoMessages()

        localStorage.setItem(STORAGE_KEY_NAME, JSON.stringify(value))

        break
    }

    return isApplied
  }
}) as GroupFloatingCartState

const cartItemTemplate = querySelector('[data-wtf-floating-cart-item]')
const cartItemsWrapper = querySelector('[data-wtf-floating-cart-item-wrapper]')
const cartEmpty = querySelector('[data-wtf-floating-cart-empty-cart]')

const promoValidElement = querySelector('[data-wtf-promo-valid]')
const promoInValidElement = querySelector('[data-wtf-promo-invalid]')

const cartTotalElement = querySelector('[data-wtf-floating-cart-total]')

function hasOwn <
  T extends object,
  K extends PropertyKey,
  Type extends TypeofResult = never,
> (o: T, v: K, type?: Type): o is T & Record<K, Type extends keyof TypeMap ? TypeMap[Type] : unknown> {
  return Object.prototype.hasOwnProperty.call(o, v) && (!type || typeof (o as any)[v] === type)
}

// function isArray <T extends any> (value: any): value is T[] {
//   return Array.isArray(value)
// }

function hasValidCart (cart: object): cart is CartResponse {
  if (!hasOwn(cart, 'order_price', 'number') || !hasOwn(cart, 'items')) return false

  if (!isArray(cart.items)) return false

  if (objectSize(cart.items as []) === 0) return true

  return (cart.items as Record<string, unknown>[]).every(value => (
    hasOwn(value, 'name', 'string') &&
    hasOwn(value, 'quantity', 'number') &&
    hasOwn(value, 'price', 'number') &&
    hasOwn(value, 'imageUrl', 'string') &&
    hasOwn(value, 'sku_id', 'number') &&
    hasOwn(value, 'slug', 'string')
  ))
}

async function refreshCartItems (): Promise<void> {
  if (!state.isCartOpened) return

  const parsedCart = safeParseJson(localStorage.getItem(STORAGE_KEY_NAME))

  if (parsedCart && hasValidCart(parsedCart)) {
    state.fetched ??= true
    state.cart = parsedCart

    return
  } else localStorage.removeItem(STORAGE_KEY_NAME)

  state.isPending = true

  const response = await getCartProducts()

  state.fetched ??= true
  state.isPending = false

  if (!response.succeeded) {
    // TODO: tratar e exibir o erro
    return
  }

  state.cart = response.data
}

async function getCartProducts (): Promise<ResponsePattern<CartResponse>> {
  const defaultErrorMessage = 'Houve uma falha ao buscar o seu carrinho'

  try {
    const response = await fetch(`${CART_BASE_URL}/cart/get`, {
      ...buildRequestOptions(),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    const data: CartResponse = await response.json()

    return postSuccessResponse.call(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

async function updateCartProducts (item: CreateCartProduct, operation: CartOperation): Promise<ResponsePattern<CartResponse>> {
  const defaultErrorMessage = 'Houve uma falha ao buscar o seu carrinho'

  try {
    const response = await fetch(`${CART_BASE_URL}/cart/handle`, {
      ...buildRequestOptions([], 'POST'),
      body: stringify({
        item,
        operation,
      })
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    const data: CartResponse = await response.json()

    return postSuccessResponse.call(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

async function handleProductChangeQuantity (operation: Exclude<CartOperation, 'add'>, payload: Omit<CreateCartProduct, 'quantity'>) {
  if (state.isPending) return

  state.isPending = true

  const response = await updateCartProducts({
    ...payload,
    quantity: 1,
  }, operation)

  state.isPending = false

  if (!response.succeeded) return

  state.cart = response.data
}

function renderCart () {
  changeTextContent(cartTotalElement, state.getOrderPrice)

  const items = state.cart?.items

  if (!isArray<CartResponseItem>(items) || !cartItemTemplate || !cartItemsWrapper) return

  toggleClass(querySelector('[data-wtf-floating-cart-total-block]'), GENERAL_HIDDEN_CLASS, objectSize(items) === 0)
  toggleClass(querySelector('[data-wtf-floating-cart-checkout-button]', cart), GENERAL_HIDDEN_CLASS, objectSize(items) === 0)

  if (!toggleClass(cartEmpty, GENERAL_HIDDEN_CLASS, objectSize(items) > 0)) {
    changeTextContent(querySelector('[data-wtf-floating-cart-items-indicator]'), '0')

    return cartItemsWrapper.replaceChildren()
  }

  let unitCount = 0

  const cartFragment = document.createDocumentFragment()

  for (const { slug, imageUrl, quantity, price, sku_id, name } of (items as CartResponseItem[])) {
    unitCount += quantity

    const template = cartItemTemplate.cloneNode(true) as HTMLElement

    changeTextContent(querySelector('[data-wtf-floating-cart-item-product-name]', template), name)
    changeTextContent(querySelector('[data-wtf-floating-cart-item-quantity]', template), quantity.toString())
    changeTextContent(querySelector('[data-wtf-floating-cart-item-product-price]', template), BRLFormatter.format(price))

    const productImage = querySelector('[data-wtf-floating-cart-item-image]', template)

    if (productImage) {
      productImage.style.backgroundImage = `url('${imageUrl}')`
    }

    const changeCartPayload = {
      sku_id,
      reference_id: slug
    }

    const productEventMap: [Exclude<CartOperation, 'add'>, string][] = [
      [ 'delete', 'data-wtf-floating-cart-item-remove' ],
      [ 'increase', 'data-wtf-floating-cart-item-plus-button' ],
      [ 'decrease', 'data-wtf-floating-cart-item-minus-button' ],
    ]

    for (const [ operation, elementTrigger ] of productEventMap) {
      const triggerElement = querySelector(`[${elementTrigger}]`, template)

      if (operation === 'increase' && quantity >= MAX_PRODUCT_QUANTITY) {
        addClass(triggerElement, 'onedge')

        continue
      }

      attachEvent(triggerElement, 'click', (e: MouseEvent) => execCartAction.call(e, operation, changeCartPayload))
    }

    cartFragment.appendChild(template)
  }

  changeTextContent(querySelector('[data-wtf-floating-cart-items-indicator]'), unitCount.toString())

  cartItemsWrapper?.replaceChildren(cartFragment)
}

function handlePromoMessages () {
  const { hasFreeShipping } = state

  toggleClass(promoValidElement, GENERAL_HIDDEN_CLASS, !hasFreeShipping)
  toggleClass(promoInValidElement, GENERAL_HIDDEN_CLASS, hasFreeShipping)

  if (!hasFreeShipping) {
    return changeTextContent(querySelector('[data-wtf-promo-invalidada-txt]', promoInValidElement), `Adicione mais ${BRLFormatter.format(state.missingForFreeShipping)} e ganhe frete grátis`)
  }

  return changeTextContent(querySelector('[data-wtf-promo-validada-txt-sem-imagem]', promoValidElement), `Você ganhou frete grátis`)
}

async function execCartAction (
  this: MouseEvent,
  operation: Exclude<CartOperation, 'add'>,
  payload: Omit<CreateCartProduct, 'quantity'>,
) {
  this.preventDefault()
  this.stopPropagation()

  await handleProductChangeQuantity(operation, payload)
}

const cart = querySelector('[data-wtf-floating-cart]')

const cartObserver = new MutationObserver(mutations => {
  const _cart = mutations[0].target as HTMLElement

  const hasClassInCart = hasClass(_cart, CART_SWITCH_CLASS)

  state.isCartOpened = hasClassInCart
  // state.isCartOpened = _cart.checkVisibility({
  //   checkOpacity: true,
  //   checkVisibilityCSS: true,
  //   visibilityProperty: true,
  // })

  window.scrollTo({
    top: 0,
    behavior: 'instant',
  })

  document.body.style.overflow = hasClassInCart
    ? 'hidden'
    : 'unset'
});

(() => {
  if (!cart) return

  cartObserver.observe(cart, {
    attributes: true,
    attributeFilter: [
      'class',
    ]
  })

  if (!cartItemsWrapper) return

  window.addEventListener('storage', function (e) {
    if (e.key !== STORAGE_KEY_NAME) return

    state.cart = e.newValue
      ? safeParseJson(e.newValue)
      : NULL_VALUE
  })

  refreshCartItems()
    .then(() => {
      state.isCartOpened = false
    })
})()
