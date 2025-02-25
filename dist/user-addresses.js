(function () {
    const COOKIE_SEPARATOR = '; ';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    const WTF_WRAPPER_SELECTOR = '[data-wtf-wrapper]';
    const ERROR_MESSAGE_CLASS = 'mensagemdeerro';
    const ADDRESS_FORM_ID = '#wf-form-Address-Form';
    if (!isAuthenticated()) {
        location.href = `/acessos/entrar?redirect_to=${encodeURIComponent(location.pathname)}`;
        return;
    }
    const statesAcronym = [
        'AL',
        'AM',
        'AP',
        'CE',
        'BA',
        'AC',
        'DF',
        'ES',
        'GO',
        'MA',
        'MG',
        'MS',
        'MT',
        'PA',
        'PB',
        'PE',
        'PI',
        'PR',
        'RJ',
        'RN',
        'RO',
        'RR',
        'RS',
        'SC',
        'SE',
        'SP',
        'TO',
    ];
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
    function isAuthenticated() {
        return getCookie(COOKIE_NAME) !== false;
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
    function removeAttribute(element, attribute) {
        element.removeAttribute(attribute);
    }
    function postErrorResponse(message) {
        return {
            message,
            succeeded: false
        };
    }
    const noAddressesMessage = querySelector('[data-wtf-error-message-no-address-registered]');
    const addressTemplate = querySelector('[data-wtf-registered-address]');
    const addressContainer = addressTemplate?.parentElement;
    addressTemplate?.remove();
    const USER_CREATED_ADDRESSES = new Proxy([], {
        set(target, key, newValue) {
            const response = Reflect.set(target, key, newValue);
            const hasNoAddresses = key === 'length' && newValue === 0;
            toggleNoAddressesMessage(hasNoAddresses);
            if (hasNoAddresses || typeof newValue === 'number')
                return response;
            const hasElement = querySelector(`[data-wtf-address-id="${newValue.id}"]`) !== null;
            toggleNoAddressesMessage(objectSize(target) > 0);
            if (hasElement)
                return response;
            renderAddress(newValue);
            return response;
        }
    });
    function toggleNoAddressesMessage(hasAddresses) {
        noAddressesMessage && toggleClass(noAddressesMessage, GENERAL_HIDDEN_CLASS, !hasAddresses);
    }
    function renderAddress(incomingAddress) {
        if (!addressTemplate)
            return;
        const template = addressTemplate.cloneNode(true);
        const _nick = querySelector('[data-wtf-address-tag]', template);
        const _address = querySelector('[data-wtf-address]', template);
        const _anchor = querySelector('[data-wtf-delete-user-address]', template);
        if (_nick)
            _nick.textContent = incomingAddress.nick;
        if (_address)
            _address.textContent = incomingAddress.address;
        if (_anchor) {
            let _unsetEvent = null;
            _unsetEvent = attachEvent(_anchor, 'click', async function () {
                const response = await deleteUserAddress(incomingAddress.id);
                if (!response.succeeded)
                    return;
                _unsetEvent?.();
                const index = USER_CREATED_ADDRESSES.findIndex(value => value.id === incomingAddress.id);
                USER_CREATED_ADDRESSES.splice(index, 1);
                template.remove();
            }, false);
        }
        template.dataset.wtfAddressId = incomingAddress.id;
        addressContainer.appendChild(template);
    }
    async function searchAddress(cep) {
        const defaultErrorMessage = 'O CEP informado não foi encontrado';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}`);
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const address = await response.json();
            return {
                data: address,
                succeeded: true
            };
        }
        catch (e) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    async function getUserAddresses() {
        const defaultErrorMessage = 'Houve uma falha ao buscar os seus endereços. Tente novamente mais tarde.';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:Yytq8Zut/user_addresses/all`, {
                headers: {
                    'Authorization': getCookie(COOKIE_NAME)
                }
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const addresses = await response.json();
            return {
                succeeded: true,
                data: addresses,
            };
        }
        catch (e) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    async function deleteUserAddress(id) {
        const defaultErrorMessage = 'Houve uma falha ao remover o endereço. Tente novamente mais tarde.';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:Yytq8Zut/user_addresses/${id}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': getCookie(COOKIE_NAME)
                }
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            return {
                data: null,
                succeeded: true
            };
        }
        catch (e) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    async function createAddress(address) {
        const defaultErrorMessage = 'Houve uma falha ao salvar o endereço. Por favor, tente novamente mais tarde.';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:Yytq8Zut/user_addresses/create`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': getCookie(COOKIE_NAME)
                },
                body: JSON.stringify(address)
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const createdAddress = await response.json();
            return {
                succeeded: true,
                data: createdAddress
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
    function handleMessages(form, response) {
        const isError = !response.succeeded;
        const errorMessage = querySelector('[data-wtf-error-new]', form);
        const successMessage = querySelector('[data-wtf-success-new]', form);
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
    function objectSize(str) {
        return str.length;
    }
    function captureFieldWrapper(field) {
        return field.closest(WTF_WRAPPER_SELECTOR);
    }
    function toggleFieldWrapperError(field, isValid) {
        const fieldWrapper = captureFieldWrapper(field);
        fieldWrapper && toggleClass(fieldWrapper, ERROR_MESSAGE_CLASS, !isValid);
    }
    function camelToKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    function drawFoundedAddress(response) {
        if (response.succeeded) {
            const { cep: cepValue, logradouro, localidade, complemento, bairro, uf, } = response.data;
            checkInputExistenceAndSetItsValue(cep, cepValue);
            checkInputExistenceAndSetItsValue(address, logradouro);
            checkInputExistenceAndSetItsValue(complement, complemento);
            checkInputExistenceAndSetItsValue(neighborhood, bairro);
            checkInputExistenceAndSetItsValue(city, localidade);
            checkInputExistenceAndSetItsValue(state, uf);
            return;
        }
        for (const field of [address, complement, neighborhood, city, state]) {
            checkInputExistenceAndSetItsValue(field);
        }
    }
    function saveCreatedAddress(createdAddress) {
        if (Array.isArray(createdAddress)) {
            USER_CREATED_ADDRESSES.push(...createdAddress);
            return;
        }
        USER_CREATED_ADDRESSES.push(createdAddress);
    }
    function checkInputExistenceAndSetItsValue(field, value = '') {
        if (!field)
            return;
        field.value = value;
    }
    const _form = querySelector(ADDRESS_FORM_ID);
    if (!_form)
        return;
    const removeAttributes = [
        'name',
        'method',
        'data-name',
        'aria-label',
        'data-wf-page-id',
        'data-wf-element-id',
        'data-turnstile-sitekey',
    ];
    for (const attribute of removeAttributes) {
        removeAttribute(_form, attribute);
    }
    const submitElement = querySelector('input[type="submit"]', _form);
    submitElement && removeAttribute(submitElement, 'disabled');
    const formParent = _form.parentElement;
    if (!formParent)
        return;
    removeClass(formParent, 'w-form');
    _form.remove();
    formParent.insertAdjacentHTML('afterbegin', _form.outerHTML);
    const formElement = querySelector(ADDRESS_FORM_ID);
    if (!formElement)
        return;
    const addressNick = querySelector('[data-wtf-tag-new]');
    const cep = querySelector('[data-wtf-zipcode-new]');
    const address = querySelector('[data-wtf-address-new]');
    const number = querySelector('[data-wtf-number-new]');
    const complement = querySelector('[data-wtf-complement-new]');
    const neighborhood = querySelector('[data-wtf-neighborhood-new]');
    const city = querySelector('[data-wtf-city-new]');
    const state = querySelector('[data-wtf-state-new]');
    function maskCEPField() {
        if (!cep)
            return;
        const cleanValue = cep.value.replace(/\D+/g, '');
        const size = objectSize(cleanValue);
        cep.value = size > 5
            ? cleanValue.replace(/(\d{5})(\d{1,3})/, '$1-$2')
            : cleanValue;
        if (objectSize(cep.value) < 9)
            return;
        searchAddress(cleanValue).then(drawFoundedAddress);
    }
    function validateAddressNickField() {
        const response = validatorResponse('wtfTagNew');
        if (!addressNick)
            return response(false);
        const isAddressNickValid = objectSize(addressNick.value) > 2;
        toggleFieldWrapperError(addressNick, isAddressNickValid);
        return response(isAddressNickValid);
    }
    function validateCEPField() {
        const response = validatorResponse('wtfZipcodeNew');
        if (!cep)
            return response(false);
        const isCepFieldValid = /^\d{5}-\d{3}$/.test(cep.value);
        toggleFieldWrapperError(cep, isCepFieldValid);
        return response(isCepFieldValid);
    }
    function validateAddressField() {
        const response = validatorResponse('wtfAddressNew');
        if (!address)
            return response(false);
        const isAddressFieldValid = objectSize(address.value) > 2;
        toggleFieldWrapperError(address, isAddressFieldValid);
        return response(isAddressFieldValid);
    }
    function validateNumberField() {
        const response = validatorResponse('wtfNumberNew');
        if (!number)
            return response(false);
        const isNumberFieldValid = objectSize(number.value) > 0;
        toggleFieldWrapperError(number, isNumberFieldValid);
        return response(isNumberFieldValid);
    }
    function validateNeighborhoodField() {
        const response = validatorResponse('wtfNeighborhoodNew');
        if (!neighborhood)
            return response(false);
        const isNeighborhoodFieldValid = objectSize(neighborhood.value) > 2;
        toggleFieldWrapperError(neighborhood, isNeighborhoodFieldValid);
        return response(isNeighborhoodFieldValid);
    }
    function validateCityField() {
        const response = validatorResponse('wtfCityNew');
        if (!city)
            return response(false);
        const isCityFieldValid = objectSize(city.value) > 2;
        toggleFieldWrapperError(city, isCityFieldValid);
        return response(isCityFieldValid);
    }
    function validateStateField() {
        const response = validatorResponse('wtfStateNew');
        if (!state)
            return response(false);
        const isStateFieldValid = statesAcronym.includes(state.value);
        toggleFieldWrapperError(state, isStateFieldValid);
        return response(isStateFieldValid);
    }
    const fieldsValidators = [
        { field: addressNick, validator: validateAddressNickField },
        { field: cep, validator: validateCEPField },
        { field: address, validator: validateAddressField },
        { field: number, validator: validateNumberField },
        { field: neighborhood, validator: validateNeighborhoodField },
        { field: city, validator: validateCityField },
        { field: state, validator: validateStateField },
    ];
    for (const { field, validator } of fieldsValidators) {
        if (!field)
            continue;
        attachEvent(field, 'blur', validator, false);
        attachEvent(field, 'input', function () {
            toggleFieldWrapperError(field, true);
        }, false);
    }
    cep && attachEvent(cep, 'input', maskCEPField, false);
    attachEvent(formElement, 'submit', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const validations = [
            validateAddressNickField,
            validateCEPField,
            validateAddressField,
            validateNumberField,
            validateNeighborhoodField,
            validateCityField,
            validateStateField
        ];
        const failedValidation = validations.find(callback => !callback().at(1));
        if (failedValidation) {
            const failingFieldAttribute = `[data-${camelToKebabCase(failedValidation().at(0))}]`;
            querySelector(failingFieldAttribute, formElement)?.focus({
                preventScroll: false
            });
            return;
        }
        const response = await createAddress({
            nick: addressNick?.value,
            cep: cep?.value,
            address: address?.value,
            number: number?.value,
            complement: complement?.value,
            neighborhood: neighborhood?.value,
            city: city?.value,
            state: state?.value,
        });
        handleMessages(formElement, response);
        if (!response.succeeded)
            return;
        formElement.reset();
        saveCreatedAddress(response.data);
    }, false);
    getUserAddresses().then(response => {
        if (!response.succeeded)
            return;
        objectSize(response.data) > 0 && saveCreatedAddress(response.data);
    });
})();
export {};
