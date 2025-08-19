
import type {
  ResponsePattern
} from '../global'

import {
  XANO_BASE_URL,
  AUTH_COOKIE_NAME,
  getCookie,
  setCookie,
  postErrorResponse,
  buildRequestOptions,
  postSuccessResponse,
} from '../utils'

function deleteCookie (name: string) {
  setCookie(name, '=', {
    path: '/',
    secure: true,
    sameSite: 'Strict',
    expires: new Date(0)
  })
}

async function logout (): Promise<ResponsePattern<null>> {
  const defaultErrorMessage = 'Houve um erro com o processo de logout'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:t3reRXiD/auth/logout`, {
      ...buildRequestOptions([], 'DELETE'),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    return postSuccessResponse.call(response, null)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

function switchLoggedItems () {
  if (getCookie(AUTH_COOKIE_NAME) === false) {
    document.querySelectorAll('[data-wtf-auth-element]').forEach(element => {
      element.remove()
    })

    return
  }

  document.querySelectorAll('[data-wtf-authless-element]').forEach(element => {
    element.remove()
  })

  document.querySelectorAll('[data-wtf-button-logout]').forEach(el => {
    el.addEventListener('click', async () => {
      const { succeeded } = await logout()

      if (!succeeded) return

      deleteCookie(AUTH_COOKIE_NAME)

      location.reload()
    }, false)
  })
}

switchLoggedItems()
