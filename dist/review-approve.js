(function () {
    const NULL_VALUE = null;
    const COOKIE_SEPARATOR = '; ';
    const DISABLED_ATTR = 'disabled';
    const GENERAL_HIDDEN_CLASS = 'oculto';
    const COOKIE_NAME = '__Host-Talho-AuthToken';
    const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io';
    const searchParams = new URLSearchParams(location.search);
    const action = searchParams.get('action');
    const reviewId = searchParams.get('review_id');
    if (!action || !reviewId)
        return;
    const errorMessageElement = querySelector('[data-wtf-error-review]');
    const successMessageElement = querySelector('[data-wtf-approve-review]');
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
    function stringify(value) {
        return JSON.stringify(value);
    }
    function splitText(value, separator, limit) {
        return value.split(separator, limit);
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
    async function changeReviewStatus({ review_id, action }) {
        const defaultMessage = 'Não foi possível alterar a situação da avaliação';
        try {
            const response = await fetch(`${XANO_BASE_URL}/api:9ixgU7Er/ratings/${review_id}/${action}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': getCookie(COOKIE_NAME) || '',
                },
                body: stringify({})
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
    changeReviewStatus({
        action: action,
        review_id: parseInt(reviewId)
    }).then(response => {
        if (!response.succeeded) {
            removeElementFromDOM(successMessageElement);
            return changeTextContent(querySelector('div', errorMessageElement), response.message);
        }
        removeElementFromDOM(errorMessageElement);
        changeTextContent(querySelector('div', successMessageElement), response.data.message);
    });
})();
export {};
