(function () {
    const NULL_VALUE = null;
    const COOKIE_SEPARATOR = '; ';
    const DISABLED_ATTR = 'disabled';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const STORAGE_KEY_NAME = 'talho_cart_items';
    const CART_SWITCH_CLASS = 'carrinhoflutuante--visible';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`;
    const BRLFormatter = new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        style: 'currency',
    });
    const acquiring = new Set();
    function stringify(value) {
        return JSON.stringify(value);
    }
    function splitText(value, separator, limit) {
        return value.split(separator, limit);
    }
    function max(...n) {
        return Math.max(...n);
    }
    function getCookie(name) {
        const selectedCookie = splitText(document.cookie, COOKIE_SEPARATOR).find(cookie => {
            const { name: cookieName } = splitCookie(cookie);
            return cookieName === name;
        });
        return selectedCookie
            ? splitCookie(selectedCookie).value
            : false;
    }
    function splitCookie(cookie) {
        const [name, value] = splitText(cookie, '=');
        return {
            name,
            value
        };
    }
    const authCookie = getCookie(COOKIE_NAME);
    const HEADERS = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    const AUTH_HEADERS = {
        ...HEADERS,
        'Authorization': authCookie,
    };
    if (!authCookie) {
        location.href = '/acessos/entrar';
        return;
    }
    // @ts-ignore
    const orders = new Proxy({
        list: [],
    }, {
        get(target, key) {
            const ordersSize = objectSize(target.list);
            switch (key) {
                case 'hasOrders':
                    return ordersSize > 0;
                case 'ordersCount':
                    return ordersSize;
                default:
                    return target[key];
            }
        },
        set(target, key, value) {
            const isApplied = Reflect.set(target, key, value);
            if (!isApplied)
                return isApplied;
            switch (key) {
                case 'list':
                    renderOrders();
                    break;
            }
            return true;
        }
    });
    function changeTextContent(element, textContent) {
        if (!element)
            return;
        element.textContent = textContent;
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
    function removeAttribute(element, qualifiedName) {
        if (!element)
            return;
        element.removeAttribute(qualifiedName);
    }
    function setAttribute(element, qualifiedName, value) {
        if (!element)
            return;
        element.setAttribute(qualifiedName, value);
    }
    function isArray(arg) {
        return Array.isArray(arg);
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
    function objectSize(value) {
        return value.length;
    }
    function postSuccessResponse(response) {
        return {
            data: response,
            succeeded: true
        };
    }
    function postErrorResponse(message) {
        return {
            message,
            succeeded: false
        };
    }
    async function getOrders() {
        const defaultMessage = 'Falha ao buscar os pedidos';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:TJEuMepe/user/orders`, {
                headers: AUTH_HEADERS,
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultMessage);
            }
            const data = await response.json();
            return postSuccessResponse(data);
        }
        catch (e) {
            return postErrorResponse(defaultMessage);
        }
    }
    async function postReview({ comment, rating, product_id }) {
        const defaultMessage = 'Falha ao gerar a avaliação, tente novamente mais tarde.';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:9ixgU7Er/ratings/${product_id}/create`, {
                method: 'POST',
                headers: AUTH_HEADERS,
                body: stringify({
                    rating,
                    comment,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                return postErrorResponse(error?.message ?? defaultMessage);
            }
            const data = await response.json();
            return postSuccessResponse(data);
        }
        catch (e) {
            return postErrorResponse(defaultMessage);
        }
    }
    async function addProductToCart(item) {
        const defaultErrorMessage = 'Falha ao adicionar o produto';
        try {
            const response = await fetch(`${CART_BASE_URL}/cart/handle`, {
                method: 'POST',
                headers: HEADERS,
                credentials: 'include',
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
    function replaceChildren(node, ...nodes) {
        if (!node)
            return;
        node.replaceChildren(...nodes.filter(Boolean));
    }
    function removeElementFromDOM(node) {
        if (!node)
            return;
        return node.remove();
    }
    const noOrdersElement = querySelector('[data-wtf-has-no-orders]');
    const orderTemplate = querySelector('[data-wtf-order-template]');
    const ordersContainer = querySelector('[data-wtf-orders-container]');
    const orderItem = querySelector('[data-wtf-product-item]', ordersContainer);
    const evaluatedTemplate = querySelector('[data-wtf-evaluated]');
    const notRatedTemplate = querySelector('[data-wtf-not-rated]');
    const evaluationForm = querySelector('[data-wtf-evaluation-form]');
    for (const element of [evaluatedTemplate, notRatedTemplate, evaluationForm, orderItem]) {
        removeElementFromDOM(element);
    }
    function createFragment() {
        return document.createDocumentFragment();
    }
    async function buyAgain({ sku_id, slug }) {
        if (acquiring.has(slug))
            return;
        acquiring.add(slug);
        const response = await addProductToCart({
            sku_id,
            quantity: 1,
            reference_id: slug,
        });
        if (!response.succeeded) {
            acquiring.delete(slug);
            return;
        }
        addClass(querySelector('#carrinho-flutuante'), CART_SWITCH_CLASS);
        localStorage.setItem(STORAGE_KEY_NAME, stringify(response.data));
        acquiring.delete(slug);
    }
    function renderOrders() {
        const { list, hasOrders, } = orders;
        if (!ordersContainer || !orderTemplate || !orderItem)
            return;
        toggleClass(noOrdersElement, GENERAL_HIDDEN_CLASS, hasOrders);
        toggleClass(ordersContainer, GENERAL_HIDDEN_CLASS, !hasOrders);
        const fragment = createFragment();
        for (const order of list) {
            const template = orderTemplate.cloneNode(true);
            changeTextContent(querySelector('[data-wtf-order-total]', template), order.total);
            changeTextContent(querySelector('[data-wtf-order-status]', template), order.status);
            changeTextContent(querySelector('[data-wtf-created-at]', template), order.created_at);
            changeTextContent(querySelector('[data-wtf-payment-method]', template), order.payment_method);
            changeTextContent(querySelector('[data-wtf-transaction-id]', template), order.transaction_id);
            const orderItemsContainer = querySelector('[data-wtf-product-list]', template);
            for (const { name, slug, product_id, sku_id, quantity, unit_price, image, review, has_stock } of order.order_items) {
                const itemTemplate = orderItem.cloneNode(true);
                const reviewSection = querySelector('[data-wtf-review-area]', itemTemplate);
                setAttribute(querySelector('[data-wtf-product-anchor]', itemTemplate), 'href', `/produtos/${slug}`);
                const addToCartCTA = querySelector('[data-wtf-buy-again-cta]', itemTemplate);
                if (has_stock) {
                    attachEvent(addToCartCTA, 'click', () => buyAgain({ sku_id, slug }));
                }
                else {
                    removeElementFromDOM(addToCartCTA);
                }
                changeTextContent(querySelector('[data-wtf-product-name]', itemTemplate), name);
                changeTextContent(querySelector('[data-wtf-product-price]', itemTemplate), BRLFormatter.format(unit_price / 100));
                changeTextContent(querySelector('[data-wtf-product-subtotal]', itemTemplate), BRLFormatter.format(unit_price * quantity / 100));
                if (review === undefined) {
                    const notRatedClone = (notRatedTemplate?.cloneNode(true) ?? NULL_VALUE);
                    const evaluationFormClone = (evaluationForm?.cloneNode(true) ?? NULL_VALUE);
                    removeClass(notRatedClone, GENERAL_HIDDEN_CLASS);
                    if (order.pago) {
                        attachEvent(querySelector('[data-wtf-not-rated-cta]', notRatedClone), 'click', () => {
                            showEvaluationForm(product_id, notRatedClone, evaluationFormClone);
                        }, { once: true });
                        removeElementFromDOM(querySelector('[data-wtf-not-rated-unpaid]', notRatedClone));
                    }
                    else {
                        removeElementFromDOM(querySelector('[data-wtf-not-rated-paid]', notRatedClone));
                        removeElementFromDOM(querySelector('[data-wtf-not-rated-cta]', notRatedClone));
                    }
                    replaceChildren(reviewSection, notRatedClone, evaluationFormClone);
                }
                else {
                    const templateClone = evaluatedTemplate?.cloneNode(true);
                    changeTextContent(querySelector('[data-wtf-evaluated-comment]', templateClone), review.comment);
                    drawReviewStars(templateClone, review.rating);
                    removeClass(templateClone, GENERAL_HIDDEN_CLASS);
                    replaceChildren(reviewSection, templateClone);
                }
                orderItemsContainer.insertAdjacentElement('afterbegin', itemTemplate);
            }
            fragment.appendChild(template);
        }
        replaceChildren(ordersContainer, fragment);
    }
    function drawReviewStars(reviewNode, rating) {
        if (!reviewNode)
            return;
        const starsSection = querySelector('[data-wtf-evaluated-star-section]', reviewNode);
        if (!starsSection)
            return;
        const children = max(starsSection.childElementCount - max(1, rating), 0);
        for (let index = 0; index++ < children;) {
            removeElementFromDOM(starsSection.lastElementChild);
        }
    }
    function showEvaluationForm(product_id, notRatedView, evaluationFormView) {
        if (!notRatedView || !evaluationFormView)
            return;
        addClass(notRatedView, GENERAL_HIDDEN_CLASS);
        removeClass(evaluationFormView, GENERAL_HIDDEN_CLASS);
        const reviewForm = querySelector('form', evaluationFormView);
        const reviewFormParent = reviewForm?.parentElement;
        if (!reviewForm || !reviewFormParent)
            return;
        const unusedFormAttributes = [
            'id',
            'name',
            'method',
            'data-name',
            'aria-label',
            'data-wf-page-id',
            'data-wf-element-id',
            'data-turnstile-sitekey'
        ];
        for (const attr of unusedFormAttributes) {
            removeAttribute(reviewForm, attr);
        }
        removeElementFromDOM(reviewForm);
        replaceChildren(reviewFormParent);
        reviewFormParent.insertAdjacentHTML('afterbegin', reviewForm.outerHTML);
        const _reviewForm = querySelector('form', evaluationFormView);
        removeAttribute(querySelector('[type="submit"]', _reviewForm), DISABLED_ATTR);
        attachEvent(_reviewForm, 'submit', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!event.isTrusted || !event.submitter)
                return;
            setAttribute(event.submitter, DISABLED_ATTR, DISABLED_ATTR);
            const response = await postReview({
                product_id,
                comment: _reviewForm.comment.value,
                rating: parseInt(_reviewForm.rating.value),
            });
            if (!response.succeeded) {
                // TODO: Necessário tratar o erro
                removeAttribute(event.submitter, DISABLED_ATTR);
                return;
            }
            drawReviewedArea(response.data, _reviewForm);
        });
    }
    function drawReviewedArea(payload, reviewForm) {
        if (!reviewForm)
            return;
        const reviewArea = reviewForm.closest('[data-wtf-review-area]');
        if (!reviewArea)
            return;
        const reviewedTemplate = evaluatedTemplate?.cloneNode(true);
        if (!reviewedTemplate)
            return;
        drawReviewStars(reviewedTemplate, payload.rating);
        changeTextContent(querySelector('[data-wtf-evaluated-comment]', reviewedTemplate), payload.comment);
        removeClass(reviewedTemplate, GENERAL_HIDDEN_CLASS);
        replaceChildren(reviewArea, reviewedTemplate);
    }
    getOrders().then(response => {
        if (!response.succeeded)
            return;
        orders.list = response.data;
    });
})();
export {};
