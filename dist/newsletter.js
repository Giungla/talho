(function () {
    'use strict';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const ERROR_MESSAGE_CLASS = 'mensagemdeerro';
    function querySelector(selector, node = document) {
        return node.querySelector(selector);
    }
    function attachEvent(node, eventName, callback, options) {
        node.addEventListener(eventName, callback, options);
        return () => node.removeEventListener(eventName, callback, options);
    }
    function addClass(element, ...className) {
        element.classList.add(...className);
    }
    function removeClass(element, ...className) {
        element.classList.remove(...className);
    }
    function toggleClass(element, className, force) {
        element.classList.toggle(className, force);
    }
    async function handleNewsletterFormSubmit(event) {
        event.preventDefault();
        event.stopPropagation();
        const target = event.target;
        if (!target)
            return;
        const callbackValidation = [validateMailField, validateConsentField].find(callback => {
            const isFieldValid = callback(target).at(1);
            return !isFieldValid;
        });
        if (callbackValidation) {
            const [name] = callbackValidation(target);
            const attributeName = `[data-${camelToKebabCase(name)}]`;
            querySelector(attributeName, target)?.focus({
                preventScroll: false
            });
            return;
        }
        const response = await postNewsletter({
            email: target?.email?.value,
            accepted_terms: target?.consent?.checked ?? false
        });
        handleMessages(target, response);
        target.reset();
        const checked = querySelector('.w--redirected-checked', target);
        checked && removeClass(checked, 'w--redirected-checked');
    }
    function handleMessages(form, response) {
        const isError = !response.succeeded;
        const errorMessage = querySelector('[data-wtf-error-optin-email]', form);
        const successMessage = querySelector('[data-wtf-success-optin-email]', form);
        errorMessage && toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError);
        successMessage && toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError);
        if (isError) {
            const textElement = errorMessage && querySelector('div', errorMessage);
            if (textElement)
                textElement.textContent = response.message;
            return;
        }
        const textElement = successMessage && querySelector('div', successMessage);
        if (textElement)
            textElement.textContent = response.data.message;
        setTimeout(() => {
            errorMessage && addClass(errorMessage, GENERAL_HIDDEN_CLASS);
            successMessage && addClass(successMessage, GENERAL_HIDDEN_CLASS);
        }, 8000);
    }
    function postErrorResponse(message) {
        return {
            message,
            succeeded: false
        };
    }
    async function postNewsletter(payload) {
        const defaultErrorMessage = 'Houve uma falha ao enviar o e-mail, tente novamente em breve!';
        try {
            const response = await fetch('https://xef5-44zo-gegm.b2.xano.io/api:KAULUI1C/newsletter', {
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
            return {
                succeeded: true,
                data: {
                    message: data.message
                }
            };
        }
        catch (e) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    function validatorResponse(datasetName) {
        return function (valid) {
            return [datasetName, valid];
        };
    }
    function camelToKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    function applyWrapperError(element, isValid) {
        const wrapperElement = element.closest('[data-wtf-wrapper]');
        wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, isValid);
    }
    function validateMailField(formElement) {
        const response = validatorResponse('wtfEmail');
        if (!formElement)
            return response(false);
        const mailField = querySelector('[data-wtf-email]', formElement);
        if (!mailField)
            return response(false);
        const isFieldValid = /^(([\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+\/=?^_`{|}~-]+)*)|("[\p{L}\p{N}\s!#$%&'*+\/=?^_`{|}~.-]+"))@(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}|(\[(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\]))$/u.test(mailField.value);
        applyWrapperError(mailField, !isFieldValid);
        return response(isFieldValid);
    }
    function validateConsentField(formElement) {
        const response = validatorResponse('wtfConsent');
        if (!formElement)
            return response(false);
        const consentField = querySelector('[data-wtf-consent]', formElement);
        if (!consentField)
            return response(false);
        const isConsentValid = consentField.checked;
        applyWrapperError(consentField, !isConsentValid);
        return response(isConsentValid);
    }
    const newsletterForms = ['#wf-form-Optin-Form-Mobile', '#wf-form-Optin-Form-Desktop'];
    const removeAttributes = [
        'name',
        'data-name',
        'data-wf-page-id',
        'data-wf-element-id',
        'data-turnstile-sitekey'
    ];
    for (const id of newsletterForms) {
        const _form = querySelector(id);
        if (!_form)
            continue;
        for (const attr of removeAttributes) {
            _form.removeAttribute(attr);
        }
        querySelector('input[type="submit"]', _form)?.removeAttribute('disabled');
        const formParentNode = _form.parentNode;
        _form.remove();
        if (formParentNode && formParentNode instanceof HTMLElement) {
            removeClass(formParentNode, 'w-form');
            formParentNode.insertAdjacentHTML('afterbegin', _form.outerHTML);
            const form = querySelector(id, formParentNode);
            if (!form)
                return;
            attachEvent(form, 'submit', handleNewsletterFormSubmit, false);
            addClass(formParentNode, 'w-form');
        }
    }
    document.querySelectorAll('form [data-wtf-email]').forEach(field => {
        attachEvent(field, 'blur', () => validateMailField(field.closest('form')), false);
        attachEvent(field, 'input', function () {
            const fieldWrapper = field.closest('[data-wtf-wrapper]');
            fieldWrapper && removeClass(fieldWrapper, ERROR_MESSAGE_CLASS);
        }, false);
    });
    document.querySelectorAll('form [data-wtf-consent]').forEach(field => {
        attachEvent(field, 'input', () => validateConsentField(field.closest('form')), false);
    });
})();
export {};
