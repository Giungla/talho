
import type {
  ILoginUserPayload,
  ResponsePattern
} from '../global'

import {
  XANO_BASE_URL,
  AUTH_COOKIE_NAME,
  GENERAL_HIDDEN_CLASS,
  setCookie,
  postErrorResponse,
  postSuccessResponse,
  querySelector,
  removeClass,
  changeTextContent,
  buildRequestOptions,
  isAuthenticated,
  stringify,
} from '../utils'

(function () {
  const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra'

  if (isAuthenticated()) {
    location.href = USER_DATA_PATH

    return
  }

  async function validateMagicLink (magic_token: string): Promise<ResponsePattern<ILoginUserPayload>> {
    const defaultErrorMessage = 'Houve uma falha ao validar o token. Por favor, tente novamente mais tarde.'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:uImEuFxO/auth/magic-login`, {
        ...buildRequestOptions([], 'POST'),
        body: stringify({
          magic_token
        })
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
      }

      const token: ILoginUserPayload = await response.json()

      return postSuccessResponse.call(response, token)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  const urlSearch = new URLSearchParams(location.search)
  const errorMessage = querySelector<'div'>('[data-wtf-recover-access-general-error-message]')

  const token = urlSearch.get('token')

  if (!token) return

  validateMagicLink(token).then(response => {
    const isError = !response.succeeded

    if (isError) {
      const textErrorMessage = errorMessage && querySelector('div', errorMessage)

      removeClass(errorMessage, GENERAL_HIDDEN_CLASS)

      return changeTextContent(textErrorMessage, response.message)
    }

    setCookie(AUTH_COOKIE_NAME, response.data.authToken, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(response.data.expiration)
    })

    location.href = USER_DATA_PATH
  })

})()
