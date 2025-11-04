
/**
 * Script responsável pela realização do processo de ativação de uma conta,
 * Após o recebimento do token no e-mail do usuário
 */

import {
  type ResponsePattern,
} from '../global'

import {
  type ActivateAccountResponse,
} from '../types/activate-account'

import {
  XANO_BASE_URL,
  buildRequestOptions,
  buildURL,
  isAuthenticated,
  postErrorResponse,
  postSuccessResponse,
} from '../utils'

(function () {
  if (isAuthenticated()) {
    location.href = buildURL('/area-do-usuario/pedidos-de-compra')

    return
  }

  const searchParams = new URLSearchParams(location.search)

  const accountToken = searchParams.get('token')

  if (!accountToken) {
    location.href = buildURL('/acessos/recuperar-acesso')

    return
  }

  async function validateAccountToken (token: string): Promise<ResponsePattern<ActivateAccountResponse>> {
    const defaultErrorMessage = 'Houve uma falha com o processo de ativação de sua conta'

    try {
      const response = await fetch(`${XANO_BASE_URL}/api:t3reRXiD/search_account/${token}`, {
        ...buildRequestOptions(),
        keepalive: true,
        priority: 'high',
      })

      if (!response.ok) {
        const error = await response.json()

        return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
      }

      const data: ActivateAccountResponse = await response.json()

      return postSuccessResponse.call(response, data)
    } catch (e) {
      return postErrorResponse(defaultErrorMessage)
    }
  }

  validateAccountToken(accountToken).then(response => {
    if (!response.succeeded) {
      return alert('Houve uma falha com a ativação de sua conta')
    }

    location.href = buildURL('/acessos/entrar', {
      email: response.data.email,
    })
  })
})()
