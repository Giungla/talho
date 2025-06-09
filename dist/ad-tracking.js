(function () {
    const COOKIE_SEPARATOR = '; ';
    const PARAM_NAMES = document.currentScript?.getAttribute('data-parameter-names');
    // const PARAM_NAMES = 'gclid|gbraid|gad_campaignid|gad_source|utm_source|utm_medium|utm_campaign'
    if (!PARAM_NAMES) {
        throw new Error(`You must provide a the 'data-parameter-names' parameter`);
    }
    const searchParams = PARAM_NAMES
        .replace(/[^a-z|_]+/g, '')
        .split('|');
    const searchParamsSize = searchParams.length;
    if (searchParamsSize === 0)
        return;
    const URLSearch = new URLSearchParams(location.search);
    if (URLSearch.size === 0)
        return;
    const DAY_IN_MILISECONDS = 86400 * 1000;
    const hasTrackingParameterInURL = searchParams.some(param => URLSearch.has(param));
    if (hasTrackingParameterInURL) {
        clearTrackingCookies(searchParams);
        for (const param of searchParams) {
            if (!URLSearch.has(param))
                continue;
            setCookie(param, URLSearch.get(param) ?? '', {
                expires: new Date(Date.now() + DAY_IN_MILISECONDS * 90)
            });
        }
    }
    function setCookie(name, value, options = {}) {
        if (name.length === 0) {
            throw new Error("'setCookie' should receive a valid cookie name");
        }
        const cookieOptions = [`${name}=${value}`];
        if (options.expires) {
            cookieOptions.push(`expires=` + options.expires.toUTCString());
        }
        if (options.sameSite) {
            cookieOptions.push(`SameSite=${options?.sameSite}`);
        }
        if (options.path) {
            cookieOptions.push(`path=${options?.path}`);
        }
        if (options.domain) {
            cookieOptions.push(`domain=${options?.domain}`);
        }
        if (options.httpOnly) {
            cookieOptions.push(`HttpOnly`);
        }
        if (options.secure) {
            cookieOptions.push('Secure');
        }
        const _buildCookie = cookieOptions.join(COOKIE_SEPARATOR);
        document.cookie = _buildCookie;
        return _buildCookie;
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
            value: value
        };
    }
    function clearTrackingCookies(params = searchParams) {
        for (let index = 0; index < searchParamsSize; index++) {
            setCookie(params[index], '', {
                expires: new Date(Date.now() - DAY_IN_MILISECONDS)
            });
        }
    }
    function getAvailableTrackingData() {
        const response = {};
        for (const param of searchParams) {
            const cookie = getCookie(param);
            if (!cookie)
                continue;
            Object.defineProperty(response, param, {
                value: cookie,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }
        return response;
    }
    function Giungla() { }
    Giungla.prototype.setCookie = setCookie;
    Giungla.prototype.getCookie = getCookie;
    Giungla.prototype.clearTrackingCookies = clearTrackingCookies;
    Giungla.prototype.getAvailableTrackingData = getAvailableTrackingData;
    // @ts-ignore
    window.Giungla = new Giungla();
})();
export {};
