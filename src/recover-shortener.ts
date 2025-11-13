/**
 * Objetivo deste arquivo é recuperar um registro de encurtamento de URL gerada na base de dados
 */

import {
  type ResponsePattern,
} from '../global'

import {
  type ShortenerEntryResponseItem,
} from '../types/shortener'

import {
  XANO_BASE_URL,
  buildRequestOptions,
  postErrorResponse,
  postSuccessResponse,
} from '../utils'

const searchParams = new URLSearchParams(location.search)

const shortcode = searchParams.get('code')

if (!shortcode) {
  throw new Error('Nenhum identificador fornecido para a captura de URL')
}

async function getShortURL (code: string): Promise<ResponsePattern<ShortenerEntryResponseItem>> {
  const defaultErrorMessage = 'Houve uma falha ao recuperar o registro'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:V-8SS4ls/${code}`, {
      ...buildRequestOptions(),
      priority: 'high',
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    const data: ShortenerEntryResponseItem = await response.json()

    return postSuccessResponse.call(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

getShortURL(shortcode).then(response => {
  if (!response.succeeded) {
    return
  }

  location.href = response.data.original_url
})
