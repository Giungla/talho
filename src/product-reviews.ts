
import type {
  ResponsePattern,
} from '../global'

import type {
  Review,
  ReviewProxy,
  ReviewGetters,
  ReviewResponse,
  ReviewProperties,
} from '../types/product-reviews'

import {
  NULL_VALUE,
  XANO_BASE_URL,
  GENERAL_HIDDEN_CLASS,
  toggleClass,
  querySelector,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  changeTextContent,
} from '../utils'

(function () {
  function removeElementFromDOM (node: ReturnType<typeof querySelector>): void {
    if (!node) return

    return node.remove()
  }

  async function readReviews (reference_id: string): Promise<ResponsePattern<ReviewResponse>> {
    const defaultMessage = 'Não foi possível localizar as avaliaçôes para o produto'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:9ixgU7Er/ratings/${reference_id}/list`, {
        ...buildRequestOptions()
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultMessage)
      }

      const data: ReviewResponse = await response.json()

      return postSuccessResponse.call(response, data)
    } catch (e) {
      return postErrorResponse(defaultMessage)
    }
  }

  function drawReviews (): void {
    const reviewsFragment = document.createDocumentFragment()

    toggleClass(querySelector('[data-wtf-top-product-rating]'), GENERAL_HIDDEN_CLASS, !state.hasReviews)
    toggleClass(querySelector('[data-wtf-review-section]'), GENERAL_HIDDEN_CLASS, !state.hasReviews)
    toggleClass(querySelector('[data-wtf-review-line]'), GENERAL_HIDDEN_CLASS, !state.hasReviews)

    for (const { name, comment, rating, created_at } of state.response?.reviews.items ?? []) {
      const reviewTemplateClone = reviewTemplate?.cloneNode(true) as HTMLDivElement

      changeTextContent(querySelector('[data-wtf-review-average]', reviewTemplateClone), rating.toString())
      changeTextContent(querySelector('[data-wtf-review-customer-name]', reviewTemplateClone), name)
      changeTextContent(querySelector('[data-wtf-review-created-at]', reviewTemplateClone), created_at)
      changeTextContent(querySelector('[data-wtf-review-comment]', reviewTemplateClone), comment)

      reviewsFragment.appendChild(reviewTemplateClone)
    }

    changeTextContent(querySelector('[data-wtf-review-count]'), state.response?.count ?? 0)
    changeTextContent(querySelector('[data-wtf-review-media]'), state.response?.average ?? 0)
    changeTextContent(querySelector('[data-wtf-review-title]'), state.reviewsCount > 1 ? 'Avaliaçôes' : 'Avaliação')

    changeTextContent(querySelector('h1', querySelector('[data-wtf-top-product-rating]') as HTMLElement), state.response?.average ?? 0)

    reviewContainer?.replaceChildren(reviewsFragment)
  }

  const state = new Proxy({
    response: NULL_VALUE,
  } as ReviewProxy, {
    get <T extends Review, K extends ReviewProperties> (target: T, key: K) {
      const reviewsCount = target.response?.count ?? 0

      switch (key) {
        case 'reviewsCount':
          return reviewsCount
        case 'hasReviews':
          return reviewsCount > 0
        default:
          return target[key as Exclude<ReviewProperties, keyof ReviewGetters>]
      }
    },

    set <T extends Review, K extends keyof Review> (target: T, key: K, value: T[K]): boolean {
      const applied = Reflect.set(target, key, value)

      if (!applied) return applied

      switch (key) {
        case 'response':
          drawReviews()
          break
      }

      return true
    }
  }) satisfies ReviewProxy

  const reviewContainer = querySelector<'div'>('[data-wtf-review-list]')

  if (!reviewContainer) return

  const reviewTemplate = querySelector('[data-wtf-review-template]', reviewContainer)

  if (!reviewTemplate) return

  removeElementFromDOM(reviewTemplate)

  const path = location.pathname
    .split('/')
    .filter(Boolean)
    .at(-1)

  if (!path) {
    // TODO: Hide review section
    return
  }

  readReviews(path)
    .then(response => {
      if (!response.succeeded) return

      state.response = response.data
    })
})()
