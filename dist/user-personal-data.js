(function () {
    const COOKIE_SEPARATOR = '; ';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const ERROR_MESSAGE_CLASS = 'mensagemdeerro';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    function querySelector(selector, node = document) {
        return node.querySelector(selector);
    }
    function attachEvent(node, eventName, callback, options) {
        node.addEventListener(eventName, callback, options);
        return () => node.removeEventListener(eventName, callback, options);
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
    function camelToKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    function removeAttribute(element, attribute) {
        element.removeAttribute(attribute);
    }
    function hasOwnProperty(target, property) {
        return target.hasOwnProperty(property);
    }
    function addClass(element, ...className) {
        element.classList.add(...className);
    }
    function removeClass(element, ...className) {
        element.classList.remove(...className);
    }
    function toggleClass(element, className, force) {
        return element.classList.toggle(className, force);
    }
    function postErrorResponse(message) {
        return {
            message,
            succeeded: false
        };
    }
    function handleMessages(form, response) {
        const isError = !response.succeeded;
        const errorMessage = querySelector('[data-wtf-user-update-error-message]', form);
        const successMessage = querySelector('[data-wtf-user-update-success-message]', form);
        errorMessage && toggleClass(errorMessage, GENERAL_HIDDEN_CLASS, !isError);
        successMessage && toggleClass(successMessage, GENERAL_HIDDEN_CLASS, isError);
        if (!isError) {
            setTimeout(() => successMessage && addClass(successMessage, GENERAL_HIDDEN_CLASS), 8000);
            return;
        }
        const textElement = errorMessage && querySelector('div', errorMessage);
        if (!textElement)
            return;
        textElement.textContent = response.message;
    }
    function shouldAuthenticate() {
        window.location.href = `/acessos/entrar?redirect_to=${encodeURIComponent(location.pathname)}`;
    }
    function renderSinglePersonalData(where, value) {
        if (!where)
            return;
        toggleClass(where, GENERAL_HIDDEN_CLASS, !value);
        where.textContent = value ?? '';
    }
    function syncState(state) {
        Object.assign(userState, state);
        setupEditAction();
    }
    const userState = new Proxy({
        cpf: '',
        name: '',
        email: '',
        birthday: '',
        telephone: '',
        isFormVisible: false
    }, {
        get(target, key) {
            const value = Reflect.get(target, key);
            switch (key) {
                case 'fullName':
                    return `${target?.name} ${target?.last_name}`;
                default:
                    return value;
            }
        },
        set(target, key, newValue, receiver) {
            const response = Reflect.set(target, key, newValue);
            switch (key) {
                case 'name':
                case 'last_name':
                    renderSinglePersonalData(printName, receiver?.fullName ?? '');
                    break;
                case 'birthday':
                    renderSinglePersonalData(printBirthday, newValue);
                    break;
                case 'telephone':
                    renderSinglePersonalData(printPhone, newValue);
                    break;
                case 'cpf':
                    renderSinglePersonalData(printCPF, newValue);
                    break;
                case 'email':
                    renderSinglePersonalData(printEmail, newValue);
                    break;
                case 'points':
                    renderSinglePersonalData(printPoints, newValue);
                    break;
                case 'isFormVisible':
                    console.log('form estará visivel: ', newValue);
            }
            return response;
        }
    });
    const HEADERS = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getCookie(COOKIE_NAME)
    };
    const removeAttributes = [
        'name',
        'method',
        'data-name',
        'aria-label',
        'data-wf-page-id',
        'data-wf-element-id',
        'data-turnstile-sitekey'
    ];
    const _form = querySelector('#wf-form-update-user-data');
    if (_form) {
        for (const attribute of removeAttributes) {
            removeAttribute(_form, attribute);
        }
        const parentElement = _form.parentElement;
        const submit = querySelector('[type="submit"]', _form);
        submit && removeAttribute(submit, 'disabled');
        removeClass(parentElement, 'w-form');
        _form.remove();
        parentElement.insertAdjacentHTML('beforeend', _form.outerHTML);
    }
    const form = querySelector('#wf-form-update-user-data');
    attachEvent(form, 'submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const hasCPF = hasOwnProperty(form, 'cpf');
        const _validators = [
            validateNameField,
            validateLastNameField,
            validatePhoneField,
            validateBirthdayField
        ];
        if (hasCPF) {
            _validators.splice(2, 0, validateCPFField);
        }
        const failed = _validators.find(_validator => _validator().at(1) === false);
        if (failed) {
            const attribute = camelToKebabCase(failed().at(0));
            querySelector(`[data-${attribute}]`, form)?.focus({
                preventScroll: false
            });
            return;
        }
        const birthday = (dateField?.value ?? '')
            .split('/')
            .reverse()
            .join('-');
        const body = {
            birthday,
            cpf: CPFField?.value,
            name: nameField?.value,
            telephone: phoneField?.value,
            last_name: lastNameField?.value
        };
        if (hasCPF) {
            Object.assign(body, { cpf: CPFField?.value });
        }
        const response = await postPersonalData(body);
        handleMessages(form, response);
        if (!response.succeeded)
            return;
        syncState(response.data);
    });
    const printPoints = querySelector('[data-wtf-score]');
    const printName = querySelector('[data-wtf-name]');
    const printEmail = querySelector('[data-wtf-email]');
    const printPhone = querySelector('[data-wtf-phone]');
    const printCPF = querySelector('[data-wtf-cpf]');
    const printBirthday = querySelector('[data-wtf-birthday]');
    const nameField = querySelector('[data-wtf-name-update]');
    const lastNameField = querySelector('[data-wtf-last-name-update]');
    const phoneField = querySelector('[data-wtf-phone-update]');
    const CPFField = querySelector('[data-wtf-cpf-update]');
    const dateField = querySelector('[data-wtf-birthday-update]');
    const editButton = querySelector('[data-wtf-edit-account-data]');
    const formGroup = querySelector('[data-wtf-update-account-data]');
    const validators = [
        { field: nameField, validator: validateNameField },
        { field: lastNameField, validator: validateLastNameField },
        { field: CPFField, validator: validateCPFField },
        { field: phoneField, validator: validatePhoneField },
        { field: dateField, validator: validateBirthdayField }
    ];
    for (const { field, validator } of validators) {
        if (!field)
            continue;
        attachEvent(field, 'blur', validator);
        attachEvent(field, 'input', () => applyWrapperError(field, true));
    }
    if (phoneField) {
        attachEvent(phoneField, 'input', () => {
            phoneField.value = maskPhone(phoneField.value);
        });
    }
    if (CPFField) {
        attachEvent(CPFField, 'input', () => {
            CPFField.value = maskCPF(CPFField.value);
        });
    }
    if (dateField) {
        attachEvent(dateField, 'input', () => {
            dateField.value = maskDate(dateField.value);
        });
    }
    function setupEditAction() {
        if (!editButton)
            return;
        attachEvent(editButton, 'click', () => {
            formGroup && removeClass(formGroup, GENERAL_HIDDEN_CLASS);
            addClass(editButton, GENERAL_HIDDEN_CLASS);
        }, { once: true });
        const _mapper = [
            [CPFField, userState.cpf],
            [nameField, userState.name],
            [dateField, userState.birthday],
            [phoneField, userState.telephone],
            [lastNameField, userState.last_name],
        ];
        for (const [field, value] of _mapper) {
            setStateToField(field, value);
        }
        removeClass(editButton, GENERAL_HIDDEN_CLASS);
        formGroup && addClass(formGroup, GENERAL_HIDDEN_CLASS);
    }
    function setStateToField(field, value) {
        if (!field)
            return;
        field.value = value ?? '';
    }
    function normalizeText(text) {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }
    function maskPhone(value) {
        const { cleaned, size } = handleInitialMaskValues(value);
        if (size === 0)
            return cleaned;
        if (size > 0 && size < 3)
            return cleaned.replace(/(\d{0,2})/, '($1');
        if (size < 7)
            return cleaned.replace(/(\d{2})(\d{0,4})/, '($1) $2');
        if (size <= 10)
            return cleaned.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    function maskCPF(value) {
        const { cleaned, size } = handleInitialMaskValues(value);
        if (size < 4)
            return cleaned;
        if (size < 7)
            return cleaned.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        if (size <= 9)
            return cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    }
    function maskDate(value) {
        const { cleaned, size } = handleInitialMaskValues(value);
        if (size < 3)
            return cleaned;
        if (size < 5)
            return cleaned.replace(/(\d{2})(\d{1,2})/, '$1/$2');
        return cleaned.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
    }
    function handleInitialMaskValues(value) {
        const cleaned = numberOnly(value);
        return {
            cleaned,
            size: objectSize(cleaned)
        };
    }
    function removeDuplicatedSpaces(value) {
        return value.trim().replace(/\s+/g, ' ');
    }
    function objectSize(value) {
        return value.length;
    }
    function numberOnly(value) {
        return value.replace(/\D/g, '');
    }
    function validatorResponse(datasetName) {
        return function (valid) {
            return [datasetName, valid];
        };
    }
    function applyWrapperError(element, isValid) {
        const wrapperElement = element.closest('[data-wtf-wrapper]');
        wrapperElement && toggleClass(wrapperElement, ERROR_MESSAGE_CLASS, !isValid);
    }
    function isNameValid(name) {
        return /^[a-zA-Z\s]+$/.test(name);
    }
    function validateNameField() {
        const response = validatorResponse('wtfNameUpdate');
        if (!nameField)
            return response(false);
        const cleanedName = removeDuplicatedSpaces(normalizeText(nameField.value));
        const isFieldValid = objectSize(cleanedName) > 1 && isNameValid(cleanedName);
        applyWrapperError(nameField, isFieldValid);
        return response(isFieldValid);
    }
    function validateLastNameField() {
        const response = validatorResponse('wtfLastNameUpdate');
        if (!lastNameField)
            return response(false);
        const cleanedName = removeDuplicatedSpaces(normalizeText(lastNameField.value));
        const isFieldValid = objectSize(cleanedName) > 0 && isNameValid(cleanedName);
        applyWrapperError(lastNameField, isFieldValid);
        return response(isFieldValid);
    }
    function validateCPFField() {
        const response = validatorResponse('wtfCpfUpdate');
        if (!CPFField)
            return response(false);
        const isFieldValid = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(CPFField.value) && validateCPF(CPFField.value);
        applyWrapperError(CPFField, isFieldValid);
        return response(isFieldValid);
    }
    function validatePhoneField() {
        const response = validatorResponse('wtfPhoneUpdate');
        if (!phoneField)
            return response(false);
        const isFieldValid = /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phoneField.value);
        applyWrapperError(phoneField, isFieldValid);
        return response(isFieldValid);
    }
    function validateBirthdayField() {
        const response = validatorResponse('wtfBirthdayUpdate');
        if (!dateField)
            return response(false);
        const date = dateField.value;
        const hasPatternMatch = /^(\d{2})\/(\d{2})\/(19|20)(\d{2})$/g.test(date);
        const [day, month, year] = date.split('/');
        const getTimeFromDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`).getTime();
        const isValidDate = hasPatternMatch && !isNaN(getTimeFromDate) && Date.now() > getTimeFromDate;
        applyWrapperError(dateField, isValidDate);
        return response(isValidDate);
    }
    function validateCPF(cpf) {
        cpf = numberOnly(cpf);
        if (objectSize(cpf) !== 11 || /^(\d)\1{10}$/.test(cpf))
            return false;
        let result = true;
        const validationIndexes = [9, 10];
        validationIndexes.forEach(function (j) {
            let soma = 0, r;
            cpf
                .split('')
                .splice(0, j)
                .forEach(function (e, i) {
                soma += parseInt(e) * ((j + 2) - (i + 1));
            });
            r = soma % 11;
            r = (r < 2)
                ? 0
                : 11 - r;
            if (r !== parseInt(cpf.substring(j, j + 1)))
                result = false;
        });
        return result;
    }
    async function postPersonalData(payload) {
        const defaultErrorMessage = 'Houve uma falha ao salvar seus dados. Tente novamente mais tarde.';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/edit`, {
                method: 'PUT',
                headers: HEADERS,
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    shouldAuthenticate();
                }
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const personalData = await response.json();
            return {
                succeeded: true,
                data: personalData
            };
        }
        catch (error) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    async function getCurrentUser() {
        const defaultErrorMessage = 'Houve uma falha ao carregar seus dados. Tente novamente mais tarde.';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/get`, {
                headers: HEADERS
            });
            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    shouldAuthenticate();
                }
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const personalData = await response.json();
            return {
                succeeded: true,
                data: personalData
            };
        }
        catch (error) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    getCurrentUser().then(response => {
        if (!response.succeeded)
            return;
        syncState(response.data);
    });
})();
export {};
