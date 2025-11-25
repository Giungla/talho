import {type Reader, type Writer,} from '../types/url-stateful'

import {NULL_VALUE, safeParseJson, stringify,} from './dom'
import {EMPTY_STRING} from "./consts";

export function encodeState <T> (value: T): string {
  return btoa(encodeURIComponent(stringify(value)))
}

export function decodeState <T> (value: string | null): T | null {
  if (!value) return null

  return safeParseJson(decodeURIComponent(atob(value)))
}

export function getParam (key: string): string | null {
  return new URL(window.location.href).searchParams.get(key)
}

export function setParam (key: string, value?: string | null): string {
  const url = new URL(window.location.href)

  if (!value) {
    url.searchParams.delete(key)
  } else {
    url.searchParams.set(key, value)
  }

  return url.pathname + url.search
}

export function bindURL <T> (
  key: string,
  readState: Reader<T>,
  writeState: Writer<T>,
) {
  // Inicializa estado vindo da URL
  const urlValue = decodeState<T>(getParam(key))

  if (urlValue !== NULL_VALUE) {
    writeState(urlValue)
  }

  // Função executada sempre que o estado mudar
  return () => {
    const encoded = encodeState(readState())
    const newPath = setParam(key, encoded)

    history.replaceState(NULL_VALUE, EMPTY_STRING, newPath)
  }
}
