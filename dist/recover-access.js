(function () {
    'use strict';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const COOKIE_SEPARATOR = '; ';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const DISABLED_ATTR = 'disabled';
    const ERROR_MESSAGE_CLASS = 'mensagemdeerro';
    const WRAPPER_SELECTOR = '[data-wtf-wrapper]';
    const USER_DATA_PATH = '/area-do-usuario/pedidos-de-compra';
    const formSelector = '#wf-form-recover-password';
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
    function validatorResponse(datasetName) {
        return function (valid) {
            return [datasetName, valid];
        };
    }
    function applyWrapperError(element, isValid) {
        if (!element)
            return;
        const wrapperElement = element.closest(WRAPPER_SELECTOR);
        wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid);
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
    function removeAttribute(element, qualifiedName) {
        if (!element)
            return;
        element.removeAttribute(qualifiedName);
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
    function handleMessages(form, response) {
        const isError = !response.succeeded;
        if (!form)
            return;
        const errorMessage = querySelector('[data-wtf-general-error-message]', form);
        const successMessage = querySelector('[data-wtf-success-message]', form);
        toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError);
        toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError);
        if (!isError)
            return;
        const textElement = errorMessage && querySelector('div', errorMessage);
        if (!textElement)
            return;
        textElement.textContent = response.message;
    }
    async function sendMagicLink(email) {
        const defaultErrorMessage = 'Houve uma falha ao enviar o token. Por favor, tente novamente mais tarde.';
        try {
            const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:uImEuFxO/auth/magic-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email }),
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
    if (isAuthenticated()) {
        location.href = USER_DATA_PATH;
        return;
    }
    const _resetForm = querySelector(formSelector);
    if (_resetForm) {
        const removalAttributes = [
            'name',
            'method',
            'data-name',
            'aria-label',
            'data-wf-page-id',
            'data-wf-element-id',
            'data-turnstile-sitekey'
        ];
        for (const attr of removalAttributes) {
            removeAttribute(_resetForm, attr);
        }
        const parentNode = _resetForm.parentNode;
        _resetForm.remove();
        removeClass(parentNode, 'w-form');
        parentNode.insertAdjacentHTML('afterbegin', _resetForm.outerHTML);
    }
    const resetForm = querySelector(formSelector);
    const formSubmit = querySelector('[type="submit"]', resetForm);
    removeAttribute(formSubmit, DISABLED_ATTR);
    const mailField = querySelector('[data-wtf-user]');
    function validateMailField() {
        const response = validatorResponse('wtfEmail');
        if (!mailField)
            return response(false);
        const isFieldValid = /^(([\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+)*)|("[\p{L}\p{N}\s!#$%&'*+\/=?^_`{|}~.-]+"))@(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}|(\[(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\]))$/u.test(mailField.value);
        applyWrapperError(mailField, isFieldValid);
        return response(isFieldValid);
    }
    attachEvent(mailField, 'blur', validateMailField);
    attachEvent(mailField, 'input', () => applyWrapperError(mailField, true));
    attachEvent(resetForm, 'submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        formSubmit?.setAttribute(DISABLED_ATTR, DISABLED_ATTR);
        const [, isFieldValid] = validateMailField();
        if (!isFieldValid) {
            handleMessages(resetForm, postErrorResponse('Houve uma falha ao validar seus dados. Por favor, tente novamente.'));
            return removeAttribute(formSubmit, DISABLED_ATTR);
        }
        sendMagicLink(mailField?.value ?? '').then(response => {
            handleMessages(resetForm, response);
            removeAttribute(formSubmit, DISABLED_ATTR);
            response.succeeded && resetForm?.reset();
        });
    }, false);
})();
export {};
