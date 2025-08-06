
import type {
  Binary,
} from '../global'

import {
  COOKIE_CONSENT_NAME,
  GENERAL_HIDDEN_CLASS,
  getCookie,
  setCookie,
  addClass,
  removeClass,
  attachEvent,
  querySelector,
} from '../utils'

(function() {
  const CLICK_EVENT = 'click'
  const GTM_CODE = document.currentScript?.getAttribute('data-gtm-code')

  // @ts-ignore
  window.dataLayer = window?.dataLayer || []

  function gtag (){
    // @ts-ignore
    dataLayer.push(arguments)
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

    attachEvent(querySelector('[data-wtf-consent-module-accept]'), CLICK_EVENT, function (e: MouseEvent) {
      cancelEventPropagation(e)

      applyGTM()

      setConsentCookie('1')

      addClass(consentModule, GENERAL_HIDDEN_CLASS)
    })

    attachEvent(querySelector('[data-wtf-consent-module-reject]'), CLICK_EVENT, function (e: MouseEvent) {
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

  attachEvent(querySelector('[data-wtf-consent-open]'), CLICK_EVENT, function (e: MouseEvent) {
    cancelEventPropagation(e)

    setConsentCookie('0', new Date(Date.now() - 1))

    setTimeout(startConsentModule, 500)
  })
})()
