
import {
  type IStateAcronym,
} from '../global'

export const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io'

export const STORAGE_KEY_NAME = 'talho_cart_items'

export const FREE_SHIPPING_MIN_CART_PRICE = 400

export const statesMap = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
}

export const statesAcronym = Object.keys(statesMap) as IStateAcronym[]

export const statesValues = Object.values(statesMap)

export const COOKIE_CONSENT_NAME = 'talho-carnes-consent'

export const EMPTY_STRING = ''
export const SLASH_STRING = '/'
export const PIPE_STRING = '|'
