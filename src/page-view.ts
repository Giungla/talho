
import {
  type ResponsePattern,
  type FunctionErrorPattern,
  type ResponsePatternCallback,
  type FunctionSucceededPattern,
} from '../global'

import {
  XANO_BASE_URL,
} from '../utils/consts'

import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils/requestResponse'

import {
  getMetaTrackingCookies,
} from '../utils/adTracking'

import {
  type PageViewResponse,
} from '../types/pageView'

import {
  getEndpointType,
} from '../types/cart'

async function pageView <T extends PageViewResponse> (): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/page_view/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ]),
      keepalive: true,
      priority: 'high',
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call<
        Response, [string], FunctionErrorPattern
      >(response, error)
    }

    const data: T = await response.json()

    return postSuccessResponse.call<
      Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>
    >(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

pageView().then(response => {
  if (!response.succeeded) return

  fbq?.('track', 'PageView', {}, {
    eventID: response.data.meta_event_id,
  })
})
