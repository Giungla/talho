(function () {
    'use strict';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const COOKIE_SEPARATOR = '; ';
    const DISABLED_ATTR = 'disabled';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const ERROR_MESSAGE_CLASS = 'mensagemdeerro';
    const WRAPPER_SELECTOR = '[data-wtf-wrapper]';
    const FOCUS_OPTIONS = {
        preventScroll: false
    };
    const SCROLL_INTO_VIEW_DEFAULT_ARGS = {
        block: 'center',
        behavior: 'smooth'
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
    function normalizeText(text) {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }
    function focusInput(input, options) {
        if (!input)
            return;
        input.focus(options);
    }
    function scrollIntoView(element, args) {
        if (!element)
            return;
        element.scrollIntoView(args);
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
    function camelToKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    function handleMessages(form, response) {
        const isError = !response.succeeded;
        const successMessage = querySelector('[data-wtf-success-message]', form);
        toggleClass(generalErrorMessage, GENERAL_HIDDEN_CLASS, !isError);
        toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError);
        if (!isError) {
            setTimeout(() => addClass(successMessage, GENERAL_HIDDEN_CLASS), 8000);
            return;
        }
        changeErrorMessage(response.message, generalErrorMessage);
    }
    function addAttribute(element, qualifiedName, value) {
        if (!element)
            return;
        element.setAttribute(qualifiedName, value);
    }
    function removeAttribute(element, qualifiedName) {
        if (!element)
            return;
        element.removeAttribute(qualifiedName);
    }
    function validatorResponse(datasetName) {
        return function (valid) {
            return [datasetName, valid];
        };
    }
    function toggleClass(element, className, force) {
        if (!element)
            return false;
        return element.classList.toggle(className, force);
    }
    function applyWrapperError(element, isValid) {
        if (!element)
            return;
        const wrapperElement = element.closest('[data-wtf-wrapper]');
        wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid);
    }
    function postErrorResponse(message) {
        return {
            message,
            succeeded: false,
        };
    }
    function postSuccessResponse(response) {
        return {
            data: response,
            succeeded: true,
        };
    }
    async function signupUser(payload) {
        const defaultErrorMessage = 'Houve uma falha ao realizar o cadastro. Por favor, tente novamente mais tarde.';
        try {
            const response = await fetch(`https://xef5-44zo-gegm.b2.xano.io/api:t3reRXiD/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
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
        location.href = '/area-do-usuario/pedidos-de-compra';
        return;
    }
    const form = querySelector('#wf-form-register');
    if (form) {
        const removalAttributes = [
            'name',
            'method',
            'data-name',
            'aria-label',
            'data-wf-page-id',
            'data-wf-element-id',
            'data-turnstile-sitekey',
            'data-wf-user-form-type'
        ];
        for (let attr of removalAttributes) {
            removeAttribute(form, attr);
        }
        const parentNode = form.parentElement;
        removeClass(parentNode, 'w-form');
        form.remove();
        parentNode.insertAdjacentHTML('afterbegin', form.outerHTML);
    }
    const signupForm = querySelector('#wf-form-register');
    const generalErrorMessage = querySelector('[data-wtf-general-error-message]', signupForm);
    const nameField = querySelector('[data-wtf-name]', signupForm);
    const lastNameField = querySelector('[data-wtf-last-name]', signupForm);
    const emailField = querySelector('[data-wtf-email]', signupForm);
    const passField = querySelector('[data-wtf-password]', signupForm);
    const consentField = querySelector('[data-wtf-consent]', signupForm);
    const privacyField = querySelector('[data-wtf-optin]', signupForm);
    const submitForm = querySelector('input[type="submit"]', signupForm);
    function changeErrorMessage(message, errorElement) {
        if (!errorElement)
            return;
        const errorMessageElement = querySelector('div', errorElement);
        if (!errorMessageElement)
            return;
        errorMessageElement.textContent = message;
    }
    function passwordMismatchMessage({ hasNumber, hasLowercase, hasUppercase, hasMinLength, hasSpecialChar }) {
        const message = (quantifier, missing) => `Sua senha deve conter pelo menos ${quantifier} ${missing}.`;
        if (!hasMinLength)
            return message(8, 'caracteres');
        if (!hasNumber)
            return message(1, 'número');
        if (!hasSpecialChar)
            return message(1, 'caractere especial');
        if (!hasLowercase)
            return message(1, 'letra minúscula');
        if (!hasUppercase)
            return message(1, 'letra maiúscula');
        return false;
    }
    function updateFieldErrorMessage(field, message) {
        if (!field)
            return;
        const wrapper = field.closest(WRAPPER_SELECTOR);
        if (!wrapper)
            return;
        const messageArea = querySelector('[data-wtf-field-error] div', wrapper);
        if (!messageArea)
            return;
        messageArea.textContent = message;
    }
    function textTestRegex(value) {
        return (regex) => regex.test(value);
    }
    function validatePasswordParts(password) {
        const testRegex = textTestRegex(password);
        return {
            hasNumber: testRegex(/\d/),
            hasLowercase: testRegex(/[a-z]/),
            hasUppercase: testRegex(/[A-Z]/),
            hasMinLength: testRegex(/.{8,}/),
            hasSpecialChar: testRegex(/[!@#$%^&*()_+{}\[\]:;<>,.?\/~\\-]/),
        };
    }
    function validateNameField() {
        const response = validatorResponse('wtfUser');
        if (!nameField)
            return response(false);
        const cleanName = normalizeText(nameField.value).trim().replace(/\s{2,}/g, ' ');
        const isFieldValid = !/\d+/.test(cleanName) && cleanName.length > 1;
        applyWrapperError(nameField, isFieldValid);
        return response(isFieldValid);
    }
    function validateLastNameField() {
        const response = validatorResponse('wtfLastName');
        if (!lastNameField)
            return response(false);
        const cleanName = normalizeText(lastNameField.value).trim().replace(/\s{2,}/g, ' ');
        const isFieldValid = !/\d+/.test(cleanName) && cleanName.length > 0;
        applyWrapperError(lastNameField, isFieldValid);
        return response(isFieldValid);
    }
    function validateEmailField() {
        const response = validatorResponse('wtfEmail');
        if (!emailField)
            return response(false);
        const isFieldValid = /^(([\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+)*)|("[\p{L}\p{N}\s!#$%&'*+\/=?^_`{|}~.-]+"))@(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}|(\[(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\]))$/u.test(emailField.value);
        applyWrapperError(emailField, isFieldValid);
        return response(isFieldValid);
    }
    function validatePassField() {
        const response = validatorResponse('wtfPassword');
        if (!passField)
            return response(false);
        const { hasNumber, hasLowercase, hasUppercase, hasMinLength, hasSpecialChar, } = validatePasswordParts(passField.value);
        const message = passwordMismatchMessage({
            hasNumber,
            hasLowercase,
            hasUppercase,
            hasMinLength,
            hasSpecialChar,
        });
        const isFieldValid = hasNumber && hasLowercase && hasUppercase && hasSpecialChar && hasMinLength;
        updateFieldErrorMessage(passField, message || '');
        applyWrapperError(passField, isFieldValid);
        return response(isFieldValid);
    }
    function validateConsentField() {
        const response = validatorResponse('wtfConsent');
        if (!consentField)
            return response(false);
        const hasConsent = consentField.checked;
        applyWrapperError(consentField, hasConsent);
        return response(hasConsent);
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
    const validators = [
        { field: nameField, validator: validateNameField },
        { field: lastNameField, validator: validateLastNameField },
        { field: emailField, validator: validateEmailField },
        { field: passField, validator: validatePassField },
    ];
    for (const { field, validator } of validators) {
        attachEvent(field, 'blur', validator);
        attachEvent(field, 'input', () => applyWrapperError(field, true));
    }
    attachEvent(consentField, 'input', validateConsentField, false);
    attachEvent(signupForm, 'reset', () => {
        const checkedClass = 'w--redirected-checked';
        document.querySelectorAll(`#${signupForm?.id} .${checkedClass}`).forEach(element => {
            removeClass(element, checkedClass);
        });
    });
    attachEvent(signupForm, 'submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        addAttribute(submitForm, DISABLED_ATTR, DISABLED_ATTR);
        const failed = validators.find(({ validator }) => validator().at(1) === false);
        if (failed) {
            handleMessages(signupForm, postErrorResponse('Houve uma falha ao validar os seus dados. Por favor, tente novamente.'));
            focusInput(failed.field, FOCUS_OPTIONS);
            return removeAttribute(submitForm, DISABLED_ATTR);
        }
        const response = await signupUser({
            name: nameField?.value,
            lastName: lastNameField?.value,
            email: emailField?.value,
            password: passField?.value,
            optin: privacyField?.checked,
            consent: consentField?.checked,
        });
        handleMessages(signupForm, response);
        removeAttribute(submitForm, DISABLED_ATTR);
        if (!response.succeeded) {
            return;
        }
        signupForm?.reset();
        scrollIntoView(generalErrorMessage, SCROLL_INTO_VIEW_DEFAULT_ARGS);
    });
    addClass(signupForm?.parentElement, 'w-form');
    removeAttribute(submitForm, DISABLED_ATTR);
})();
export {};
