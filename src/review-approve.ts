
import type {
  ResponsePattern,
} from '../global'

import type {
  ReviewAction,
  ReviewParams,
  ReviewDetails,
  ReviewResponse,
} from '../types/review-approve'

import {
  XANO_BASE_URL,
  GENERAL_HIDDEN_CLASS,
  stringify,
  attachEvent,
  querySelector,
  changeTextContent,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  removeClass,
} from '../utils'

(function () {
  const REVIEW_PATH = `${XANO_BASE_URL}/api:9ixgU7Er/ratings`

  const searchParams = new URLSearchParams(location.search)

  const reviewId = searchParams.get('review_id')

  const errorMessageElement = querySelector('[data-wtf-error-review]')
  const successMessageElement = querySelector('[data-wtf-approve-review]')

  const approveButton = querySelector('[data-wtf-approve-review-cta]')
  const reproveButton = querySelector('[data-wtf-reprove-review]')

  if (!reviewId) {
    removeClass(errorMessageElement, GENERAL_HIDDEN_CLASS)

    return changeMessageText(errorMessageElement, 'Nenhuma review informada')
  }

  function removeElementFromDOM (node: ReturnType<typeof querySelector>): void {
    if (!node) return

    return node.remove()
  }

  function changeMessageText (messageElement: ReturnType<typeof querySelector>, text: string): void {
    if (!messageElement) return

    changeTextContent(querySelector('div', messageElement), text)
  }

  async function changeReviewStatus ({ reviewId, action }: ReviewParams): Promise<ResponsePattern<ReviewResponse>> {
    const defaultMessage = 'Não foi possível alterar a situação da avaliação'

    try {
      const response = await fetch(`${REVIEW_PATH}/${reviewId}/${action}`, {
        ...buildRequestOptions([], 'PATCH'),
        body: stringify<object>({})
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

  async function getReview (reviewId: number): Promise<ResponsePattern<ReviewDetails>> {
    const defaultErrorMessage = 'Houve uma falha com a captura da avaliação'

    try {
      const response = await fetch(`${REVIEW_PATH}/${reviewId}/get`, {
        ...buildRequestOptions([], 'GET'),
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
      }

      const data: ReviewDetails = await response.json()

      return postSuccessResponse.call(response, data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  async function handleReviewStatus (reviewId: number, action: ReviewAction): Promise<ReturnType<typeof changeReviewStatus>> {
    return changeReviewStatus({ action, reviewId }).then(response => {
      if (!response.succeeded) {
        removeClass(errorMessageElement, GENERAL_HIDDEN_CLASS)

        changeMessageText(errorMessageElement, response.message)
      } else {
        removeClass(successMessageElement, GENERAL_HIDDEN_CLASS)

        changeMessageText(successMessageElement, response.data.message)
      }

      return response
    })
  }

  function attachAction (removeNode: ReturnType<typeof querySelector>, eventNode: ReturnType<typeof querySelector>, action: ReviewAction) {
    removeElementFromDOM(removeNode)

    attachEvent(eventNode, 'click', async (e: MouseEvent) => {
      e.stopPropagation()

      const response = await handleReviewStatus(parsedReviewId, action)

      response.succeeded && removeElementFromDOM(eventNode)
    })
  }

  const parsedReviewId = parseInt(reviewId)

  getReview(parsedReviewId).then(response => {
    if (!response.succeeded) {
      for (const element of [approveButton, reproveButton, successMessageElement]) {
        removeElementFromDOM(element)
      }

      removeClass(errorMessageElement, GENERAL_HIDDEN_CLASS)

      return changeMessageText(errorMessageElement, response.message)
    }

    changeTextContent(querySelector('[data-wtf-provided-review]'), response.data.text)

    if (response.data.is_approved) {
      return attachAction(approveButton, reproveButton, 'reject')
    }

    attachAction(reproveButton, approveButton, 'approve')
  })
})()
