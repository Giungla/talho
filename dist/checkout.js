(function () {
    const { ref, createApp, } = Vue;
    const EMPTY_STRING = '';
    const SLASH_STRING = '/';
    const NULL_VALUE = null;
    const ERROR_KEY = 'error';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const SHIPPING_NAME_TOKEN = 'shipping';
    const BILLING_NAME_TOKEN = 'billing';
    const CEP_LENGTH = 8;
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`;
    const PAYMENT_BASE_URL = `${XANO_BASE_URL}/api:5lp3Lw8X`;
    const DELIVERY_BASE_URL = `${XANO_BASE_URL}/api:24B7O9Aj`;
    const REQUEST_HEADERS = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    };
    const POST_REQUEST = {
        method: 'POST',
        ...REQUEST_HEADERS,
    };
    const MIN_AVAILABLE_INSTALLMENT_COUNT = 1;
    const MAX_AVAILABLE_INSTALLMENT_COUNT = 2;
    const FREE_SHIPPING_MIN_CART_PRICE = 400;
    const STORAGE_KEY_NAME = 'talho_cart_items';
    const statesMap = {
        'AC': 'Acre',
        'AL': 'Alagoas',
        'AP': 'Amapá',
        'AM': 'Amazonas',
        'BA': 'Bahia',
        'CE': 'Ceará',
        'DF': 'Distrito Federal',
        'ES': 'Espírito Santo',
        'GO': 'Goiás',
        'MA': 'Maranhão',
        'MT': 'Mato Grosso',
        'MS': 'Mato Grosso do Sul',
        'MG': 'Minas Gerais',
        'PA': 'Pará',
        'PB': 'Paraíba',
        'PR': 'Paraná',
        'PE': 'Pernambuco',
        'PI': 'Piauí',
        'RJ': 'Rio de Janeiro',
        'RN': 'Rio Grande do Norte',
        'RS': 'Rio Grande do Sul',
        'RO': 'Rondônia',
        'RR': 'Roraima',
        'SC': 'Santa Catarina',
        'SP': 'São Paulo',
        'SE': 'Sergipe',
        'TO': 'Tocantins'
    };
    const statesAcronym = Object.keys(statesMap);
    const CPF_VERIFIERS_INDEXES = [10, 11];
    const eventMap = new WeakMap();
    const INPUT_EVENT = new Event('input');
    const DELIVERY_TYPE_SAME = 'same';
    const DELIVERY_TYPE_DIFF = 'diff';
    const PIX_PAYMENT = 'pix';
    const CREDIT_CARD_PAYMENT = 'creditcard';
    const ALLOWED_PAYMENT_METHODS = [
        PIX_PAYMENT,
        CREDIT_CARD_PAYMENT,
    ];
    const BRLFormatter = new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        style: 'currency',
    });
    function getAbortController() {
        return new AbortController();
    }
    function setPageLoader(status) {
        return toggleClass(querySelector('[data-wtf-loader]'), GENERAL_HIDDEN_CLASS, !status);
    }
    function toggleClass(element, className, force) {
        if (!element)
            return false;
        return element.classList.toggle(className, force);
    }
    function buildURL(path, query) {
        const baseURL = new URL(`${location.protocol}//${location.hostname}`);
        const nextPage = new URL(path, baseURL);
        for (const [key, value] of Object.entries(query)) {
            nextPage.searchParams.set(key, value);
        }
        return nextPage.toString();
    }
    function hasOwn(object, key) {
        return Object.hasOwn(object, key);
    }
    function clamp(min, max, value) {
        return Math.max(min, Math.min(max, value));
    }
    function stringify(value) {
        return JSON.stringify(value);
    }
    function normalizeText(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, EMPTY_STRING);
    }
    function numberOnly(value) {
        return value.replace(/\D+/g, EMPTY_STRING);
    }
    function trimText(text) {
        return text.trim();
    }
    function objectSize(value) {
        return value.length;
    }
    function scrollIntoView(element, args) {
        element.scrollIntoView(args);
    }
    function isExpireDateValid(expireDate) {
        const tokens = expireDate.split(SLASH_STRING);
        if (tokens.length !== 2)
            return false;
        const [monthStr, yearStr] = tokens;
        const month = parseInt(monthStr, 10);
        const shortYear = parseInt(yearStr, 10);
        if (isNaN(month) || isNaN(shortYear) || month < 1 || month > 12)
            return false;
        const currentDate = new Date();
        const fullYear = 2000 + (shortYear < 100 ? shortYear : 0);
        const expireDateTime = new Date(fullYear, month, 0, 23, 59, 59);
        return expireDateTime > currentDate;
    }
    function maskPhoneNumber(value) {
        const replacer = (_, d1, d2, d3) => {
            const response = [];
            pushIf(d1, response, `(${d1}`);
            pushIf(d2, response, `) ${d2}`);
            pushIf(d3, response, `-${d3}`);
            return response.join(EMPTY_STRING);
        };
        if (value.length < 11) {
            return value.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, replacer);
        }
        return value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4})/, replacer);
    }
    function maskCPFNumber(value) {
        return value.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, g1, g2, g3, g4) => {
            const response = [];
            pushIf(g1, response, `${g1}`);
            pushIf(g2, response, `.${g2}`);
            pushIf(g3, response, `.${g3}`);
            pushIf(g4, response, `-${g4}`);
            return response.join(EMPTY_STRING);
        });
    }
    function maskDate(value) {
        return value.replace(/^(\d{0,2})(\d{0,2})(\d{0,4})/, (_, d1, d2, d3) => {
            return [d1, d2, d3]
                .filter(Boolean)
                .join(SLASH_STRING);
        });
    }
    function maskCardNumber(value) {
        return value.replace(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/, (_, g1, g2, g3, g4) => {
            const response = [];
            for (const group of [g1, g2, g3, g4]) {
                pushIf(group, response, group);
            }
            return response.join(' ');
        });
    }
    function maskCardDate(value) {
        return value.replace(/^(\d{0,2})(\d{0,2})/, (_, g1, g2) => {
            const response = [];
            for (const group of [g1, g2]) {
                pushIf(group, response, group);
            }
            return response.join(SLASH_STRING);
        });
    }
    function maskCEP(value) {
        return value.replace(/^(\d{0,5})(\d{0,3})/, (_, g1, g2) => {
            const response = [];
            for (const group of [g1, g2]) {
                pushIf(group, response, group);
            }
            return response.join('-');
        });
    }
    function toUpperCase(value) {
        return value.toUpperCase();
    }
    function isArray(arg) {
        return Array.isArray(arg);
    }
    function pushIf(condition, list, value) {
        if (!condition)
            return -1;
        return list.push(value);
    }
    function includes(source, search) {
        return source.includes(search);
    }
    function regexTest(regex, value) {
        return regex.test(value);
    }
    function buildMaskDirective(...mappers) {
        return {
            mounted(el) {
                const remover = attachEvent(el, 'input', (event) => {
                    if (!event.isTrusted)
                        return;
                    const target = event.target;
                    target.value = mappers.reduce((value, callbackFn) => callbackFn(value), target.value ?? EMPTY_STRING);
                    el.dispatchEvent(INPUT_EVENT);
                });
                eventMap.set(el, remover);
            },
            unmounted: cleanupDirective
        };
    }
    function buildFieldValidation(field, valid, ignoreIf) {
        return {
            field,
            valid,
            ...(ignoreIf && ({ ignoreIf }))
        };
    }
    function isDateValid(date) {
        const [day, month, fullYear] = date.split(SLASH_STRING);
        const parsedDate = new Date(`${fullYear}-${month}-${day}T00:00:00`);
        return parsedDate.toString() !== 'Invalid Date';
    }
    function isCPFValid(cpf) {
        cpf = numberOnly(cpf);
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf))
            return false;
        const verifiers = CPF_VERIFIERS_INDEXES.map((verifierDigit, verifierIndex) => {
            const lastIndex = verifierIndex ? 10 : 9;
            const sum = [...cpf.slice(0, lastIndex)]
                .map(Number)
                .reduce((acc, cur, index) => acc + cur * (verifierDigit - index), 0);
            const result = 11 - (sum % 11);
            return result > 9
                ? 0
                : result;
        });
        return cpf.endsWith(verifiers.join(EMPTY_STRING));
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
    function querySelector(selector, node = document) {
        if (!node)
            return NULL_VALUE;
        return node.querySelector(selector);
    }
    function attachEvent(node, eventName, callback, options) {
        if (!node)
            return;
        node.addEventListener(eventName, callback, options);
        return () => node.removeEventListener(eventName, callback, options);
    }
    async function searchAddress({ cep, deliveryMode }) {
        const defaultErrorMessage = 'Não foi possível encontrar o endereço';
        cep = numberOnly(cep);
        if (cep.length !== CEP_LENGTH)
            return postErrorResponse(defaultErrorMessage);
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:jyidAW68/cepaddress/${cep}/checkout`, {
                ...POST_REQUEST,
                credentials: 'include',
                body: stringify({
                    deliveryMode,
                })
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const address = await response.json();
            return postSuccessResponse(address);
        }
        catch (e) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    const cleanupDirective = (el) => {
        const cleanup = eventMap.get(el);
        if (!cleanup)
            return;
        cleanup();
        eventMap.delete(el);
    };
    const TalhoCheckoutApp = createApp({
        name: 'TalhoCheckoutApp',
        setup() {
            const customerCPF = ref(EMPTY_STRING);
            const customerMail = ref(EMPTY_STRING);
            const customerPhone = ref(EMPTY_STRING);
            const customerBirthdate = ref(EMPTY_STRING);
            const customerCreditCardCVV = ref(EMPTY_STRING);
            const customerCreditCardDate = ref(EMPTY_STRING);
            const customerCreditCardNumber = ref(EMPTY_STRING);
            const customerCreditCardHolder = ref(EMPTY_STRING);
            const billingCEP = ref(EMPTY_STRING);
            const billingAddress = ref(EMPTY_STRING);
            const billingNumber = ref(EMPTY_STRING);
            const billingComplement = ref(EMPTY_STRING);
            const billingNeighborhood = ref(EMPTY_STRING);
            const billingCity = ref(EMPTY_STRING);
            const billingState = ref(EMPTY_STRING);
            const shippingRecipient = ref(EMPTY_STRING);
            const shippingCEP = ref(EMPTY_STRING);
            const shippingAddress = ref(EMPTY_STRING);
            const shippingNumber = ref(EMPTY_STRING);
            const shippingComplement = ref(EMPTY_STRING);
            const shippingNeighborhood = ref(EMPTY_STRING);
            const shippingCity = ref(EMPTY_STRING);
            const shippingState = ref(EMPTY_STRING);
            const couponCode = ref(EMPTY_STRING);
            const customerMailElement = ref(NULL_VALUE);
            const customerCPFElement = ref(NULL_VALUE);
            const customerPhoneElement = ref(NULL_VALUE);
            const customerBirthdateElement = ref(NULL_VALUE);
            const paymentMethodMessageElement = ref(NULL_VALUE);
            const customerCreditCardCVVElement = ref(NULL_VALUE);
            const customerCreditCardDateElement = ref(NULL_VALUE);
            const customerCreditCardNumberElement = ref(NULL_VALUE);
            const customerCreditCardHolderElement = ref(NULL_VALUE);
            const billingCEPElement = ref(NULL_VALUE);
            const billingAddressElement = ref(NULL_VALUE);
            const billingNumberElement = ref(NULL_VALUE);
            const billingNeighborhoodElement = ref(NULL_VALUE);
            const billingCityElement = ref(NULL_VALUE);
            const billingStateElement = ref(NULL_VALUE);
            const deliveryPlaceMessageElement = ref(NULL_VALUE);
            const shippingRecipientElement = ref(NULL_VALUE);
            const shippingCEPElement = ref(NULL_VALUE);
            const shippingAddressElement = ref(NULL_VALUE);
            const shippingNumberElement = ref(NULL_VALUE);
            const shippingNeighborhoodElement = ref(NULL_VALUE);
            const shippingCityElement = ref(NULL_VALUE);
            const shippingStateElement = ref(NULL_VALUE);
            const deliveryDateMessageElement = ref(NULL_VALUE);
            const deliveryHourMessageElement = ref(NULL_VALUE);
            const installmentsMessageElement = ref(NULL_VALUE);
            const couponCodeElement = ref(NULL_VALUE);
            const deliveryPlaceAddressErrorMessage = ref(NULL_VALUE);
            const deliveryBillingAddressErrorMessage = ref(NULL_VALUE);
            const deliveryShippingAddressErrorMessage = ref(NULL_VALUE);
            return {
                customerCPF,
                customerMail,
                customerPhone,
                customerBirthdate,
                customerCreditCardCVV,
                customerCreditCardDate,
                customerCreditCardNumber,
                customerCreditCardHolder,
                billingCEP,
                billingAddress,
                billingNumber,
                billingComplement,
                billingNeighborhood,
                billingCity,
                billingState,
                shippingRecipient,
                shippingCEP,
                shippingAddress,
                shippingNumber,
                shippingComplement,
                shippingNeighborhood,
                shippingCity,
                shippingState,
                couponCode,
                customerMailElement,
                customerCPFElement,
                customerPhoneElement,
                customerBirthdateElement,
                paymentMethodMessageElement,
                customerCreditCardCVVElement,
                customerCreditCardDateElement,
                customerCreditCardNumberElement,
                customerCreditCardHolderElement,
                billingCEPElement,
                billingAddressElement,
                billingNumberElement,
                billingNeighborhoodElement,
                billingCityElement,
                billingStateElement,
                deliveryPlaceMessageElement,
                shippingRecipientElement,
                shippingCEPElement,
                shippingAddressElement,
                shippingNumberElement,
                shippingNeighborhoodElement,
                shippingCityElement,
                shippingStateElement,
                deliveryDateMessageElement,
                deliveryHourMessageElement,
                installmentsMessageElement,
                couponCodeElement,
                deliveryPlaceAddressErrorMessage,
                deliveryBillingAddressErrorMessage,
                deliveryShippingAddressErrorMessage,
            };
        },
        data() {
            return {
                hasPendingPayment: false,
                isSubmitted: false,
                productlist: NULL_VALUE,
                visitedFields: [],
                selectedPayment: NULL_VALUE,
                availablePayments: [
                    {
                        label: 'Cartão de crédito',
                        method: CREDIT_CARD_PAYMENT
                    },
                    {
                        label: 'PIX',
                        method: PIX_PAYMENT
                    }
                ],
                deliveryPlace: NULL_VALUE,
                deliveryPlaces: [
                    {
                        token: DELIVERY_TYPE_SAME,
                        label: 'Mesmo endereço de cobrança do cartão'
                    },
                    {
                        token: DELIVERY_TYPE_DIFF,
                        label: 'Entregar em um endereço diferente'
                    }
                ],
                installment: NULL_VALUE,
                selectedInstallment: NULL_VALUE,
                isCouponPending: false,
                coupon: NULL_VALUE,
                isPagSeguroLoaded: false,
                deliveryDate: NULL_VALUE,
                deliveryHour: NULL_VALUE,
                isDeliveryLoading: false,
                deliveryPrice: NULL_VALUE,
                deliveryOptions: NULL_VALUE,
                priorityTax: NULL_VALUE,
                subsidy: NULL_VALUE,
            };
        },
        created() {
            this.refreshCart().then(() => setPageLoader(false));
            window.addEventListener('storage', (e) => {
                if (e.key !== STORAGE_KEY_NAME)
                    return;
                this.refreshCart();
            });
        },
        methods: {
            async getCart() {
                const defaultErrorMessage = 'Falha ao capturar os produtos';
                try {
                    const response = await fetch(`${CART_BASE_URL}/cart/get`, {
                        ...REQUEST_HEADERS,
                        credentials: 'include',
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
            },
            async refreshCart() {
                return this.getCart().then(cartData => {
                    if (!cartData.succeeded)
                        return;
                    if (cartData.data.items.length === 0) {
                        location.href = buildURL('/', {
                            reason: 'empty_cart'
                        });
                        return;
                    }
                    this.productlist = cartData.data;
                });
            },
            async getInstallments() {
                const defaultErrorMessage = 'Falha ao capturar o parcelamento';
                try {
                    const response = await fetch(`${PAYMENT_BASE_URL}/calculatefees`, {
                        ...POST_REQUEST,
                        cache: 'force-cache',
                        credentials: 'include',
                        body: stringify({
                            amount: this.getOrderPrice,
                            cardBin: this.customerCreditCardNumber
                                .replace(/\D+/g, EMPTY_STRING)
                                .slice(0, 8)
                        })
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
            },
            async refreshInstallments() {
                if (!this.isCreditCard || !this.isCreditCardGroupValid || this.getCreditCardToken.hasErrors)
                    return;
                this.installment = NULL_VALUE;
                this.selectedInstallment = NULL_VALUE;
                const response = await this.getInstallments();
                if (!response.succeeded)
                    return;
                this.installment = response.data;
            },
            setSelectedInstallmentsCount(installmentsCount) {
                if (this.selectedInstallment === installmentsCount)
                    return;
                this.selectedInstallment = clamp(MIN_AVAILABLE_INSTALLMENT_COUNT, MAX_AVAILABLE_INSTALLMENT_COUNT, installmentsCount);
            },
            setSelectedPaymentMethod(method) {
                if (this.selectedPayment === method)
                    return;
                if (!this.hasDeliveryDates) {
                    this.handleDeliveryOptions();
                }
                if (method !== CREDIT_CARD_PAYMENT) {
                    this.clearCreditCardData();
                }
                else if (!this.isPagSeguroLoaded) {
                    this.loadPagSeguro();
                }
                this.deliveryPlace = NULL_VALUE;
                this.selectedPayment = method;
            },
            setVisitedField(fieldName) {
                return pushIf(!includes(this.visitedFields, fieldName), this.visitedFields, fieldName);
            },
            hasVisitRegistry(fieldName) {
                return includes(this.visitedFields, fieldName);
            },
            async handlePayment(e) {
                e.preventDefault();
                if (this.hasPendingPayment || this.isDeliveryLoading)
                    return;
                this.triggerValidations();
                if (!this.isSubmitted) {
                    this.isSubmitted = true;
                    Vue.nextTick(() => this.handlePayment(e));
                    return;
                }
                const firstInvalidField = this.firstInvalidField;
                if (firstInvalidField) {
                    scrollIntoView(firstInvalidField.field, {
                        block: 'center',
                        behavior: 'smooth',
                    });
                    if (firstInvalidField.field.tagName === 'INPUT') {
                        setTimeout(() => firstInvalidField.field.focus(), 500);
                    }
                    return;
                }
                this.hasPendingPayment = setPageLoader(true);
                const paymentMap = {
                    [PIX_PAYMENT]: this.handleProcessPIX,
                    [CREDIT_CARD_PAYMENT]: this.handleProcessCreditCard,
                    [ERROR_KEY]: async () => postErrorResponse('Houve uma falha no envio de seu pedido')
                };
                const execPayment = paymentMap?.[this.selectedPayment ?? ERROR_KEY];
                const response = await execPayment?.();
                if (!response.succeeded) {
                    this.hasPendingPayment = !setPageLoader(false);
                    alert('Pagamento falhou');
                    return;
                }
                localStorage.removeItem(STORAGE_KEY_NAME);
                const redirectURL = this.isCreditCard
                    ? 'confirmacao-do-pedido'
                    : 'pix';
                location.href = buildURL(['/pagamento', redirectURL].join(SLASH_STRING), {
                    order: response.data.transactionid
                });
            },
            async handleProcessPIX() {
                const defaultErrorMessage = 'Falha ao gerar o pedido';
                try {
                    const response = await fetch(`${PAYMENT_BASE_URL}/process_pix`, {
                        ...POST_REQUEST,
                        credentials: 'include',
                        body: stringify({
                            ...this.getOrderBaseData,
                            customer: {
                                ...this.getParsedCustomer,
                                ...this.getParsedAddresses,
                            },
                        })
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
            },
            async handleProcessCreditCard() {
                const defaultErrorMessage = 'Falha ao gerar o pedido';
                try {
                    const selectedInstallment = this.selectedInstallment;
                    const response = await fetch(`${PAYMENT_BASE_URL}/process_creditcard`, {
                        ...POST_REQUEST,
                        credentials: 'include',
                        body: stringify({
                            ...this.getOrderBaseData,
                            customer: {
                                ...this.getParsedCustomer,
                                ...this.getParsedAddresses,
                            },
                            is_same_address: this.isSameAddress,
                            credit_card_info: {
                                holderName: this.customerCreditCardHolder,
                                creditCardToken: this.getCreditCardToken.encryptedCard ?? EMPTY_STRING,
                                numberOfPayments: selectedInstallment,
                                installmentValue: this.installment
                                    ?.find(({ installments }) => installments === selectedInstallment)
                                    ?.installment_value ?? 0
                            }
                        })
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
            },
            triggerValidations() {
                const notIgnoredFields = this.notIgnoredFields;
                for (const { field } of notIgnoredFields) {
                    field?.dispatchEvent(new Event('blur'));
                }
            },
            feedAddress(addressType, { uf, bairro, logradouro, localidade, }) {
                if (addressType === BILLING_NAME_TOKEN) {
                    this.billingAddress = logradouro;
                    this.billingNeighborhood = bairro;
                    this.billingCity = localidade;
                    this.billingState = uf;
                    return;
                }
                this.shippingAddress = logradouro;
                this.shippingNeighborhood = bairro;
                this.shippingCity = localidade;
                this.shippingState = uf;
            },
            setDeliveryPlace(deliveryPlace) {
                if (this.deliveryPlace === deliveryPlace)
                    return;
                if (deliveryPlace === DELIVERY_TYPE_SAME && /^\d{5}\-\d{3}$/.test(this.billingCEP) && this.isBillingAddressGroupValid) {
                    searchAddress({
                        cep: this.billingCEP,
                        deliveryMode: true
                    }).then(address => {
                        if (address.succeeded)
                            return;
                        this.deliveryPlaceAddressErrorMessage = address.message;
                    });
                }
                else {
                    this.deliveryPlaceAddressErrorMessage = NULL_VALUE;
                }
                this.deliveryPlace = deliveryPlace;
            },
            async captureAddress(addressType, cep, oldCep) {
                if (!regexTest(/^\d{5}-\d{3}$/, cep) || cep === oldCep)
                    return false;
                const fieldKey = `${addressType}CEP`;
                const address = await searchAddress({
                    cep,
                    deliveryMode: addressType === SHIPPING_NAME_TOKEN
                });
                if (!address.succeeded) {
                    this[fieldKey] = EMPTY_STRING;
                    this.setVisitedField(fieldKey);
                    if (addressType === SHIPPING_NAME_TOKEN) {
                        this.deliveryShippingAddressErrorMessage = address.message;
                    }
                    if (addressType === BILLING_NAME_TOKEN) {
                        this.deliveryBillingAddressErrorMessage = address.message;
                    }
                    return false;
                }
                switch (addressType) {
                    case SHIPPING_NAME_TOKEN:
                        this.deliveryShippingAddressErrorMessage = NULL_VALUE;
                        break;
                    case BILLING_NAME_TOKEN:
                        this.deliveryBillingAddressErrorMessage = NULL_VALUE;
                }
                this.feedAddress(addressType, address.data);
                return true;
            },
            async captureCoupon() {
                const defaultErrorMessage = 'Falha ao capturar o cupom indicado';
                try {
                    const response = await fetch(`${PAYMENT_BASE_URL}/get_coupon`, {
                        ...POST_REQUEST,
                        credentials: 'include',
                        body: stringify({
                            verify_amount: true,
                            coupon_code: this.couponCode,
                            cpf: this.customerCPF && NULL_VALUE,
                            has_subsidy: this.subsidy?.has ?? false,
                            delivery_cep: this.getParsedAddresses.shippingaddress.zipPostalCode,
                            has_selected_delivery: this.deliveryHour !== NULL_VALUE && this.deliveryDate !== NULL_VALUE
                        })
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
            },
            async handleSearchCoupon() {
                if (this.isCouponPending)
                    return;
                this.isCouponPending = true;
                const response = await this.captureCoupon();
                this.isCouponPending = false;
                if (!response.succeeded) {
                    this.coupon = ({
                        error: true,
                        message: response.message,
                    });
                    return;
                }
                this.coupon = response.data;
            },
            handleRemoveCoupon() {
                this.coupon = NULL_VALUE;
                this.couponCode = EMPTY_STRING;
            },
            loadPagSeguro() {
                const script = document.createElement('script');
                script.async = true;
                script.src = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js';
                script.onload = () => {
                    this.isPagSeguroLoaded = true;
                };
                document.head.appendChild(script);
            },
            clearCreditCardData() {
                this.customerCreditCardHolder = EMPTY_STRING;
                this.customerCreditCardNumber = EMPTY_STRING;
                this.customerCreditCardDate = EMPTY_STRING;
                this.customerCreditCardCVV = EMPTY_STRING;
            },
            async handleDeliveryOptions() {
                const response = await this.captureDeliveryOptions();
                if (!response.succeeded)
                    return;
                this.deliveryOptions = response.data;
            },
            async captureDeliveryOptions() {
                const defaultErrorMessage = 'Falha ao capturar as opções de entrega';
                try {
                    const response = await fetch(`${DELIVERY_BASE_URL}/delivery`, {
                        credentials: 'include',
                        headers: {
                            Accept: 'application/json',
                        },
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
            },
            setDeliveryDate(shiftDays) {
                const deliveryOption = this.deliveryOptions?.dates?.find(({ shift_days }) => shift_days === shiftDays);
                if (!deliveryOption || this.deliveryDate === shiftDays)
                    return;
                this.deliveryDate = deliveryOption.shift_days;
                this.deliveryHour = NULL_VALUE;
                this.deliveryPrice = NULL_VALUE;
            },
            setDeliveryHour(_hour) {
                if (this.deliveryHour === _hour || this.getSelectedDateDetails?.periods.periods_count === 0)
                    return;
                this.deliveryHour = _hour;
            },
            async captureDeliveryQuotation(controller) {
                const defaultErrorMessage = 'Falha ao gerar uma cotação';
                try {
                    const response = await fetch(`${XANO_BASE_URL}/api:i6etHc7G/site/checkout-delivery`, {
                        ...POST_REQUEST,
                        credentials: 'include',
                        signal: controller.signal,
                        body: stringify(this.quotationPayload),
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
            },
            async handleSubsidy() {
                const shippingCEP = this.getParsedAddresses.shippingaddress.zipPostalCode;
                if (!/^\d{5}\-\d{3}$/.test(shippingCEP))
                    return;
                const response = await this.verifyForSubsidy(numberOnly(shippingCEP));
                this.subsidy = response.succeeded
                    ? response.data
                    : NULL_VALUE;
            },
            async verifyForSubsidy(cep) {
                const defaultErrorMessage = 'Houve uma falha na verificação';
                try {
                    const response = await fetch(`${DELIVERY_BASE_URL}/delivery/${cep}/subsidy`, {
                        credentials: 'include',
                        headers: {
                            Accept: 'application/json',
                        },
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
            },
        },
        computed: {
            hasSelectedPaymentMethod() {
                return this.selectedPayment !== NULL_VALUE;
            },
            isCreditCard() {
                return this.selectedPayment === CREDIT_CARD_PAYMENT;
            },
            getOrderSubtotal() {
                return this.productlist?.order_price ?? 0;
            },
            getOrderSubtotalFormatted() {
                return BRLFormatter.format(this.getOrderSubtotal);
            },
            getOrderPrice() {
                return [
                    this.getOrderSubtotal,
                    this.getShippingPrice,
                    this.priorityFee,
                    this.subsidyDiscountPrice,
                    this.getCouponDiscountPrice,
                ].reduce((finalPrice, price) => {
                    return finalPrice + price;
                }, 0);
            },
            getOrderPriceFormatted() {
                return BRLFormatter.format(this.getOrderPrice);
            },
            getShippingPrice() {
                if (this.hasFreeShippingByCartPrice)
                    return 0;
                return this.deliveryPrice === NULL_VALUE
                    ? 0
                    : this.deliveryPrice.value / 100;
            },
            getShippingPriceFormatted() {
                if (this.hasFreeShippingByCartPrice)
                    return 'Frete grátis';
                return BRLFormatter.format(this.getShippingPrice);
            },
            getCouponDiscountPrice() {
                if (this.hasNullCoupon || this.hasInvalidCoupon)
                    return 0;
                const { value, cupom_type, is_percentage, } = this.coupon;
                const selectedPrice = this.getParsedPriceForApplyDiscount;
                let discountPrice = is_percentage
                    ? Math.min(value / 100, 1) * (selectedPrice * -1)
                    : Math.min(selectedPrice, value) * -1;
                if (this.hasSubsidy && cupom_type === SHIPPING_NAME_TOKEN) {
                    return Math.max(this.getShippingPrice + this.subsidyDiscountPrice, 0);
                }
                return discountPrice;
            },
            getCouponDiscountPriceFormatted() {
                return BRLFormatter.format(this.getCouponDiscountPrice);
            },
            getParsedPriceForApplyDiscount() {
                if (this.hasNullCoupon || this.hasInvalidCoupon)
                    return 0;
                const { cupom_type } = this.coupon;
                return {
                    subtotal: this.getOrderSubtotal,
                    shipping: this.getShippingPrice,
                    product_id: 0,
                }[cupom_type];
            },
            getParsedProducts() {
                const productlist = this.productlist?.items;
                if (!productlist)
                    return [];
                return productlist.map(({ name, imageUrl, quantity, price }) => ({
                    name: name,
                    image: imageUrl,
                    quantity: quantity,
                    price: BRLFormatter.format(price),
                    finalPrice: BRLFormatter.format(price * quantity),
                }));
            },
            isPersonalDataValid() {
                return !this.isSubmitted || [
                    this.customerMailValidation.valid,
                    this.customerBirthdateValidation.valid,
                    this.customerCPFValidation.valid,
                    this.customerPhoneValidation.valid
                ].every(Boolean);
            },
            customerMailValidation() {
                return buildFieldValidation(this.customerMailElement, !this.hasVisitRegistry('customerMail') || regexTest(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, this.customerMail));
            },
            customerBirthdateValidation() {
                const { customerBirthdate } = this;
                return buildFieldValidation(this.customerBirthdateElement, !this.hasVisitRegistry('customerBirthdate') || regexTest(/^\d{2}\/\d{2}\/\d{4}$/, customerBirthdate) && isDateValid(customerBirthdate));
            },
            customerCPFValidation() {
                const { customerCPF } = this;
                return buildFieldValidation(this.customerCPFElement, !this.hasVisitRegistry('customerCPF') || regexTest(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, this.customerCPF) && isCPFValid(customerCPF));
            },
            customerPhoneValidation() {
                return buildFieldValidation(this.customerPhoneElement, !this.hasVisitRegistry('customerPhone') || regexTest(/\(\d{2}\)\s\d{4,5}-\d{4}/, this.customerPhone));
            },
            paymentMethodValidation() {
                return buildFieldValidation(this.paymentMethodMessageElement, this.selectedPayment !== NULL_VALUE);
            },
            customerCreditCardHolderValidation() {
                return buildFieldValidation(this.customerCreditCardHolderElement, !this.hasVisitRegistry('customerCreditCardHolder') || /^(\w{2,})(\s+(\w+))+$/.test(normalizeText(trimText(this.customerCreditCardHolder).replace(/\s{2,}/g, ' '))), !this.isCreditCard);
            },
            customerCreditCardNumberValidation() {
                return buildFieldValidation(this.customerCreditCardNumberElement, !this.hasVisitRegistry('customerCreditCardNumber') || regexTest(/^(\d{4})(\s\d{4}){2}(\s\d{3,4})$/, trimText(this.customerCreditCardNumber)), !this.isCreditCard);
            },
            customerCreditCardDateValidation() {
                const { customerCreditCardDate } = this;
                return buildFieldValidation(this.customerCreditCardDateElement, !this.hasVisitRegistry('customerCreditCardDate') || regexTest(/^(1[012]|0[1-9])\/\d{2}$/, customerCreditCardDate) && isExpireDateValid(customerCreditCardDate), !this.isCreditCard);
            },
            customerCreditCardCVVValidation() {
                return buildFieldValidation(this.customerCreditCardCVVElement, !this.hasVisitRegistry('customerCreditCardCVV') || regexTest(/^\d{3}$/, this.customerCreditCardCVV), !this.isCreditCard);
            },
            isCreditCardGroupValid() {
                return [
                    this.customerCreditCardHolderValidation.valid,
                    this.customerCreditCardNumberValidation.valid,
                    this.customerCreditCardDateValidation.valid,
                    this.customerCreditCardCVVValidation.valid,
                ].every(Boolean);
            },
            billingCEPValidation() {
                return buildFieldValidation(this.billingCEPElement, !this.hasVisitRegistry('billingCEP') || regexTest(/^\d{5}-\d{3}$/, this.billingCEP), !this.isCreditCard);
            },
            billingAddressValidation() {
                return buildFieldValidation(this.billingAddressElement, !this.hasVisitRegistry('billingAddress') || objectSize(trimText(this.billingAddress)) > 2, !this.isCreditCard);
            },
            billingNumberValidation() {
                return buildFieldValidation(this.billingNumberElement, !this.hasVisitRegistry('billingNumber') || objectSize(this.billingNumber) > 0, !this.isCreditCard);
            },
            billingNeighborhoodValidation() {
                return buildFieldValidation(this.billingNeighborhoodElement, !this.hasVisitRegistry('billingNeighborhood') || objectSize(this.billingNeighborhood) > 0, !this.isCreditCard);
            },
            billingCityValidation() {
                return buildFieldValidation(this.billingCityElement, !this.hasVisitRegistry('billingCity') || objectSize(this.billingCity) > 2, !this.isCreditCard);
            },
            billingStateValidation() {
                return buildFieldValidation(this.billingStateElement, !this.hasVisitRegistry('billingState') || includes(statesAcronym, this.billingState), !this.isCreditCard);
            },
            isBillingAddressGroupValid() {
                return this.deliveryBillingAddressErrorMessage === NULL_VALUE && [
                    this.billingCEPValidation,
                    this.billingAddressValidation,
                    this.billingNumberValidation,
                    this.billingNeighborhoodValidation,
                    this.billingCityValidation,
                    this.billingStateValidation,
                ].every(validation => validation.valid);
            },
            deliveryPlaceValidation() {
                return buildFieldValidation(this.deliveryPlaceMessageElement, this.hasSelectedAddress && this.deliveryPlaceAddressErrorMessage === NULL_VALUE, !this.isCreditCard);
            },
            shippingRecipientValidation() {
                return buildFieldValidation(this.shippingRecipientElement, !this.hasVisitRegistry('shippingRecipient') || regexTest(/^(\w{2,})(\s+(\w+))+$/, normalizeText(trimText(this.shippingRecipient)).replace(/\s{2,}/g, ' ')), !this.shouldValidateShippingAddress);
            },
            shippingCEPValidation() {
                return buildFieldValidation(this.shippingCEPElement, !this.hasVisitRegistry('shippingCEP') || regexTest(/^\d{5}-\d{3}$/, this.shippingCEP), !this.shouldValidateShippingAddress);
            },
            shippingAddressValidation() {
                return buildFieldValidation(this.shippingAddressElement, !this.hasVisitRegistry('shippingAddress') || objectSize(trimText(this.shippingAddress)) > 2, !this.shouldValidateShippingAddress);
            },
            shippingNumberValidation() {
                return buildFieldValidation(this.shippingNumberElement, !this.hasVisitRegistry('shippingNumber') || objectSize(trimText(this.shippingNumber)) > 0, !this.shouldValidateShippingAddress);
            },
            shippingNeighborhoodValidation() {
                return buildFieldValidation(this.shippingNeighborhoodElement, !this.hasVisitRegistry('shippingNeighborhood') || objectSize(trimText(this.shippingNeighborhood)) > 3, !this.shouldValidateShippingAddress);
            },
            shippingCityValidation() {
                return buildFieldValidation(this.shippingCityElement, !this.hasVisitRegistry('shippingCity') || objectSize(trimText(this.shippingCity)) > 2, !this.shouldValidateShippingAddress);
            },
            shippingStateValidation() {
                return buildFieldValidation(this.shippingStateElement, !this.hasVisitRegistry('shippingState') || includes(statesAcronym, this.shippingState), !this.shouldValidateShippingAddress);
            },
            isShippingAddressGroupValid() {
                return this.deliveryShippingAddressErrorMessage === NULL_VALUE && [
                    this.shippingCEPValidation,
                    this.shippingAddressValidation,
                    this.shippingNumberValidation,
                    this.shippingNeighborhoodValidation,
                    this.shippingCityValidation,
                    this.shippingStateValidation,
                ].every(validation => validation.valid);
            },
            deliveryDatesGroupValidation() {
                return buildFieldValidation(this.deliveryDateMessageElement, this.deliveryDate !== NULL_VALUE, !this.paymentMethodValidation.valid);
            },
            deliveryHoursGroupValidation() {
                return buildFieldValidation(this.deliveryHourMessageElement, this.deliveryHour !== NULL_VALUE, !this.deliveryDatesGroupValidation.valid);
            },
            installmentGroupValidation() {
                return buildFieldValidation(this.installmentsMessageElement, this.selectedInstallment !== NULL_VALUE, !this.isCreditCard || !this.paymentMethodValidation.valid);
            },
            notIgnoredFields() {
                return [
                    this.customerMailValidation,
                    this.customerBirthdateValidation,
                    this.customerCPFValidation,
                    this.customerPhoneValidation,
                    this.paymentMethodValidation,
                    this.customerCreditCardHolderValidation,
                    this.customerCreditCardNumberValidation,
                    this.customerCreditCardDateValidation,
                    this.customerCreditCardCVVValidation,
                    this.billingCEPValidation,
                    this.billingAddressValidation,
                    this.billingNumberValidation,
                    this.billingNeighborhoodValidation,
                    this.billingCityValidation,
                    this.billingStateValidation,
                    this.deliveryPlaceValidation,
                    this.shippingRecipientValidation,
                    this.shippingCEPValidation,
                    this.shippingAddressValidation,
                    this.shippingNumberValidation,
                    this.shippingNeighborhoodValidation,
                    this.shippingCityValidation,
                    this.shippingStateValidation,
                    this.deliveryDatesGroupValidation,
                    this.deliveryHoursGroupValidation,
                    this.installmentGroupValidation,
                ].filter(({ ignoreIf }) => includes([false, undefined], ignoreIf));
            },
            firstInvalidField() {
                return this.notIgnoredFields.find(({ valid }) => !valid) ?? NULL_VALUE;
            },
            hasSelectedAddress() {
                return this.deliveryPlace !== NULL_VALUE;
            },
            isSameAddress() {
                return this.deliveryPlace === DELIVERY_TYPE_SAME;
            },
            isDiffAddress() {
                return this.deliveryPlace === DELIVERY_TYPE_DIFF;
            },
            shouldValidateShippingAddress() {
                return this.isCreditCard
                    ? this.showShippingAddressSelector && !this.isSameAddress
                    : true;
            },
            showShippingAddressSelector() {
                return !this.isCreditCard || (this.isCreditCard && this.hasSelectedAddress);
            },
            getParsedAddresses() {
                const parseState = (acronym) => statesMap?.[acronym] ?? EMPTY_STRING;
                const parseComplement = (complement) => trimText(complement).replace(/-+/g, EMPTY_STRING) || 'N/A';
                const shippingaddress = {
                    zipPostalCode: this.shippingCEP,
                    street: this.shippingAddress,
                    number: this.shippingNumber,
                    complement: parseComplement(this.shippingComplement),
                    neighbourhood: this.shippingNeighborhood,
                    city: this.shippingCity,
                    state: parseState(this.shippingState)
                };
                const billingaddress = {
                    zipPostalCode: this.billingCEP,
                    street: this.billingAddress,
                    number: this.billingNumber,
                    complement: parseComplement(this.billingComplement),
                    neighbourhood: this.billingNeighborhood,
                    city: this.billingCity,
                    state: parseState(this.billingState)
                };
                if (this.isCreditCard) {
                    return {
                        billingaddress,
                        shippingaddress: this.isSameAddress
                            ? billingaddress
                            : shippingaddress
                    };
                }
                return {
                    shippingaddress,
                    billingaddress: shippingaddress,
                };
            },
            getParsedCustomer() {
                return {
                    name: this.isCreditCard
                        ? this.customerCreditCardHolder
                        : this.shippingRecipient,
                    cpf: this.customerCPF,
                    email: this.customerMail,
                    birthDate: this.customerBirthdate,
                    phone: this.customerPhone,
                };
            },
            getParsedDeliveryData() {
                const { getSelectedHourDetails, getSelectedDateDetails, } = this;
                return {
                    delivery_hour: {
                        value: this.deliveryHour,
                        validator: getSelectedHourDetails?.validator,
                        has_priority: getSelectedHourDetails?.has_priority,
                    },
                    delivery_date: {
                        value: this.deliveryDate,
                        validator: getSelectedDateDetails?.validator,
                        has_priority: getSelectedDateDetails?.has_priority,
                    },
                };
            },
            getOrderBaseData() {
                return {
                    user_id: NULL_VALUE,
                    coupon_code: this.hasInvalidCoupon || this.hasNullCoupon
                        ? NULL_VALUE
                        // @ts-ignore
                        : this.coupon?.code,
                    delivery: {
                        ...this.getParsedDeliveryData,
                        delivery_price: this.deliveryPrice,
                    },
                };
            },
            showInstallmentSection() {
                return this.isCreditCard && objectSize(this.installment ?? []) > 0;
            },
            getParsedInstallments() {
                const { installment } = this;
                if (!installment)
                    return [];
                return installment.map(({ installments, installment_value }) => ({
                    installments,
                    installment_value: BRLFormatter.format(installment_value),
                }));
            },
            hasNullCoupon() {
                return this.coupon === NULL_VALUE;
            },
            hasAppliedCoupon() {
                return hasOwn(this.coupon ?? {}, 'cupom_type');
            },
            hasInvalidCoupon() {
                return hasOwn(this.coupon ?? {}, ERROR_KEY);
            },
            isCouponCodeValid() {
                const { couponCode } = this;
                return objectSize(trimText(couponCode)) > 4 && !regexTest(/[^A-Z\d]/, couponCode);
            },
            getCreditCardToken() {
                if (!this.isPagSeguroLoaded) {
                    return {
                        errors: [],
                        hasErrors: false,
                        encryptedCard: NULL_VALUE,
                    };
                }
                const [month, year,] = this.customerCreditCardDate.split(SLASH_STRING);
                return window.PagSeguro.encryptCard({
                    expMonth: month,
                    expYear: '20'.concat(year),
                    holder: this.customerCreditCardHolder,
                    securityCode: this.customerCreditCardCVV,
                    number: numberOnly(this.customerCreditCardNumber),
                    publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxPIKWT6ettkFKqSyfoUpH/550Q8YQtRf7ZYJJbV3U7/4HBtamJT9If4wiLs2YlEfwTPWlB5Cl0jGmkBSQkjIDF+QTOSJviZYKgiuR7Bnavgt+idkcZsd5hM1I6u1uwOJJE3wSSXg+Nw70GZCeg7A6bmq9tOu1827En/ZFKWBXqv9Upc7q/Y6N0XMzZ3CL1j6ZlhnCalQzzaV9whijxK22lIL78gLEUcnmEO7CUX6DyfcdlA13MM4X538k2eYUosdnKafCEDNVcT+PPUeUdJZ0CpBWA9c/XtO0BIbTXHTsDuDlX0r7BF0vMFJMi0D9lkFCavY/kjZEQYhnXMtrWlUWwIDAQAB',
                });
            },
            hasDeliveryDates() {
                const { deliveryOptions } = this;
                return isArray(deliveryOptions?.dates) && objectSize(deliveryOptions?.dates) > 0;
            },
            hasDeliveryHour() {
                return this.deliveryDate !== NULL_VALUE && objectSize(this.getParsedDeliveryHours) > 0;
            },
            getParsedDeliveryHours() {
                if (!this.hasDeliveryDates || this.getSelectedDateDetails === NULL_VALUE)
                    return [];
                const hourList = this.getSelectedDateDetails.periods.hours;
                return hourList.map(({ label, hour }) => ({
                    hour,
                    label,
                }));
            },
            quotationPayload() {
                if ([this.deliveryDate, this.deliveryHour].some(v => v === NULL_VALUE))
                    return false;
                const shippingCEP = this.getParsedAddresses.shippingaddress.zipPostalCode;
                if (!/^\d{5}\-\d{3}$/.test(shippingCEP))
                    return false;
                const { delivery_hour, delivery_date, } = this.getParsedDeliveryData;
                return {
                    cep: shippingCEP,
                    delivery_hour,
                    delivery_date,
                };
            },
            getParsedDeliveryDates() {
                if (this.deliveryOptions === NULL_VALUE)
                    return [];
                const selectedDate = this.deliveryDate;
                return this.deliveryOptions.dates.map(({ label, shift_days }) => ({
                    label,
                    shift_days,
                    selected: selectedDate === shift_days,
                }));
            },
            getSelectedDateDetails() {
                if (!this.deliveryDate === NULL_VALUE)
                    return NULL_VALUE;
                const selectedDate = this.deliveryOptions?.dates.find(({ shift_days }) => shift_days === this.deliveryDate);
                if (!selectedDate)
                    return NULL_VALUE;
                return selectedDate;
            },
            getSelectedHourDetails() {
                if (!this.getSelectedDateDetails || !this.deliveryHour)
                    return NULL_VALUE;
                return this.getSelectedDateDetails.periods.hours.find(({ hour }) => hour === this.deliveryHour) ?? NULL_VALUE;
            },
            hasPriorityFee() {
                if (!this.hasDeliveryHour || !this.getSelectedDateDetails || !this.getSelectedHourDetails)
                    return false;
                return this.getSelectedDateDetails.has_priority && this.getSelectedHourDetails.has_priority;
            },
            priorityFee() {
                return this.hasPriorityFee
                    ? this.deliveryOptions?.priority_fee
                    : 0;
            },
            priorityFeeFormatted() {
                return BRLFormatter.format(this.priorityFee);
            },
            hasSubsidy() {
                return this.subsidy?.has === true && this.getShippingPrice > 0;
            },
            subsidyDiscountPrice() {
                return this.subsidy?.has === true
                    ? Math.min(this.subsidy.value, this.getShippingPrice) * -1
                    : 0;
            },
            subsidyDiscountPriceFormatted() {
                return BRLFormatter.format(this.subsidyDiscountPrice);
            },
            hasFreeShippingByCartPrice() {
                return this.getOrderSubtotal >= FREE_SHIPPING_MIN_CART_PRICE;
            },
        },
        watch: {
            billingCEP(cep, oldCep) {
                this.captureAddress(BILLING_NAME_TOKEN, cep, oldCep).then(succeeded => {
                    if (!succeeded)
                        return;
                    this.deliveryPlaceAddressErrorMessage = NULL_VALUE;
                    if (this.deliveryPlace === DELIVERY_TYPE_SAME) {
                        this.deliveryPlace = NULL_VALUE;
                    }
                });
            },
            shippingCEP(cep, oldCep) {
                this.deliveryDate = NULL_VALUE;
                this.deliveryHour = NULL_VALUE;
                this.captureAddress(SHIPPING_NAME_TOKEN, cep, oldCep);
            },
            getOrderPrice: {
                immediate: true,
                handler: function () {
                    this.refreshInstallments();
                }
            },
            getCreditCardToken(payload) {
                if (payload.hasErrors)
                    return;
                this.refreshInstallments();
            },
            quotationPayload(payload, oldPayload, cleanup) {
                if (!payload)
                    return;
                const { cep, delivery_hour, delivery_date, } = payload;
                if (!/^\d{5}\-\d{3}$/.test(cep))
                    return;
                const controller = getAbortController();
                if (!oldPayload) {
                    this.isDeliveryLoading = true;
                    this.captureDeliveryQuotation(controller).then(response => {
                        if (!response.succeeded)
                            return;
                        const { total: value, validator, } = response.data;
                        this.deliveryPrice = {
                            value,
                            validator,
                        };
                        this.isDeliveryLoading = false;
                    });
                    return cleanup(() => controller.abort());
                }
                const { cep: oldCep, } = oldPayload;
                this.isDeliveryLoading = true;
                this.captureDeliveryQuotation(controller).then(response => {
                    if (!response.succeeded)
                        return;
                    const { total: value, validator, } = response.data;
                    this.deliveryPrice = {
                        value,
                        validator,
                    };
                    this.isDeliveryLoading = false;
                });
                return cleanup(() => controller.abort());
            },
            getParsedAddresses(currentAddresses, oldAddresses) {
                if (!currentAddresses || !oldAddresses)
                    return;
                if (currentAddresses.shippingaddress.zipPostalCode === oldAddresses.shippingaddress.zipPostalCode)
                    return;
                if (!/^\d{5}\-\d{3}$/.test(currentAddresses.shippingaddress.zipPostalCode))
                    return;
                if (this.isCreditCard && this.deliveryPlace === NULL_VALUE)
                    return;
                this.handleSubsidy();
            }
        },
        directives: {
            maskDate: buildMaskDirective(numberOnly, maskDate),
            maskCpf: buildMaskDirective(numberOnly, maskCPFNumber),
            maskPhone: buildMaskDirective(numberOnly, maskPhoneNumber),
            maskCreditCard: buildMaskDirective(numberOnly, maskCardNumber),
            maskCreditCardDate: buildMaskDirective(numberOnly, maskCardDate),
            maskNumberOnly: buildMaskDirective(numberOnly),
            maskCep: buildMaskDirective(numberOnly, maskCEP),
            upperCase: buildMaskDirective(toUpperCase),
            normalize: buildMaskDirective(normalizeText),
            visitedField: {
                mounted(el, { value, instance }) {
                    const remover = attachEvent(el, 'blur', (event) => {
                        instance.setVisitedField(value);
                        eventMap.delete(el);
                    }, { once: true });
                    eventMap.set(el, remover);
                },
                unmounted: cleanupDirective,
            },
        },
    });
    TalhoCheckoutApp.mount('#fechamentodopedido');
})();
export {};
