
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
  DEFAULT_SESSION_COOKIE_OPTIONS,
  BUILD_URL_DEFAULT_OPTION,
  unAuthenticatedRedirect,
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
  CEP_REGEX_VALIDATION,
  CPF_REGEX_VALIDATION,
  FULLNAME_REGEX_VALIDATION,
  PHONE_REGEX_VALIDATION,
  DATE_REGEX_VALIDATION,
  replaceDuplicatedSpaces,
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
  toggleAttribute,
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
  PIPE_STRING,
  EMPTY_STRING,
  SLASH_STRING,
  statesValues,
  statesAcronym,
  XANO_BASE_URL,
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
  isEquals,
  isStrictEquals,
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

export {
  TALHO_ABANDONMENT_COOKIE_NAME,
  TALHO_ABANDONMENT_HEADER_NAME,
  refreshAbandonmentEntry,
  abandonmentHeader,
} from './abandonment'

export {
  PARAM_NAMES,
  prefixStorageKey,
  getTrackingCookies,
  clearTrackingCookies,
  getMetaTrackingCookies,
} from './adTracking'

export {
  bindURL,
  getParam,
  setParam,
  decodeState,
  encodeState,
} from './url-stateful'
