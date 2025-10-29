
export const EMPTY_STRING = ''
export const XANO_BASE_URL = 'https://xef5-44zo-gegm.b2.xano.io'

export {
  COOKIE_SEPARATOR,
  setCookie,
  getCookie,
  splitCookie,
} from './cookie'

export {
  GET,
  PUT,
  HEAD,
  POST,
  PATCH,
  DELETE,
  AUTH_COOKIE_NAME,
  TALHO_SESSION_COOKIE_NAME,
  TALHO_SESSION_HEADER_NAME,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from './requestResponse'

export {
  timestampDate,
  timestampDays,
  SECONDS_IN_A_DAY,
} from './dates'

export {
  BRLFormatter,
  maskCEP,
  maskDate,
  toUpperCase,
  maskCPFNumber,
  maskPhoneNumber,
} from './mask'

export {
  NULL_VALUE,
  GENERAL_HIDDEN_CLASS,
  SCROLL_INTO_VIEW_DEFAULT_ARGS,
  EMAIL_REGEX_VALIDATION,
  splitText,
  trim,
  regexTest,
  isArray,
  hasClass,
  addClass,
  removeClass,
  toggleClass,
  changeTextContent,
  hasAttribute,
  addAttribute,
  removeAttribute,
  getAttribute,
  attachEvent,
  querySelector,
  isPageLoading,
  scrollIntoView,
  buildURL,
  stringify,
  normalizeText,
  safeParseJson,
  numberOnly,
  objectSize,
  focusInput,
  isNull,
  isAuthenticated,
} from './dom'

export {
  clamp,
  decimalRound,
} from './math'

export {
  statesMap,
  SLASH_STRING,
  statesValues,
  statesAcronym,
  STORAGE_KEY_NAME,
  COOKIE_CONSENT_NAME,
  FREE_SHIPPING_MIN_CART_PRICE,
} from './consts'

export {
  sendBeacon,
  hasBeaconAPI,
} from './beaconAPI'

export {
  pushIf,
  includes,
} from './array'

export {
  eventMap,
  cleanupDirective,
  buildMaskDirective,
} from './vue'

export {
  BLUR_EVENT,
  INPUT_EVENT,
} from './events'

export {
  CPF_VERIFIERS_INDEXES,
  isCPFValid,
  isDateValid,
  textTestRegex,
  validatePasswordParts,
} from './validation'
