
import {
  stringify,
  safeParseJson,
} from './dom'

import {
  EMPTY_OBJ,
} from './consts'

export const STORE_USER_KEY = 'talho_info'

export function storeSingleField (fieldName: string, value: string): void {
  const storedInfo = localStorage.getItem(STORE_USER_KEY)

  const parsedStoredInfo = safeParseJson<object>(storedInfo)

  if (!storedInfo || !parsedStoredInfo) {
    return localStorage.setItem(STORE_USER_KEY, stringify({
      [fieldName]: value,
    }))
  }

  return localStorage.setItem(STORE_USER_KEY, stringify({
    ...parsedStoredInfo,
    [fieldName]: value,
  }))
}

export function recoverFields (): Record<string, string> {
  const storedInfo = localStorage.getItem(STORE_USER_KEY)

  if (!storedInfo) {
    return EMPTY_OBJ
  }

  return safeParseJson<Record<string, string>>(storedInfo) ?? EMPTY_OBJ
}

export function clearStoredFields (): void {
  localStorage.removeItem(STORE_USER_KEY)
}
