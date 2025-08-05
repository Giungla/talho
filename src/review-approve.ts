
import type {
  ResponsePattern,
} from '../global'

import type {
  ReviewAction,
  ReviewParams,
  ReviewResponse
} from '../types/review-approve'

import {
  XANO_BASE_URL,
  AUTH_COOKIE_NAME,
  getCookie,
  stringify,
  querySelector,
  changeTextContent,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils'

(function () {
  const searchParams = new URLSearchParams(location.search)

  const action = searchParams.get('action')
  const reviewId = searchParams.get('review_id')

  if (!action || !reviewId) return

  const errorMessageElement = querySelector('[data-wtf-error-review]')
  const successMessageElement = querySelector('[data-wtf-approve-review]')

  function removeElementFromDOM (node: ReturnType<typeof querySelector>): void {
    if (!node) return

    return node.remove()
  }

  async function changeReviewStatus ({ review_id, action }: ReviewParams): Promise<ResponsePattern<ReviewResponse>> {
    const defaultMessage = 'Não foi possível alterar a situação da avaliação'

    try {
      const additionalHeaders = [
        [ 'Authorization', getCookie(AUTH_COOKIE_NAME) || '' ]
      ]

      const response = await fetch(`${XANO_BASE_URL}/api:9ixgU7Er/ratings/${review_id}/${action}`, {
        ...buildRequestOptions(additionalHeaders, 'PATCH'),
        body: stringify<object>({})
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response.headers, error?.message ?? defaultMessage)
      }

      const data = await response.json()

      return postSuccessResponse.call(response.headers, data)
    } catch (e) {
      return postErrorResponse(defaultMessage)
    }
  }

  changeReviewStatus({
    action: action as ReviewAction,
    review_id: parseInt(reviewId)
  }).then(response => {
    if (!response.succeeded) {
      removeElementFromDOM(successMessageElement)

      return changeTextContent(querySelector('div', errorMessageElement), response.message)
    }

    removeElementFromDOM(errorMessageElement)

    changeTextContent(querySelector('div', successMessageElement), response.data.message)
  })
})()
