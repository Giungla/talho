
import {
  CartAbandonmentResponse,
} from '../types/abandonment'

import {
  DEFAULT_SESSION_COOKIE_OPTIONS,
  getCookie,
  setCookie,
  stringify,
  safeParseJson,
} from './index'

export const TALHO_ABANDONMENT_HEADER_NAME = 'x-talho-abandonment-id'
export const TALHO_ABANDONMENT_COOKIE_NAME = '__Host-Talho-Abandonment-Session'

/**
 * @description Atualiza o valor e duração do cookie que contém os dados do carrinho abandonado
 */
export function refreshAbandonmentEntry (abandonment: CartAbandonmentResponse): void {
  setCookie(
    TALHO_ABANDONMENT_COOKIE_NAME,
    encodeURIComponent(stringify<CartAbandonmentResponse>(abandonment)),
    DEFAULT_SESSION_COOKIE_OPTIONS,
  )
}

/**
 * @description Retorna o header do carrinho abandonado no formato esperado pelo método `buildRequestOptions`
 */
export function abandonmentHeader (): [string, string] | undefined {
  const abandonmentHeader = getCookie(TALHO_ABANDONMENT_COOKIE_NAME)

  if (!abandonmentHeader) return

  const abandonment = safeParseJson<CartAbandonmentResponse>(decodeURI(abandonmentHeader))

  return [
    TALHO_ABANDONMENT_HEADER_NAME,
    `${abandonment?.cart_id}|${abandonment?.cart_validator}`
  ]
}
