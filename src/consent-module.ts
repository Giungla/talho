
import type {
  Binary,
} from '../global'

import {
  COOKIE_CONSENT_NAME,
} from '../utils/consts'

import {
  addClass,
  removeClass,
  attachEvent,
  querySelector,
  GENERAL_HIDDEN_CLASS,
} from '../utils/dom'

import {
  getCookie,
  setCookie,
} from '../utils/cookie'

(function() {
  const CLICK_EVENT = 'click'
  const GTM_CODE = document.currentScript?.getAttribute('data-gtm-code')

  // @ts-ignore
  window.dataLayer = window?.dataLayer || []

  // function gtag (){
  //   // @ts-ignore
  //   dataLayer.push(arguments)
  // }

  const consentModule = querySelector('[data-wtf-consent-module]')

  const CONSENT_VALUE = getCookie<Binary>(COOKIE_CONSENT_NAME)

  switch (CONSENT_VALUE) {
    case '0':
      console.warn('[CookieConsent] customer has refused the cookies')

      removeNoScript()

      checkoutPage()

      updateGtag('denied')

      break
    case '1':
      updateGtag('granted')
      console.warn('[CookieConsent] customer allowed the cookies')
      break
    case false:
    default:
      startConsentModule()
  }

  function cancelEventPropagation (event: Event) {
    event.preventDefault()
    event.stopPropagation()
  }

  function updateGtag (consent: "granted" | "denied") {
    gtag('consent', 'update', {
      'ad_storage': consent,
      'analytics_storage': consent,
      'ad_user_data': consent,
      'ad_personalization': consent,
    })
  }

  function startConsentModule () {
    removeClass(consentModule, GENERAL_HIDDEN_CLASS)

    attachEvent(querySelector('[data-wtf-consent-module-accept]'), CLICK_EVENT, function (e: MouseEvent) {
      cancelEventPropagation(e)

      setConsentCookie('1')

      addClass(consentModule, GENERAL_HIDDEN_CLASS)

      updateGtag('granted')
    })

    attachEvent(querySelector('[data-wtf-consent-module-reject]'), CLICK_EVENT, function (e: MouseEvent) {
      cancelEventPropagation(e)

      removeNoScript()
      checkoutPage()

      setConsentCookie('0')

      addClass(consentModule, GENERAL_HIDDEN_CLASS)

      updateGtag('denied')
    })
  }

  function removeNoScript () {
    document.querySelectorAll('#fb-noscript, #linkedin-noscript').forEach(element => {
      element.remove()
    })
  }

  function checkoutPage () {
    if (location.pathname.includes('checkout')) {
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

  attachEvent(querySelector('[data-wtf-consent-open]'), CLICK_EVENT, function (e: MouseEvent) {
    cancelEventPropagation(e)

    setConsentCookie('0', new Date(Date.now() - 1))

    setTimeout(startConsentModule, 500)
  })
})()
