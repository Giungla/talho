import {
  FunctionErrorPattern,
  FunctionSucceededPattern,
  GoogleContinueOAuthResponse,
} from "../global";

import {
  setCookie,
  getCookie,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils'

(function () {
  'use strict';

  const COOKIE_NAME = '__Host-Talho-AuthToken'
  const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra'

  function isAuthenticated (): boolean {
    const hasAuth = getCookie(COOKIE_NAME)

    return !!hasAuth
  }

  if (isAuthenticated()) {
    location.href = USER_DATA_PATH

    return
  }

  async function GoogleContinueOAuth (code: string | false): Promise<FunctionSucceededPattern<GoogleContinueOAuthResponse> | FunctionErrorPattern> {
    const defaultErrorMessage = 'Houve uma falha na autenticação via Google. Por favor, tente novamente mais tarde.'

    if (code === false) {
      return postErrorResponse(defaultErrorMessage)
    }

    const url = new URL('https://xef5-44zo-gegm.b2.xano.io/api:h_RKfex8/oauth/google/continue')

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

    setCookie(COOKIE_NAME, result.data.token, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: new Date(result.data.maxAge)
    })

    location.href = USER_DATA_PATH
  })
})()