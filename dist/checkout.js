(function () {
    const { ref, createApp, defineComponent } = Vue;
    const CART_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io/api:79PnTkh_';
    const REQUEST_HEADERS = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    };
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
    function normalizeText(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
    function numberOnly(value) {
        return value.replace(/\D+/g, '');
    }
    function scrollIntoView(element, args) {
        element.scrollIntoView(args);
    }
    function maskPhoneNumber(value) {
        const replacer = (_, d1, d2, d3) => {
            const response = [];
            d1 && response.push(`(${d1}`);
            d2 && response.push(`) ${d2}`);
            d3 && response.push(`-${d3}`);
            return response.join('');
        };
        if (value.length < 11) {
            return value.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, replacer);
        }
        return value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4})/, replacer);
    }
    function maskCPFNumber(value) {
        return value.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, g1, g2, g3, g4) => {
            const response = [];
            g1 && response.push(`${g1}`);
            g2 && response.push(`.${g2}`);
            g3 && response.push(`.${g3}`);
            g4 && response.push(`-${g4}`);
            return response.join('');
        });
    }
    function maskDate(value) {
        return value.replace(/^(\d{0,2})(\d{0,2})(\d{0,4})/, (_, d1, d2, d3) => {
            return [d1, d2, d3]
                .filter(Boolean)
                .join('/');
        });
    }
    function maskCardNumber(value) {
        return value.replace(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/, (_, g1, g2, g3, g4) => {
            const response = [];
            g1 && response.push(g1);
            g2 && response.push(g2);
            g3 && response.push(g3);
            g4 && response.push(g4);
            return response.join(' ');
        });
    }
    function maskCardDate(value) {
        return value.replace(/^(\d{0,2})(\d{0,2})/, (_, g1, g2) => {
            const response = [];
            g1 && response.push(g1);
            g2 && response.push(g2);
            return response.join('/');
        });
    }
    function maskCEP(value) {
        return value.replace(/^(\d{0,5})(\d{0,3})/, (_, g1, g2) => {
            const response = [];
            g1 && response.push(g1);
            g2 && response.push(g2);
            return response.join('-');
        });
    }
    function toUpperCase(value) {
        return value.toUpperCase();
    }
    function isArray(arg) {
        return Array.isArray(arg);
    }
    function pushIf(condition) { }
    function buildMaskDirective(...mappers) {
        return {
            mounted(el) {
                const remover = attachEvent(el, 'input', (event) => {
                    if (!event.isTrusted)
                        return;
                    const target = event.target;
                    target.value = mappers.reduce((value, callbackFn) => callbackFn(value), target.value ?? '');
                    el.dispatchEvent(INPUT_EVENT);
                });
                eventMap.set(el, remover);
            },
            unmounted(el) {
                const cleanup = eventMap.get(el);
                cleanup?.();
            },
        };
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
            return null;
        return node.querySelector(selector);
    }
    function attachEvent(node, eventName, callback, options) {
        if (!node)
            return;
        node.addEventListener(eventName, callback, options);
        return () => node.removeEventListener(eventName, callback, options);
    }
    const TalhoCheckoutApp = createApp(defineComponent({
        name: 'TalhoCheckoutApp',
        setup() {
            const customerCPF = ref('');
            const customerMail = ref('');
            const customerPhone = ref('');
            const customerBirthdate = ref('');
            const customerCreditCardCVV = ref('');
            const customerCreditCardDate = ref('');
            const customerCreditCardNumber = ref('');
            const customerCreditCardHolder = ref('');
            return {
                customerCPF,
                customerMail,
                customerPhone,
                customerBirthdate,
                customerCreditCardCVV,
                customerCreditCardDate,
                customerCreditCardNumber,
                customerCreditCardHolder,
            };
        },
        data() {
            return {
                productlist: null,
                selectedPayment: null,
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
                deliveryPlace: null,
                deliveryPlaces: [
                    {
                        token: DELIVERY_TYPE_SAME,
                        label: 'Mesmo endereço de cobrança do cartão'
                    },
                    {
                        token: DELIVERY_TYPE_DIFF,
                        label: 'Entregar em um endereço diferente'
                    }
                ]
            };
        },
        mounted() {
            this.getCart().then(cartData => {
                if (!cartData.succeeded)
                    return;
                this.productlist = cartData.data;
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
            setSelectedPaymentMethod(method) {
                if (this.selectedPayment === method)
                    return;
                this.selectedPayment = method;
            }
        },
        computed: {
            isCreditCard() {
                return this.selectedPayment === CREDIT_CARD_PAYMENT;
            },
            getOrderPrice() {
                return this.productlist?.order_price ?? 0;
            },
            getOrderPriceFormatted() {
                return BRLFormatter.format(this.getOrderPrice);
            },
            getShippingPrice() {
                return 0; // TODO: Retornar o valor correto do frete
            },
            getShippingPriceFormatted() {
                return BRLFormatter.format(this.getShippingPrice);
            },
            getParsedProducts() {
                const productlist = this.productlist?.items;
                if (!isArray(productlist))
                    return [];
                return this.productlist?.items.map(({ name, imageUrl, quantity, price }) => {
                    return ({
                        name: name,
                        image: imageUrl,
                        quantity: quantity,
                        price: BRLFormatter.format(price),
                        finalPrice: BRLFormatter.format(price * quantity),
                    });
                });
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
        }
    }));
    TalhoCheckoutApp.mount('#fechamentodopedido');
})();
export {};
