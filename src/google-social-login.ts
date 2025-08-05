import {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  GoogleContinueOAuthResponse,
} from "../global";

import {
  XANO_BASE_URL,
  AUTH_COOKIE_NAME,
  setCookie,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  isAuthenticated,
} from '../utils'

(function () {
  const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra'

  if (isAuthenticated()) {
    location.href = USER_DATA_PATH

    return
  }

  async function GoogleContinueOAuth (code: string | false): Promise<FunctionSucceededPattern<GoogleContinueOAuthResponse> | FunctionErrorPattern> {
    const defaultErrorMessage = 'Houve uma falha na autenticação via Google. Por favor, tente novamente mais tarde.'

    if (code === false) {
      return postErrorResponse(defaultErrorMessage)
    }

    const url = new URL(`${XANO_BASE_URL}/api:h_RKfex8/oauth/google/continue`)

    url.searchParams.set('code', code)
    url.searchParams.set('redirect_uri', location.origin.concat(location.pathname))

    const currentURL = new URL(location.href)

    const removalKeys: string[] = [
      'code',
      'scope',
      'authuser',
      'hd',
      'prompt'
    ];

    for (const key of removalKeys) {
      currentURL.searchParams.delete(key)
    }

    history.replaceState(null, '', currentURL.toString())

    try {
      const response = await fetch(url, {
        ...buildRequestOptions()
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response.headers, error?.message ?? defaultErrorMessage)
      }

      const data: GoogleContinueOAuthResponse = await response.json()

      return postSuccessResponse.call(response.headers, data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  const search = new URLSearchParams(location.search)

  GoogleContinueOAuth(search.get('code') ?? false).then(result => {
    if (!result.succeeded) {
      return console.warn('[Social Login] %s', result.message)
    }

    setCookie(AUTH_COOKIE_NAME, result.data.token, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(result.data.maxAge)
    })

    location.href = USER_DATA_PATH
  })
})()