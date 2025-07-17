(function () {
    const NULL_VALUE = null;
    const COOKIE_SEPARATOR = '; ';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const SELECTED_CLASS = 'selecionado';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const STORAGE_KEY_NAME = 'talho_cart_items';
    const CART_SWITCH_CLASS = 'carrinhoflutuante--visible';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`;
    const CLICK_EVENT = 'click';
    /** Quantidade mínima de produtos permitidos no carrinho */
    const MIN_PRODUCT_QUANTITY = 1;
    /** Quantidade máxima de produtos permitados no carrinho */
    const MAX_PRODUCT_QUANTITY = 10;
    const COUNTER_REPLACEMENT = '{count}';
    const STOCK_MESSAGE = [
        `Temos apenas ${COUNTER_REPLACEMENT} unidade disponível.`,
        `Temos apenas ${COUNTER_REPLACEMENT} unidades disponíveis.`,
    ];
    const _state = {
        quantity: 1,
        stockCount: 0,
        product: NULL_VALUE,
        selectedVariation: NULL_VALUE,
    };
    const slug = location.pathname.split('/');
    function generateFetchHeaders(method, includeCredentials) {
        return {
            method: method,
            ...(includeCredentials && {
                credentials: 'include',
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
    }
    const state = new Proxy(_state, {
        get(target, key) {
            switch (key) {
                case 'variationsCount':
                    return objectSize(target.product?.variations ?? []);
                case 'hasPriceDifference':
                    {
                        const { price, full_price } = state.prices;
                        return price !== full_price;
                    }
                case 'prices':
                    {
                        const { product, selectedVariation } = target;
                        if (!product || !state.hasSelectedVariation)
                            return buildPriceResponse();
                        const selectedSKU = product.variations.find(sku => sku.id === selectedVariation);
                        if (!selectedSKU)
                            return buildPriceResponse();
                        return buildPriceResponse(selectedSKU.price, selectedSKU.full_price);
                    }
                case 'BRLPrices':
                    {
                        const { price, full_price } = state.prices;
                        return buildPriceResponse(BRLFormatter.format(price), BRLFormatter.format(full_price));
                    }
                case 'computedFinalPrices':
                    {
                        const { quantity, prices } = state;
                        const price = prices.price * quantity;
                        const full_price = prices.full_price * quantity;
                        return {
                            price: {
                                price,
                                full_price,
                            },
                            currency: {
                                price: BRLFormatter.format(price),
                                full_price: BRLFormatter.format(full_price),
                            },
                        };
                    }
                case 'hasSelectedVariation':
                    return target.selectedVariation !== NULL_VALUE;
                default:
                    return Reflect.get(target, key);
            }
        },
        set(target, key, value) {
            const isApplied = Reflect.set(target, key, value);
            switch (key) {
                case 'quantity':
                    changeTextContent(renderQuantityElement, String(value ?? 1));
                    renderProductPrice();
                    break;
                case 'selectedVariation':
                    renderProductVariations();
                    Reflect.set(state, 'quantity', 1);
                    break;
                case 'stockCount':
                    renderStockElements();
                    changeProductQuantity(0);
                    break;
                case 'product':
                    {
                        const product = value;
                        Reflect.set(state, 'stockCount', product?.stock_quantity ?? 0); // TODO: product.stock_quantity
                        Reflect.set(state, 'selectedVariation', product?.variations[0].id ?? NULL_VALUE);
                    }
            }
            return isApplied;
        }
    });
    const maxAvailableProductsElement = querySelector('[data-wtf-error-message-sku-maximum]');
    const outtaStockElement = querySelector('[data-wtf-error-message-invetory]');
    const minusButton = querySelector('[data-wtf-quantity-minus]');
    const plusButton = querySelector('[data-wtf-quantity-plus]');
    const renderQuantityElement = querySelector('[data-wtf-quantity-value]');
    const priceViewer = querySelector('[data-wtf-price]');
    const fullPriceViewer = querySelector('[data-wtf-full-price]');
    const totalPriceViewer = querySelector('[data-wtf-total]');
    const skuList = querySelector('[data-wtf-sku-list]');
    const skuItem = querySelector('[data-wtf-sku-item]');
    const shippingCalcCTA = querySelector('[data-wtf-shipping-button]');
    const shippingBlock = querySelector('[data-wtf-shipping-form]');
    const shippingValue = querySelector('[data-wtf-shipping-value]');
    const buyButton = querySelector('[data-wtf-comprar]');
    const BRLFormatter = new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        style: 'currency',
    });
    function replaceText(value, search, replacer) {
        return value.replace(search, replacer);
    }
    function stringify(value) {
        return JSON.stringify(value);
    }
    function clamp(min, max, value) {
        return Math.max(min, Math.min(max, value));
    }
    function objectSize(value) {
        return value.length;
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
    function isPageLoading(status) {
        toggleClass(querySelector('[data-wtf-loader]'), GENERAL_HIDDEN_CLASS, !status);
    }
    function changeTextContent(element, textContent) {
        if (!element)
            return;
        element.textContent = textContent;
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
    function buildPriceResponse(price = 0, full_price = 0) {
        return {
            price,
            full_price,
        };
    }
    async function getProduct(pathname) {
        const defaultErrorMessage = 'Houve uma falha ao capturar o produto';
        try {
            const response = await fetch(`${CART_BASE_URL}/product/single-product-page`, {
                ...generateFetchHeaders('POST', true),
                body: stringify({
                    quantity: 1,
                    reference_id: pathname,
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
    }
    function changeProductQuantity(increment) {
        const newQuantity = increment + state.quantity;
        const maxProductQuantityFromStock = Math.min(state.stockCount, MAX_PRODUCT_QUANTITY);
        const clampedQuantity = clamp(MIN_PRODUCT_QUANTITY, maxProductQuantityFromStock, newQuantity);
        if (clampedQuantity === state.quantity)
            return;
        state.quantity = clampedQuantity;
    }
    function changeSelectedVariation(variationID) {
        const variationExists = state.product?.variations.some(({ id }) => id === variationID);
        if (!variationExists)
            return;
        state.selectedVariation = variationID;
    }
    async function buyProduct(event) {
        event.preventDefault();
        const { quantity, product, selectedVariation } = state;
        if (!selectedVariation || !product || state.stockCount === 0)
            return;
        const response = await addProductToCart({
            quantity,
            sku_id: selectedVariation,
            reference_id: product.slug,
        });
        // TODO: Implementar lógica corretamente
        if (!response.succeeded) {
            return alert('A adição falhou');
        }
        state.quantity = 1;
        addClass(querySelector('#carrinho-flutuante'), CART_SWITCH_CLASS);
        localStorage.setItem(STORAGE_KEY_NAME, stringify(response.data));
    }
    async function addProductToCart(item) {
        const defaultErrorMessage = 'Falha ao adicionar o produto';
        try {
            const response = await fetch(`${CART_BASE_URL}/cart/handle`, {
                ...generateFetchHeaders('POST', true),
                body: stringify({
                    item,
                    operation: 'add',
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const data = await response.json();
            return postSuccessResponse(data);
        }
        catch (e) {
            return postErrorResponse(`[CATCH] ${defaultErrorMessage}`);
        }
    }
    function renderProductVariations() {
        if (!skuList || !skuItem || !state.product)
            return;
        const { selectedVariation, product } = state;
        const variationsFragment = document.createDocumentFragment();
        const weightSelector = querySelector('[data-wtf-weight-selector]');
        const UNSUFFICIENT_VARIATIONS = state.variationsCount < 2;
        if (UNSUFFICIENT_VARIATIONS) {
            return weightSelector?.remove();
        }
        toggleClass(weightSelector, GENERAL_HIDDEN_CLASS, UNSUFFICIENT_VARIATIONS);
        for (const variation of product?.variations) {
            const variationElement = document.createElement('div');
            const isSelected = selectedVariation === variation.id;
            addClass(variationElement, 'text-block');
            toggleClass(variationElement, SELECTED_CLASS, isSelected);
            changeTextContent(variationElement, replaceText(variation.label, /\./g, ','));
            if (!isSelected) {
                attachEvent(variationElement, CLICK_EVENT, () => changeSelectedVariation(variation.id));
            }
            variationsFragment.appendChild(variationElement);
        }
        skuList.replaceChildren(variationsFragment);
    }
    function renderProductPrice() {
        const product = state.product;
        if (!product || !state.hasSelectedVariation)
            return;
        const getPriceViewer = (parent) => querySelector('[data-wtf-price-value]', parent);
        const { BRLPrices, hasPriceDifference, computedFinalPrices } = state;
        changeTextContent(getPriceViewer(priceViewer), BRLPrices.price);
        changeTextContent(getPriceViewer(fullPriceViewer), BRLPrices.full_price);
        changeTextContent(getPriceViewer(totalPriceViewer), computedFinalPrices.currency.price);
        toggleClass(priceViewer, GENERAL_HIDDEN_CLASS, !hasPriceDifference);
        toggleClass(fullPriceViewer, GENERAL_HIDDEN_CLASS, !hasPriceDifference);
    }
    function renderStockElements() {
        const { stockCount, } = state;
        toggleClass(outtaStockElement, GENERAL_HIDDEN_CLASS, stockCount > 0);
        const hideAvailableMessage = toggleClass(maxAvailableProductsElement, GENERAL_HIDDEN_CLASS, stockCount > 10 || stockCount < 1);
        if (hideAvailableMessage)
            return;
        const maxIndexMessages = objectSize(STOCK_MESSAGE) - 1;
        changeTextContent(querySelector('div', maxAvailableProductsElement), replaceText(STOCK_MESSAGE[clamp(0, maxIndexMessages, stockCount - 1)], COUNTER_REPLACEMENT, stockCount.toString()));
    }
    function maskCEP(value) {
        return value.replace(/^(\d{0,5})(\d{0,3})/, (_, g1, g2) => {
            const response = [];
            for (const group of [g1, g2]) {
                group && response.push(group);
            }
            return response.join('-');
        });
    }
    function startShippingForm() {
        const form = querySelector('form', shippingBlock);
        if (!form)
            return;
        const removalAttributes = [
            'name',
            'method',
            'data-name',
            'aria-label',
            'data-wf-page-id',
            'data-wf-element-id',
            'data-turnstile-sitekey'
        ];
        for (const attribute of removalAttributes) {
            removeAttribute(form, attribute);
        }
        removeClass(shippingBlock, 'w-form');
        const parentElement = form.parentElement;
        parentElement.innerHTML = form.outerHTML;
        const updatedForm = querySelector('#shipping-cep-form');
        if (!updatedForm)
            return;
        attachEvent(updatedForm, 'input', (e) => {
            e.stopPropagation();
            const target = e.target;
            const cleanValue = target.value.replace(/\D+/g, '');
            if (target.name !== 'cep' || target.value === maskCEP(cleanValue) || !e.isTrusted)
                return;
            target.value = maskCEP(cleanValue);
            target.dispatchEvent(new Event('input'));
        });
        attachEvent(updatedForm, 'submit', async (e) => {
            e.preventDefault();
            const cep = updatedForm.cep.value;
            const response = await deliveryQuotation({
                cep,
                reference_id: slug[objectSize(slug) - 1]
            });
            if (!response.succeeded) {
                return; // TODO: necessário exibir o erro recebido
            }
            switch (response.data.type) {
                case 'quotation':
                    return drawQuotation(response.data.data);
                case 'locationlist':
                    return drawLocations(response.data.data);
            }
        });
    }
    function drawQuotation(quotation) {
        addClass(shippingCalcCTA, GENERAL_HIDDEN_CLASS);
        addClass(shippingBlock, GENERAL_HIDDEN_CLASS);
        removeClass(shippingValue, GENERAL_HIDDEN_CLASS);
        // TODO: necessário exibir a data de validade da cotação
        changeTextContent(querySelector('[data-wtf-quotation-price]', shippingValue), BRLFormatter.format(quotation.total / 100));
        attachEvent(querySelector('[data-wtf-quotation-reload]', shippingValue), 'click', e => {
            removeClass(shippingBlock, GENERAL_HIDDEN_CLASS);
            addClass(shippingValue, GENERAL_HIDDEN_CLASS);
        }, { once: true });
    }
    function drawLocations(locations) {
        console.log(locations.length, ' localizações recebidas');
    }
    async function deliveryQuotation(payload) {
        const defaultErrorMessage = 'Houve uma falha ao gerar a cotação';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:i6etHc7G/site/product-delivery`, {
                ...generateFetchHeaders('POST', true),
                body: stringify(payload),
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultErrorMessage);
            }
            const data = await response.json();
            return postSuccessResponse(data);
        }
        catch (error) {
            return postErrorResponse(defaultErrorMessage);
        }
    }
    getProduct(slug[objectSize(slug) - 1])
        .then(response => {
        if (!response.succeeded)
            return;
        state.product = response.data.product;
        if (response.data.delivery !== NULL_VALUE) {
            startShippingForm();
            drawQuotation(response.data.delivery);
        }
    })
        .then(() => {
        attachEvent(plusButton, CLICK_EVENT, () => changeProductQuantity(1));
        attachEvent(minusButton, CLICK_EVENT, () => changeProductQuantity(-1));
        attachEvent(buyButton, CLICK_EVENT, buyProduct);
        attachEvent(shippingCalcCTA, CLICK_EVENT, (e) => {
            e.preventDefault();
            addClass(shippingCalcCTA, GENERAL_HIDDEN_CLASS);
            removeClass(shippingBlock, GENERAL_HIDDEN_CLASS);
            startShippingForm();
        }, { once: true });
    });
})();
export {};
