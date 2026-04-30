
import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from './requestResponse'

import {
  getMetaTrackingCookies,
} from './adTracking'

import {
  type PageViewResponse,
  type ViewContentParams,
  type InitiateCheckoutResponse,
  type AddToCartTrackingParams,
  type AddToCartTrackingResponse,
  type ViewContentResponse,
} from '../types/tracking-events'

import {
  type ResponsePattern,
  type FunctionErrorPattern,
  type ResponsePatternCallback,
  type FunctionSucceededPattern,
} from '../global'

import {
  XANO_BASE_URL,
} from './consts'

import {
  getEndpointType,
} from '../types/cart'

import {
  stringify,
} from './dom'

import {
  EnumHttpMethods,
} from '../types/http'

const keepalive = true
const priority: RequestPriority = 'high'

export async function pageViewTracking <T extends PageViewResponse> (): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/page_view/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ]),
      priority,
      keepalive,
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

export async function viewContentTracking <T extends ViewContentResponse> ({ type, payload }: ViewContentParams): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/view_content/${type}/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ], EnumHttpMethods.POST),
      priority,
      keepalive,
      body: stringify({
        product: payload,
      }),
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

export async function initiateCheckoutTracking <T extends InitiateCheckoutResponse> (): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/initiate_checkout/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ]),
      priority,
      keepalive,
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

export async function addToCartTracking <T extends AddToCartTrackingParams, R extends AddToCartTrackingResponse> (payload: T): Promise<ResponsePattern<R>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/add_to_cart/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ], EnumHttpMethods.POST),
      priority,
      keepalive,
      body: stringify<T>(payload),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call<
        Response, [string], FunctionErrorPattern
      >(response, error)
    }

    const data: R = await response.json()

    return postSuccessResponse.call<
      Response, [R, ResponsePatternCallback?], FunctionSucceededPattern<R>
    >(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}
