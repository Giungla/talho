(function () {
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const STORAGE_KEY_NAME = 'talho_cart_items';
    const ERROR_MESSAGE_CLASS = 'mensagemdeerro';
    const DISABLED_ATTR = 'disabled';
    const CART_SWITCH_CLASS = 'carrinhoflutuante--visible';
    const FREE_SHIPPING_MINIMUM_PRICE = 300;
    const REQUEST_CONTROLLERS = [];
    const CART_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io/api:79PnTkh_';
    const REQUEST_HEADERS = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    };
    const BRLFormatter = new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        style: 'currency',
    });
    const _state = {
        cart: null,
        fetched: null,
        isPending: false,
        isCartOpened: true,
    };
    const state = new Proxy(_state, {
        get(target, key) {
            switch (key) {
                case 'hasFreeShipping':
                    //TODO: Improve
                    return (target.cart?.order_price ?? 0) > FREE_SHIPPING_MINIMUM_PRICE;
                case 'missingForFreeShipping':
                    return Math.max(0, FREE_SHIPPING_MINIMUM_PRICE - (target.cart?.order_price ?? 0));
                case 'getOrderPrice':
                    return BRLFormatter.format(target.cart?.order_price ?? 0);
                default:
                    return Reflect.get(target, key);
            }
        },
        set(target, key, value) {
            const isApplied = Reflect.set(target, key, value);
            if (!isApplied)
                return isApplied;
            switch (key) {
                case 'isPending':
                    console.log('Alteração no estado de carregamento', value);
                    break;
                case 'isCartOpened':
                    refreshCartItems();
                    break;
                case 'cart':
                    renderCart();
                    handlePromoMessages();
                    localStorage.setItem(STORAGE_KEY_NAME, JSON.stringify(value));
                    break;
            }
            return isApplied;
        }
    });
    const cartItemTemplate = querySelector('[data-wtf-floating-cart-item]');
    const cartItemsWrapper = querySelector('[data-wtf-floating-cart-not-empty-cart]');
    const cartEmpty = querySelector('[data-wtf-floating-cart-empty-cart]');
    const promoValidElement = querySelector('[data-wtf-promo-valid]');
    const promoInValidElement = querySelector('[data-wtf-promo-invalid]');
    const cartTotalElement = querySelector('[data-wtf-floating-cart-total]');
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
    function changeTextContent(element, textContent) {
        if (!element)
            return;
        element.textContent = textContent;
    }
    function hasClass(element, className) {
        if (!element)
            return false;
        return element.classList.contains(className);
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
    function objectSize(value) {
        return value.length;
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
    async function refreshCartItems() {
        if (!state.isCartOpened)
            return;
        const cart = localStorage.getItem(STORAGE_KEY_NAME);
        if (cart) {
            state.fetched ??= true;
            state.cart = JSON.parse(cart);
            return;
        }
        state.isPending = true;
        const response = await getCartProducts();
        state.fetched ??= true;
        state.isPending = false;
        if (!response.succeeded) {
            // TODO: tratar e exibir o erro
            return;
        }
        state.cart = response.data;
    }
    async function getCartProducts() {
        const defaultErrorMessage = 'Houve uma falha ao buscar o seu carrinho';
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
    }
    async function updateCartProducts(item, operation) {
        const defaultErrorMessage = 'Houve uma falha ao buscar o seu carrinho';
        try {
            const response = await fetch(`${CART_BASE_URL}/cart/handle`, {
                ...REQUEST_HEADERS,
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    item,
                    operation,
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
    async function handleProductChangeQuantity(operation, payload) {
        state.isPending = true;
        const response = await updateCartProducts({
            ...payload,
            quantity: 1,
        }, operation);
        state.isPending = false;
        if (!response.succeeded)
            return;
        state.cart = response.data;
    }
    function renderCart() {
        changeTextContent(cartTotalElement, state.getOrderPrice);
        if (!Array.isArray(state.cart?.items) || !cartItemTemplate || !cartItemsWrapper)
            return;
        if (!toggleClass(cartEmpty, GENERAL_HIDDEN_CLASS, state.cart?.items.length > 0)) {
            return cartItemsWrapper.replaceChildren();
        }
        const cartFragment = document.createDocumentFragment();
        for (const item of state.cart.items) {
            const template = cartItemTemplate.cloneNode(true);
            changeTextContent(querySelector('[data-wtf-floating-cart-item-product-name]', template), item.name);
            changeTextContent(querySelector('[data-wtf-floating-cart-item-quantity]', template), item.quantity.toString());
            changeTextContent(querySelector('[data-wtf-floating-cart-item-product-price]', template), BRLFormatter.format(item.price));
            const productImage = document.createElement('img');
            productImage.setAttribute('src', item.imageUrl);
            querySelector('[data-wtf-floating-cart-item-image]', template)?.replaceChildren(productImage);
            const changeCartPayload = {
                sku_id: item.sku_id,
                reference_id: item.slug
            };
            const productEventMap = [
                ['delete', 'data-wtf-floating-cart-item-remove'],
                ['increase', 'data-wtf-floating-cart-item-plus-button'],
                ['decrease', 'data-wtf-floating-cart-item-minus-button'],
            ];
            for (const [operation, elementTrigger] of productEventMap) {
                attachEvent(querySelector(`[${elementTrigger}]`, template), 'click', (e) => execCartAction.call(e, operation, changeCartPayload));
            }
            cartFragment.appendChild(template);
        }
        cartItemsWrapper.replaceChildren(cartFragment);
    }
    function handlePromoMessages() {
        const { hasFreeShipping } = state;
        toggleClass(promoValidElement, GENERAL_HIDDEN_CLASS, !hasFreeShipping);
        toggleClass(promoInValidElement, GENERAL_HIDDEN_CLASS, hasFreeShipping);
        if (!hasFreeShipping) {
            return changeTextContent(querySelector('[data-wtf-promo-invalidada-txt]', promoInValidElement), `Adicione mais ${BRLFormatter.format(state.missingForFreeShipping)} e ganhe frete grátis`);
        }
        return changeTextContent(querySelector('[data-wtf-promo-validada-txt-sem-imagem]', promoValidElement), `Você ganhou frete grátis`);
    }
    async function execCartAction(operation, payload) {
        this.preventDefault();
        this.stopPropagation();
        await handleProductChangeQuantity(operation, payload);
    }
    const cart = querySelector('[data-wtf-floating-cart]');
    const cartObserver = new MutationObserver(mutations => {
        const _cart = mutations[0].target;
        state.isCartOpened = hasClass(_cart, CART_SWITCH_CLASS);
        // state.isCartOpened = _cart.checkVisibility({
        //   checkOpacity: true,
        //   checkVisibilityCSS: true,
        //   visibilityProperty: true,
        // })
    });
    if (!cart)
        return;
    cartObserver.observe(cart, {
        attributes: true,
        attributeFilter: [
            'class',
        ]
    });
    if (!cartItemsWrapper)
        return;
    window.addEventListener('storage', function (e) {
        if (e.key !== STORAGE_KEY_NAME)
            return;
        state.cart = e.newValue
            ? JSON.parse(e.newValue)
            : null;
    });
    refreshCartItems()
        .then(() => {
        state.isCartOpened = false;
    });
})();
export {};
