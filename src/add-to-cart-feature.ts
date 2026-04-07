import {
  splitText,
  stringify,
  attachEvent,
  toggleClass,
  getAttribute,
  querySelector,
  changeTextContent,
} from '../utils/dom'

import {
  SLASH_STRING,
  XANO_BASE_URL,
  STORAGE_KEY_NAME,
} from '../utils/consts'

import {
  type CartResponse,
  type ResponsePattern,
  type CartResponseItem,
  type FunctionErrorPattern,
  type FunctionSucceededPattern,
} from '../global'

import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  EnumHttpMethods,
} from '../types/http'

const triggers = document.querySelectorAll<HTMLElement>('[data-wtf-buy-bag]')
// const triggers = document.querySelectorAll('a.w-inline-block[href^="/produtos/"]')

if (!triggers.length) {
  throw new Error('No bags found')
}

function isHTMLAnchorElement (element: Element): element is HTMLAnchorElement {
  return element instanceof HTMLAnchorElement
}

const loadingClass = getAttribute(document.currentScript, 'data-loading-classname') ?? 'carregando'

for (const trigger of triggers) {
  if (!isHTMLAnchorElement(trigger)) continue

  const pathname = getAttribute(trigger, 'href')

  if (!pathname) continue

  const slug = splitText(pathname, SLASH_STRING).at(-1)

  if (!slug) continue

  attachEvent(trigger, 'click', event => {
    event.preventDefault()
    event.stopPropagation()

    toggleClass(trigger, loadingClass, true)

    addProductsToCart(slug)
      .then(response => {
        toggleClass(trigger, loadingClass, false)

        if (!response.succeeded) return

        changeTextContent(
          querySelector('[data-wtf-floating-cart-items-indicator]'),
          countCartItems(response.data.items ?? []) ?? 0,
        )

        localStorage.setItem(STORAGE_KEY_NAME, stringify<CartResponse>(response.data))
      })
  })
}

function countCartItems (items: CartResponseItem[]): number {
  return items.reduce<number>((itemsCount, cartItem) => {
    return itemsCount + cartItem.quantity
  }, 0)
}

async function addProductsToCart <T extends CartResponse> (referenceId: string): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível adicionar o produto no seu carrinho'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:79PnTkh_/cart/add_variation`, {
      ...buildRequestOptions([], EnumHttpMethods.POST),
      keepalive: true,
      priority: 'high',
      body: stringify({
        reference_id: referenceId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call<
        Response, [string], FunctionErrorPattern
      >(response, error?.message ?? defaultErrorMessage)
    }

    const data: T = await response.json()

    return postSuccessResponse.call<
      Response, [T], FunctionSucceededPattern<T>
    >(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}
