
import {
  hasClass,
  splitText,
  stringify,
  attachEvent,
  toggleClass,
  getAttribute,
  querySelector,
  changeTextContent, NULL_VALUE, isNull,
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
  type FunctionSucceededPattern, AddVariationResponse, Nullable,
} from '../global'

import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  EnumHttpMethods,
} from '../types/http'

import {
  addToCartTracking,
} from '../utils/tracking'

function isHTMLAnchorElement (element: Element): element is HTMLAnchorElement {
  return element instanceof HTMLAnchorElement
}

const doneClass = getAttribute(document.currentScript, 'data-done-classname') ?? 'carregado'
const loadingClass = getAttribute(document.currentScript, 'data-loading-classname') ?? 'carregando'

const finSweetDynItems = querySelector<'div'>('.listadeprodutos_grid_produtos_collectionlist.w-dyn-items')

if (finSweetDynItems) {
  let timerId: Nullable<number> = NULL_VALUE
  let controller: VoidFunction = (() => {})

  const observer = new MutationObserver(function () {
    if (!isNull(timerId)) clearTimeout(timerId)

    timerId = setTimeout(() => {
      controller()

      controller = attachFeatureEvents(new AbortController()) ?? NULL_VALUE
    }, 700)
  })

  observer.observe(finSweetDynItems, {
    attributes: true,
    attributeFilter: [
      'style',
    ],
  })

  controller()

  controller = attachFeatureEvents(new AbortController()) ?? NULL_VALUE
} else {
  attachFeatureEvents()
}

function attachFeatureEvents (controller?: AbortController): VoidFunction {
  const triggers = document.querySelectorAll<HTMLElement>('[data-wtf-buy-bag]')
  // const triggers = document.querySelectorAll('a.w-inline-block[href^="/produtos/"]')

  if (!triggers.length) {
    throw new Error('No bags found')
  }

  for (const trigger of triggers) {
    if (!isHTMLAnchorElement(trigger)) continue

    const pathname = getAttribute(trigger, 'href')

    if (!pathname) continue

    const reference_id = splitText(pathname, SLASH_STRING).at(-1)

    if (!reference_id) continue

    attachEvent(trigger, 'click', event => {
      event.preventDefault()
      event.stopPropagation()

      if ([loadingClass, doneClass].some(className => hasClass(trigger, className))) {
        return console.warn('You should wait for the end of the current operation to add this item again')
      }

      toggleClass(trigger, loadingClass, true)

      addProductsToCart(reference_id)
        .then(response => {
          toggleClass(trigger, loadingClass, false)

          if (!response.succeeded) return

          toggleClass(trigger, doneClass, true)

          setTimeout(() => {
            toggleClass(trigger, doneClass, false)
          }, 1500)

          changeTextContent(
            querySelector('[data-wtf-floating-cart-items-indicator]'),
            countCartItems(response.data.items ?? []) ?? 0,
          )

          localStorage.setItem(STORAGE_KEY_NAME, stringify<CartResponse>(response.data))

          addToCartTracking(response.data.added_item).then((_response) => {
            if (!_response.succeeded) return

            const {
              event_id,
              event_data,
            } = _response.data

            fbq?.('track', 'AddToCart', event_data, {
              eventID: event_id,
            })
          })
        })
    }, controller ? { signal: controller.signal } : undefined)
  }

  return () => controller?.abort()
}

function countCartItems (items: CartResponseItem[]): number {
  return items.reduce<number>((itemsCount, cartItem) => {
    return itemsCount + cartItem.quantity
  }, 0)
}

async function addProductsToCart <T extends AddVariationResponse> (referenceId: string): Promise<ResponsePattern<T>> {
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
