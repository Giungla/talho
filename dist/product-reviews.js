(function () {
    const NULL_VALUE = null;
    const COOKIE_SEPARATOR = '; ';
    const DISABLED_ATTR = 'disabled';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    function objectSize(value) {
        return value.length;
    }
    function toggleClass(element, className, force) {
        if (!element)
            return false;
        return element.classList.toggle(className, force);
    }
    function removeElementFromDOM(node) {
        if (!node)
            return;
        return node.remove();
    }
    function changeTextContent(element, textContent) {
        if (!element)
            return;
        element.textContent = typeof textContent === 'string'
            ? textContent
            : textContent.toString();
    }
    function querySelector(selector, node = document) {
        if (!node)
            return NULL_VALUE;
        return node.querySelector(selector);
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
    async function readReviews(reference_id) {
        const defaultMessage = 'Não foi possível localizar as avaliaçôes para o produto';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:9ixgU7Er/ratings/${reference_id}/list`, {
                headers: {
                    'Content-Type': 'application/json'
                }
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
    function drawReviews() {
        const reviewsFragment = document.createDocumentFragment();
        toggleClass(querySelector('[data-wtf-top-product-rating]'), GENERAL_HIDDEN_CLASS, !state.hasReviews);
        toggleClass(querySelector('[data-wtf-review-section]'), GENERAL_HIDDEN_CLASS, !state.hasReviews);
        toggleClass(querySelector('[data-wtf-review-line]'), GENERAL_HIDDEN_CLASS, !state.hasReviews);
        for (const { name, comment, rating, created_at } of state.response?.reviews.items ?? []) {
            const reviewTemplateClone = reviewTemplate?.cloneNode(true);
            changeTextContent(querySelector('[data-wtf-review-average]', reviewTemplateClone), rating.toString());
            changeTextContent(querySelector('[data-wtf-review-customer-name]', reviewTemplateClone), name);
            changeTextContent(querySelector('[data-wtf-review-created-at]', reviewTemplateClone), created_at);
            changeTextContent(querySelector('[data-wtf-review-comment]', reviewTemplateClone), comment);
            reviewsFragment.appendChild(reviewTemplateClone);
        }
        changeTextContent(querySelector('[data-wtf-review-count]'), state.response?.count ?? 0);
        changeTextContent(querySelector('[data-wtf-review-media]'), state.response?.average ?? 0);
        changeTextContent(querySelector('[data-wtf-review-title]'), state.reviewsCount > 1 ? 'Avaliaçôes' : 'Avaliação');
        changeTextContent(querySelector('h1', querySelector('[data-wtf-top-product-rating]')), state.response?.average ?? 0);
        reviewContainer?.replaceChildren(reviewsFragment);
    }
    const state = new Proxy({
        response: NULL_VALUE,
    }, {
        get(target, key) {
            const reviewsCount = target.response?.count ?? 0;
            switch (key) {
                case 'reviewsCount':
                    return reviewsCount;
                case 'hasReviews':
                    return reviewsCount > 0;
                default:
                    return target[key];
            }
        },
        set(target, key, value) {
            const applied = Reflect.set(target, key, value);
            if (!applied)
                return applied;
            switch (key) {
                case 'response':
                    drawReviews();
                    break;
            }
            return true;
        }
    });
    const reviewContainer = querySelector('[data-wtf-review-list]');
    if (!reviewContainer)
        return;
    const reviewTemplate = querySelector('[data-wtf-review-template]', reviewContainer);
    if (!reviewTemplate)
        return;
    removeElementFromDOM(reviewTemplate);
    const path = location.pathname
        .split('/')
        .filter(Boolean)
        .at(-1);
    if (!path) {
        // TODO: Hide review section
        return;
    }
    readReviews(path)
        .then(response => {
        if (!response.succeeded)
            return;
        state.response = response.data;
    });
})();
export {};
