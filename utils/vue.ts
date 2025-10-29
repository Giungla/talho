
import {
  attachEvent,
  INPUT_EVENT,
  EMPTY_STRING,
} from './index'

export const eventMap: WeakMap<HTMLElement, ReturnType<typeof attachEvent>> = new WeakMap()

export const cleanupDirective = (el: HTMLInputElement) => {
  const cleanup = eventMap.get(el)

  if (!cleanup) return

  cleanup()

  eventMap.delete(el)
}

export function buildMaskDirective (...mappers: ((value: string) => string)[]) {
  return {
    mounted (el: HTMLInputElement) {
      const remover = attachEvent(el, 'input', (event: Event) => {
        if (!event.isTrusted) return

        const target = event.target as HTMLInputElement

        target.value = mappers.reduce((value, callbackFn) => callbackFn(value), target.value ?? EMPTY_STRING)

        el.dispatchEvent(INPUT_EVENT)
      })

      eventMap.set(el, remover)
    },

    unmounted: cleanupDirective
  }
}
