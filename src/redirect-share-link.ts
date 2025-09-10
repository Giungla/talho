
import type {
  ResponsePattern
} from '../global'

import type {
  ShareLinkResponse
} from '../types/redirect-share-link'

import {
  XANO_BASE_URL,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils'

const searchParams = new URLSearchParams(location.search)

const orderId = searchParams.get('order_id')

if (!orderId) {
  throw new Error(`You must provide a 'order_id' with a valid order`)
}

async function getShareLink (orderId: number): Promise<ResponsePattern<ShareLinkResponse>> {
  const defaultErrorMessage = 'Não foi possível encontrar o link de rastreio'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:jiIoKYhH/order/share-link?order_id=${orderId}`, {
      ...buildRequestOptions(),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    const data: ShareLinkResponse = await response.json()

    return postSuccessResponse.call(response, data)
  } catch (e) {
    return postErrorResponse(e)
  }
}

getShareLink(parseInt(orderId))
  .then(response => {
    if (!response.succeeded) {
      return alert(response.message)
    }

    location.href = response.data.share_link
  })
