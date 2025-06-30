(function () {
    const { createApp, } = window.Vue;
    const EMPTY_STRING = '';
    const NULL_VALUE = null;
    const DEFAULT_TIME = '00:00:00';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io/api:5lp3Lw8X';
    const BRLFormatter = new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        style: 'currency',
    });
    function setPageLoader(status) {
        return toggleClass(querySelector('[data-wtf-loader]'), GENERAL_HIDDEN_CLASS, !status);
    }
    function toggleClass(element, className, force) {
        if (!element)
            return false;
        return element.classList.toggle(className, force);
    }
    function safeParseJson(value) {
        if (typeof value !== 'string')
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return NULL_VALUE;
        }
    }
    function buildURL(path, query = {}) {
        const baseURL = new URL(`${location.protocol}//${location.hostname}`);
        const nextPage = new URL(path, baseURL);
        for (const [key, value] of Object.entries(query)) {
            nextPage.searchParams.set(key, value);
        }
        return nextPage.toString();
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
        name: 'PIXProcessPage',
        setup() { },
        data() {
            return {
                now: Date.now(),
                hasCopied: false,
                order: NULL_VALUE,
                nowInterval: NULL_VALUE,
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
            if (!response.succeeded || response.data.payment_method !== 'pix') {
                location.href = buildURL('/');
                return;
            }
            this.order = response.data;
            this.setQRImage();
            if (response.data.pago) {
                setTimeout(() => {
                    location.href = buildURL('/pagamento/confirmacao-do-pedido', {
                        order: transactionId
                    });
                }, 5000);
                return;
            }
            if (response.data.expired)
                return;
            this.nowInterval = setInterval(() => this.now = Date.now(), 1000);
            if ('EventSource' in window) {
                return this.pollOrder(transactionId);
            }
        },
        methods: {
            pollOrder(orderId) {
                const source = new EventSource(`${XANO_BASE_URL}/confirm-pix/${orderId}`);
                source.addEventListener('message', async (event) => {
                    const orderData = safeParseJson(event.data);
                    if (orderData === NULL_VALUE)
                        return;
                    this.patchOrder({
                        ...orderData,
                        expired: DEFAULT_TIME === this.timmer || orderData.expired,
                    });
                    if (this.hasPaid || this.isExpired) {
                        source.readyState !== source.CLOSED && source.close();
                        this.clearInterval();
                    }
                    if (!this.hasPaid)
                        return;
                    setTimeout(() => {
                        location.href = buildURL('/pagamento/confirmacao-do-pedido', {
                            order: orderId
                        });
                    }, 5000);
                });
                document.addEventListener('beforeunload', () => {
                    if (source.readyState === source.CLOSED)
                        return;
                    source.close();
                    this.clearInterval();
                });
            },
            patchOrder({ pago, expired, total }) {
                if (!this.order)
                    return;
                this.order.pago = pago;
                this.order.total = total;
                this.order.expired = expired;
            },
            async getOrder(orderId) {
                const defaultErrorMessage = 'Falha ao capturar o pedido';
                try {
                    const response = await fetch(`${XANO_BASE_URL}/confirm-pix/${orderId}/rest`, {
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
            async handleCopyQRCode() {
                if (this.hasCopied)
                    return;
                this.hasCopied = true;
                if (navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(this.order?.qrcode_text ?? '');
                }
                else {
                    const input = document.createElement('input');
                    document.body.appendChild(input);
                    input.value = this.order?.qrcode_text ?? '';
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                }
                setTimeout(() => this.hasCopied = false, 3000);
            },
            setQRImage() {
                const QRImage = querySelector('[data-wtf-qr-code-image]');
                if (!QRImage)
                    return;
                QRImage.onload = () => {
                    setPageLoader(false);
                };
                QRImage.setAttribute('src', this.order?.qrcode ?? QRImage.getAttribute('src'));
            },
            clearInterval() {
                clearInterval(this.nowInterval);
                this.nowInterval = NULL_VALUE;
            },
        },
        computed: {
            orderPrice() {
                return BRLFormatter.format(this.order?.total ?? 0);
            },
            timmer() {
                if (!this.order || this.isExpired)
                    return DEFAULT_TIME;
                const secondsDiff = Math.floor(Math.max((this.order?.due_time ?? 0) - this.now, 0) / 1000);
                const hours = Math.floor(secondsDiff / 3600);
                const minutes = Math.floor((secondsDiff % 3600) / 60);
                const seconds = secondsDiff % 60;
                return [hours, minutes, seconds]
                    .map(time => time.toString().padStart(2, '0'))
                    .join(':');
            },
            hasPaid() {
                return this.order?.pago ?? false;
            },
            isExpired() {
                return this.order?.expired ?? false;
            },
            getQRCode() {
                return this.order?.qrcode_text ?? EMPTY_STRING;
            }
        },
        watch: {
            timmer(time) {
                if (time !== DEFAULT_TIME)
                    return;
                this.patchOrder({
                    expired: true,
                    total: this.order?.total ?? 0,
                    pago: this.order?.pago ?? false,
                });
            }
        },
    });
    TalhoOrderPage.mount(querySelector('#pixProcess'));
})();
export {};
