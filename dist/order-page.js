(function () {
    const { ref, createApp, } = window.Vue;
    const EMPTY_STRING = '';
    const NULL_VALUE = null;
    const FALLBACK_STRING = '-';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io/api:5lp3Lw8X';
    const BRLFormatter = new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        style: 'currency',
    });
    function toggleClass(element, className, force) {
        if (!element)
            return false;
        return element.classList.toggle(className, force);
    }
    function setPageLoader(status) {
        return toggleClass(querySelector('[data-wtf-loader]'), GENERAL_HIDDEN_CLASS, !status);
    }
    function querySelector(selector, node = document) {
        if (!node)
            return NULL_VALUE;
        return node.querySelector(selector);
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
    const TalhoOrderPage = createApp({
        name: 'TalhoOrderPage',
        setup() { },
        data() {
            return {
                order: NULL_VALUE,
            };
        },
        async created() {
            const searchParams = new URLSearchParams(location.search);
            const transactionId = searchParams.get('order');
            if (!transactionId) {
                location.href = '/';
                return;
            }
            const response = await this.getOrder(transactionId);
            if (!response.succeeded) {
                location.href = '/';
                return;
            }
            this.order = response.data;
            setPageLoader(false);
        },
        mounted() {
        },
        methods: {
            async getOrder(orderId) {
                const defaultErrorMessage = 'Falha ao capturar o pedido';
                try {
                    const response = await fetch(`${XANO_BASE_URL}/order-details/${orderId}`, {
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
            name() {
                return this.order?.name ?? FALLBACK_STRING;
            },
            email() {
                return this.order?.email ?? FALLBACK_STRING;
            },
            cpf() {
                return this.order?.cpf_cnpj ?? FALLBACK_STRING;
            },
            phone() {
                return this.order?.phone ?? FALLBACK_STRING;
            },
            shipping() {
                const { number = FALLBACK_STRING, cep = FALLBACK_STRING, address = FALLBACK_STRING, state = FALLBACK_STRING, city = FALLBACK_STRING, complement = FALLBACK_STRING, neighborhood = FALLBACK_STRING, user_name = FALLBACK_STRING, } = this.order?.shipping_address ?? {};
                return {
                    user_name,
                    cep,
                    address,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                };
            },
            billing() {
                const { cep = FALLBACK_STRING, address = FALLBACK_STRING, number = FALLBACK_STRING, complement = FALLBACK_STRING, neighborhood = FALLBACK_STRING, city = FALLBACK_STRING, state = FALLBACK_STRING, } = this.order?.billing_address ?? {};
                return {
                    cep,
                    address,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                };
            },
            hasOrderDiscount() {
                return this.order?.discount_code !== NULL_VALUE;
            },
            getOrderSubtotalPriceFormatted() {
                const price = this.order?.order_items.reduce((acc, { unit_amount, quantity }) => {
                    return acc + unit_amount * quantity;
                }, 0);
                return BRLFormatter.format(price ? (price / 100) : 0);
            },
            getOrderPriceFormatted() {
                return BRLFormatter.format(this.order?.total ?? 0);
            },
            getOrderShippingPriceFormatted() {
                return BRLFormatter.format(this.order?.shipping_total ?? 0);
            },
            getOrderDiscountPriceFormatted() {
                return BRLFormatter.format((this.order?.discount ?? 0) * -1);
            },
            getParsedProducts() {
                const { order_items = [] } = this.order ?? {};
                return order_items.map(({ title, slug, unit_amount, image, quantity, }) => ({
                    title,
                    quantity,
                    key: slug,
                    unit_amount: BRLFormatter.format(unit_amount / 100),
                    final_price: BRLFormatter.format((unit_amount * quantity) / 100),
                }));
            }
        },
    });
    TalhoOrderPage.mount(querySelector('#orderapp'));
})();
export {};
