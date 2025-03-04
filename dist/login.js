(function () {
    'use strict';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const COOKIE_SEPARATOR = '; ';
    const DISABLED_ATTR = 'disabled';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const ERROR_MESSAGE_CLASS = 'mensagemdeerro';
    const ORDERS_PAGE_PATH = '/area-do-usuario/pedidos-de-compra';
    const REDIRECT_PARAM_NAME = 'redirect_to';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    const GENERAL_ERROR_MESSAGE_SELECTOR = '[data-wtf-general-error-message]';
    const SCROLL_INTO_VIEW_DEFAULT_ARGS = {
        block: 'center',
        behavior: 'smooth'
    };
    const FOCUS_OPTIONS = {
        preventScroll: false
    };
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
    function scrollIntoView(element, args) {
        element.scrollIntoView(args);
    }
    function setCookie(name, value, options = {}) {
        if (name.length === 0) {
            throw new Error("'setCookie' should receive a valid cookie name");
        }
        if (!['string', 'number', 'boolean'].includes(typeof value) || value.toString().length === 0) {
            throw new Error("'setCookie' should receive a valid cookie value");
        }
        const cookieOptions = [`${name}=${value}`];
        if (options?.expires && options?.expires instanceof Date) {
            cookieOptions.push(`expires=` + options.expires.toUTCString());
        }
        if (options?.sameSite && typeof options?.sameSite === 'string') {
            cookieOptions.push(`SameSite=${options?.sameSite}`);
        }
        if (options?.path) {
            cookieOptions.push(`path=${options?.path}`);
        }
        if (options?.domain) {
            cookieOptions.push(`domain=${options?.path}`);
        }
        if (options?.httpOnly) {
            cookieOptions.push(`HttpOnly`);
        }
        if (options?.secure) {
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
            value
        };
    }
    function isAuthenticated() {
        const hasAuth = getCookie(COOKIE_NAME);
        return !!hasAuth;
    }
    function postErrorResponse(message) {
        return {
            message,
            succeeded: false
        };
    }
    function postSuccessResponse(response) {
        return {
            data: response,
            succeeded: true
        };
    }
    async function loginUser(credentials) {
        const defaultErrorMessage = 'Houve uma falha ao realizar o login. Por favor, tente novamente mais tarde.';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:t3reRXiD/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const data = await response.json();
            return postSuccessResponse(data);
        }
        catch (e) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    async function getGoogleAuthorizationURL() {
        const defaultErrorMessage = 'Houve uma falha na autorização Google. Por favor, tente novamente mais tarde.';
        const url = new URL(`${XANO_BASE_URL}/api:h_RKfex8/oauth/google/init`);
        url.searchParams.set('redirect_uri', location.origin.concat('/acessos/google-social-login'));
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const data = await response.json();
            return postSuccessResponse(data);
        }
        catch (e) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    function objectSize(value) {
        return value.length;
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
    function toggleClass(element, className, force) {
        if (!element)
            return false;
        return element.classList.toggle(className, force);
    }
    function camelToKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    function removeAttribute(element, qualifiedName) {
        if (!element)
            return;
        element.removeAttribute(qualifiedName);
    }
    function focusInput(input, options) {
        if (!input)
            return;
        input.focus(options);
    }
    function whereRedirectAfterSuccessfulLogin() {
        const currentURL = new URL(location.href);
        const redirectTo = currentURL.searchParams.get(REDIRECT_PARAM_NAME);
        return redirectTo
            ? decodeURIComponent(redirectTo)
            : ORDERS_PAGE_PATH;
    }
    if (isAuthenticated()) {
        location.href = whereRedirectAfterSuccessfulLogin();
        return;
    }
    const _loginForm = querySelector('#wf-form-login');
    const removalAttributes = [
        'name',
        'method',
        'aria-label',
        'data-wf-page-id',
        'data-wf-element-id',
        'data-turnstile-sitekey'
    ];
    if (_loginForm) {
        for (let attr of removalAttributes) {
            removeAttribute(_loginForm, attr);
        }
        const parentNode = _loginForm.parentNode;
        removeClass(parentNode, 'w-form');
        _loginForm.remove();
        parentNode.insertAdjacentHTML('afterbegin', _loginForm.outerHTML);
    }
    const loginForm = querySelector('#wf-form-login');
    const searchParams = new URLSearchParams(location.search);
    const userField = querySelector('[data-wtf-user]');
    const passField = querySelector('[data-wtf-password]');
    const loginSubmitButton = querySelector('[type="submit"]', loginForm);
    const socialLoginGoogleCTA = querySelector('[data-wtf-google]');
    if (searchParams.has('email')) {
        if (userField) {
            userField.value = searchParams.get('email') ?? '';
        }
        focusInput(passField, FOCUS_OPTIONS);
    }
    else {
        focusInput(userField, FOCUS_OPTIONS);
    }
    function validatorResponse(datasetName) {
        return function (valid) {
            return [datasetName, valid];
        };
    }
    function applyWrapperError(element, isValid) {
        if (!element)
            return;
        const wrapperElement = element.closest('[data-wtf-wrapper]');
        wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid);
    }
    function clearMessage(form) {
        if (!form)
            return;
        addClass(querySelector(GENERAL_ERROR_MESSAGE_SELECTOR, form), GENERAL_HIDDEN_CLASS);
    }
    function handleMessages(form, response) {
        const isError = !response.succeeded;
        const errorMessage = querySelector(GENERAL_ERROR_MESSAGE_SELECTOR, form);
        toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError);
        if (!isError)
            return;
        const textElement = errorMessage && querySelector('div', errorMessage);
        if (!textElement)
            return;
        textElement.textContent = response.message;
    }
    function validateUserField() {
        const response = validatorResponse('wtfUser');
        if (!userField)
            return response(false);
        const isFieldValid = /^(([\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+)*)|("[\p{L}\p{N}\s!#$%&'*+\/=?^_`{|}~.-]+"))@(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}|(\[(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\]))$/u.test(userField.value);
        applyWrapperError(userField, isFieldValid);
        return response(isFieldValid);
    }
    function validatePassField() {
        const response = validatorResponse('wtfPassword');
        if (!passField)
            return response(false);
        const isFieldValid = objectSize(passField.value) > 7;
        applyWrapperError(passField, isFieldValid);
        return response(isFieldValid);
    }
    attachEvent(socialLoginGoogleCTA, 'click', function (e) {
        e.preventDefault();
        getGoogleAuthorizationURL()
            .then(result => {
            if (!result.succeeded) {
                // TODO: Display a error message letting user know about this error
                return;
            }
            location.href = result.data.authUrl;
        });
    }, { once: true });
    const validators = [
        { field: userField, validator: validateUserField },
        { field: passField, validator: validatePassField },
    ];
    for (const { field, validator } of validators) {
        attachEvent(field, 'blur', validator);
        attachEvent(field, 'input', () => applyWrapperError(field, true));
    }
    if (!loginForm) {
        console.warn('[WithTheFlow] Form was not founded at this page');
        return;
    }
    attachEvent(loginForm, 'submit', async (e) => {
        loginSubmitButton?.setAttribute(DISABLED_ATTR, DISABLED_ATTR);
        e.preventDefault();
        e.stopPropagation();
        clearMessage(loginForm);
        const _validators = validators.map(({ validator }) => validator);
        const failed = _validators.find(validator => validator().at(1) === false);
        if (failed) {
            const attribute = camelToKebabCase(failed().at(0));
            focusInput(querySelector(`[data-${attribute}]`, loginForm), FOCUS_OPTIONS);
            return removeAttribute(loginSubmitButton, DISABLED_ATTR);
        }
        const response = await loginUser({
            email: userField?.value,
            password: passField?.value,
        });
        if (response.succeeded) {
            setCookie(COOKIE_NAME, response.data.authToken, {
                path: '/',
                secure: true,
                sameSite: 'Strict',
                expires: new Date(response.data.expiration)
            });
            location.href = whereRedirectAfterSuccessfulLogin();
            return;
        }
        handleMessages(loginForm, postErrorResponse(response.message));
        removeAttribute(loginSubmitButton, DISABLED_ATTR);
    });
    removeAttribute(loginSubmitButton, DISABLED_ATTR);
})();
export {};
