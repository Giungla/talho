import {
  Binary,
  ICookieOptions,
  ISplitCookieObject
} from '../global'

(function() {
  const COOKIE_SEPARATOR = '; '
  const GENERAL_HIDDEN_CLASS = 'oculto'
  const CLICK_EVENT = 'click'
  const COOKIE_CONSENT_NAME = 'editora-contra-corrente-consent'
  const GTM_CODE = document.currentScript?.getAttribute('data-gtm-code')

  // @ts-ignore
  window.dataLayer = window?.dataLayer || []

  function gtag (){
    // @ts-ignore
    dataLayer.push(arguments)
  }

  function attachEvent <
    T extends HTMLElement | Document,
    K extends T extends HTMLElement
      ? keyof HTMLElementEventMap
      : keyof DocumentEventMap
  > (
    node: T | null,
    eventName: K,
    callback: (event: T extends HTMLElement
      ? HTMLElementEventMap[K extends keyof HTMLElementEventMap ? K : never]
      : DocumentEventMap[K extends keyof DocumentEventMap ? K : never]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): VoidFunction | void {
    if (!node) return

    node.addEventListener(eventName, callback as EventListener, options)

    return () => node.removeEventListener(eventName, callback as EventListener, options)
  }

  function querySelector<
    K extends keyof HTMLElementTagNameMap,
    T extends HTMLElementTagNameMap[K] | Element | null = HTMLElementTagNameMap[K] | null
  >(
    selector: K | string,
    node: HTMLElement | Document | null = document
  ): T {
    if (!node) return null as T

    return node.querySelector(selector as string) as T
  }

  function addClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.add(...className)
  }

  function removeClass (element: ReturnType<typeof querySelector>, ...className: string[]) {
    if (!element) return

    element.classList.remove(...className)
  }

  function setCookie (name: string, value: string | number | boolean, options: ICookieOptions = {}): string {
    if (name.length === 0) {
      throw new Error("'setCookie' should receive a valid cookie name")
    }

    if (!['string', 'number', 'boolean'].includes(typeof value) || value.toString().length === 0) {
      throw new Error("'setCookie' should receive a valid cookie value")
    }

    const cookieOptions: string[] = [`${name}=${value}`]

    if (options.expires) {
      cookieOptions.push(`expires=` + options.expires.toUTCString())
    }

    if (options.sameSite) {
      cookieOptions.push(`SameSite=${options?.sameSite}`)
    }

    if (options.path) {
      cookieOptions.push(`path=${options?.path}`)
    }

    if (options.domain) {
      cookieOptions.push(`domain=${options?.domain}`)
    }

    if (options.httpOnly) {
      cookieOptions.push(`HttpOnly`)
    }

    if (options.secure) {
      cookieOptions.push('Secure')
    }

    const _buildCookie = cookieOptions.join(COOKIE_SEPARATOR)

    document.cookie = _buildCookie

    return _buildCookie
  }

  function getCookie <T extends string> (name: string): T | false {
    const selectedCookie = document.cookie
      .split(COOKIE_SEPARATOR)
      .find(cookie => {
        const { name: cookieName } = splitCookie(cookie)

        return cookieName === name
      })

    return selectedCookie
      ? splitCookie<T>(selectedCookie).value
      : false
  }

  function splitCookie <T extends string> (cookie: string): ISplitCookieObject<T> {
    const [name, value] = cookie.split('=')

    return {
      name,
      value: value as T
    }
  }

  const consentModule = querySelector('[data-wtf-consent-module]')

  const CONSENT_VALUE = getCookie<Binary>(COOKIE_CONSENT_NAME)

  switch (CONSENT_VALUE) {
    case '0':
      console.warn('[CookieConsent] customer has refused the cookies')

      removeNoScript()

      checkoutPage()

      break
    case '1':
      console.warn('[CookieConsent] customer allowed the cookies')
      applyGTM()
      break
    case false:
      startConsentModule()
  }

  function cancelEventPropagation (event: Event) {
    event.preventDefault()
    event.stopPropagation()
  }

  function startConsentModule () {
    removeClass(consentModule, GENERAL_HIDDEN_CLASS)

    attachEvent(querySelector('[data-wtf-consent-module-accept]'), CLICK_EVENT, function (e) {
      cancelEventPropagation(e)

      applyGTM()

      setConsentCookie('1')

      addClass(consentModule, GENERAL_HIDDEN_CLASS)
    })

    attachEvent(querySelector('[data-wtf-consent-module-reject]'), CLICK_EVENT, function (e) {
      cancelEventPropagation(e)

      removeNoScript()
      checkoutPage()

      setConsentCookie('0')

      addClass(consentModule, GENERAL_HIDDEN_CLASS)
    })
  }

  function removeNoScript () {
    document.querySelectorAll('#fb-noscript, #linkedin-noscript').forEach(element => {
      element.remove()
    })
  }

  function checkoutPage () {
    if (location.pathname.includes('checkout')) {
      applyGTM()

      return
    }

    querySelector('#gtm-noscript')?.remove()
  }

  function setConsentCookie (value: Binary, expires: Date = new Date(Date.now() + 7_776_000_000)) {
    setCookie(COOKIE_CONSENT_NAME, value, {
      expires,
      path: '/',
      secure: true,
      sameSite: 'None',
    })
  }

  function applyGTM (GTMCode: string = GTM_CODE ?? '') {
    (function(w,d,s,l,i){ // @ts-ignore
      w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:''; // @ts-ignore
      j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl; // @ts-ignore
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',GTMCode);
  }

  attachEvent(querySelector('[data-wtf-consent-open]'), CLICK_EVENT, function (e) {
    cancelEventPropagation(e)

    setConsentCookie('0', new Date(Date.now() - 1))

    setTimeout(startConsentModule, 500)
  })
})()
