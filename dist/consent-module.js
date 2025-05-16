(function () {
    const COOKIE_SEPARATOR = '; ';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const CLICK_EVENT = 'click';
    const COOKIE_CONSENT_NAME = 'talho-consent';
    // @ts-ignore
    window.dataLayer = window?.dataLayer || [];
    function gtag() {
        // @ts-ignore
        dataLayer.push(arguments);
    }
    function attachEvent(node, eventName, callback, options) {
        if (!node)
            return;
        node.addEventListener(eventName, callback, options);
        return () => node.removeEventListener(eventName, callback, options);
    }
    function querySelector(selector, node = document) {
        if (!node)
            return null;
        return node.querySelector(selector);
    }
    function addClass(element, ...className) {
        if (!element)
            return;
        element.classList.add(...className);
    }
    function removeClass(element, ...className) {
        if (!element)
            return;
        element.classList.remove(...className);
    }
    function setCookie(name, value, options = {}) {
        if (name.length === 0) {
            throw new Error("'setCookie' should receive a valid cookie name");
        }
        if (!['string', 'number', 'boolean'].includes(typeof value) || value.toString().length === 0) {
            throw new Error("'setCookie' should receive a valid cookie value");
        }
        const cookieOptions = [`${name}=${value}`];
        if (options.expires) {
            cookieOptions.push(`expires=` + options.expires.toUTCString());
        }
        if (options.sameSite) {
            cookieOptions.push(`SameSite=${options?.sameSite}`);
        }
        if (options.path) {
            cookieOptions.push(`path=${options?.path}`);
        }
        if (options.domain) {
            cookieOptions.push(`domain=${options?.domain}`);
        }
        if (options.httpOnly) {
            cookieOptions.push(`HttpOnly`);
        }
        if (options.secure) {
            cookieOptions.push('Secure');
        }
        const _buildCookie = cookieOptions.join(COOKIE_SEPARATOR);
        document.cookie = _buildCookie;
        return _buildCookie;
    }
    function getCookie(name) {
        const selectedCookie = document.cookie
            .split(COOKIE_SEPARATOR)
            .find(cookie => {
            const { name: cookieName } = splitCookie(cookie);
            return cookieName === name;
        });
        return selectedCookie
            ? splitCookie(selectedCookie).value
            : false;
    }
    function splitCookie(cookie) {
        const [name, value] = cookie.split('=');
        return {
            name,
            value: value
        };
    }
    const consentModule = querySelector('[data-wtf-consent-module]');
    const CONSENT_VALUE = getCookie(COOKIE_CONSENT_NAME);
    switch (CONSENT_VALUE) {
        case '0':
            console.warn('[CookieConsent] customer has refused the cookies');
            removeNoScript();
            checkoutPage();
            break;
        case '1':
            console.warn('[CookieConsent] customer allowed the cookies');
            applyGTM();
            break;
        case false:
            startConsentModule();
    }
    function cancelEventPropagation(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    function startConsentModule() {
        removeClass(consentModule, GENERAL_HIDDEN_CLASS);
        attachEvent(querySelector('[data-wtf-consent-module-accept]'), CLICK_EVENT, function (e) {
            cancelEventPropagation(e);
            applyGTM();
            setConsentCookie('1');
            addClass(consentModule, GENERAL_HIDDEN_CLASS);
        });
        attachEvent(querySelector('[data-wtf-consent-module-reject]'), CLICK_EVENT, function (e) {
            cancelEventPropagation(e);
            removeNoScript();
            checkoutPage();
            setConsentCookie('0');
            addClass(consentModule, GENERAL_HIDDEN_CLASS);
        });
    }
    function removeNoScript() {
        document.querySelectorAll('#fb-noscript, #linkedin-noscript').forEach(element => {
            element.remove();
        });
    }
    function checkoutPage() {
        if (location.pathname.includes('checkout')) {
            applyGTM();
            return;
        }
        querySelector('#gtm-noscript')?.remove();
    }
    function setConsentCookie(value, expires = new Date(Date.now() + 7_776_000_000)) {
        setCookie(COOKIE_CONSENT_NAME, value, {
            expires,
            path: '/',
            secure: true,
            sameSite: 'None',
        });
    }
    function applyGTM(GTMCode = document.currentScript?.getAttribute('data-gtm-code') ?? '') {
        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; // @ts-ignore
            j.async = true;
            j.src =
                'https://www.googletagmanager.com/gtm.js?id=' + i + dl; // @ts-ignore
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', GTMCode);
    }
    attachEvent(querySelector('[data-wtf-consent-open]'), CLICK_EVENT, function (e) {
        cancelEventPropagation(e);
        setConsentCookie('0', new Date(Date.now() - 1));
        setTimeout(startConsentModule, 500);
    });
})();
export {};
