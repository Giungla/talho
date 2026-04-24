
import {
  AUTH_COOKIE_NAME
} from '../utils/requestResponse'

import {
  getCookie,
} from '../utils/cookie'

export const ENDPOINT_TYPE = ({
  USER: 'user',
  GUEST: 'guest',
}) as const

export type EndpointType = typeof ENDPOINT_TYPE

export type EndpointTypes = EndpointType[keyof EndpointType]

export function getEndpointType (): EndpointTypes {
  return getCookie(AUTH_COOKIE_NAME) === false
    ? ENDPOINT_TYPE.GUEST
    : ENDPOINT_TYPE.USER
}
