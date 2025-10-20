
import type {
  BeaconOptions
} from '../types/beacon'

export function hasBeaconAPI (): boolean {
  return 'sendBeacon' in navigator
}

export function sendBeacon (
  addressAPI: string | URL,
  options?: BeaconOptions,
): boolean {
  const succeeded = navigator.sendBeacon(
    addressAPI,
    options?.data,
  )

  if (!succeeded && options?.retry && options.retry > 0) {
    return sendBeacon(addressAPI, {
      ...options,
      retry: --options.retry,
    })
  }

  return succeeded
}
