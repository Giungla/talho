
type Nullable <T> = null | T;

export interface ILoginUser {
  email: string;
  password: string;
}

export interface ILoginUserPayload {
  /**
   * Token de autenticação gerado pelo backend da aplicação
   */
  authToken: string;
  /**
   * Retorna o timestamp informando quando o token fornecido irá expirar
   */
  expiration: number;
}

export interface IResetPasswordSuccessResponse {
  success: true;
  message: string;
}

export interface ICookieOptions {
  path?: string;
  expires?: Date;
  domain?: string;
  secure?: boolean;
  sameSite?:
    | 'None'
    | 'Lax'
    | 'Strict';
  httpOnly?: boolean;
}

export interface ISplitCookieObject {
  name: string;
  value: string;
}


export interface ISignUpParam {
  name: string;
  lastName: string;
  email: string;
  /**
   * @description Aceito receber novidades via SMS e e-mail
   */
  optin: boolean;
  /**
   * @description Aceito os termos e condições do site
   */
  consent: boolean;
  password: string;
}

export interface SignupResponse {
  message: string;
}

export interface IFailedGroup {
  valid: boolean;
  failedName: string;
}

export interface IFormMapNames {
  name: string;
  field: HTMLInputElement;
  validator: null | (() => IFieldValidationResponse);
  errorMessage: null | HTMLDivElement;
}

export interface IXanoErrorPattern <T = null> {
  code: string;
  message: string;
  payload: T;
}

export interface ISignInErrorResponse {
  error: true;
  data: IXanoErrorPattern;
}

export interface ISignInSuccessResponse<T = null> {
  data: T;
  error: false;
}

export type ISignInResponse<T> =
  | ISignInErrorResponse
  | ISignInSuccessResponse<T>;

export type IFieldValidationResponse = [boolean, string];

export type IScrollIntoViewArgs =
  | boolean
  | ScrollIntoViewOptions;


// user-area

export interface ICurrentUserData {
  id: number;
  cpf?: string;
  name: string;
  last_name?: string;
  email: string;
  birthday: string;
  telephone: string;
}

export interface IQueryPattern<T = null> {
  fetched: boolean;
  pending: boolean;
  data: T;
}

export type IGetUserResponse =
  | {
  error: true;
  data: null;
}
  | {
  error: false;
  data: ICurrentUserData;
};


// user address

export type IStateAcronym =
  | 'AC'
  | 'AL'
  | 'AP'
  | 'AM'
  | 'BA'
  | 'CE'
  | 'DF'
  | 'ES'
  | 'GO'
  | 'MA'
  | 'MS'
  | 'MT'
  | 'MG'
  | 'PA'
  | 'PB'
  | 'PR'
  | 'PE'
  | 'PI'
  | 'RJ'
  | 'RN'
  | 'RS'
  | 'RO'
  | 'RR'
  | 'SC'
  | 'SP'
  | 'SE'
  | 'TO';

export interface IViaCEPPayload {
  uf: IStateAcronym;
  cep: string;
  ddd: string;
  gia: string;
  ibge: string;
  siafi: string;
  regiao: string;
  bairro: string;
  unidade: string;
  estado: string;
  localidade: string;
  logradouro: string;
  complemento: string;
}

export type VIACEPFromXano = Omit<IViaCEPPayload, 'ddd' | 'gia' | 'ibge' | 'regiao' | 'siafi' | 'unidade'>;

export interface IUserCreatedAddress {
  id: string;
  nick: string;
  address: string;
}

export interface IAddress {
  /**
   * ID do endereço cadastrado no banco
   */
  id: string;
  /**
   * O nome da rua informado pelo usuário
   */
  address: string;
  /**
   * O CEP do endereço informado no padrão "00000-000"
   */
  cep: string;
  /**
   * A cidade informada para este endereço
   */
  city: string;
  /**
   * Complemento do endereço do cliente, o campo é opcional no frontend
   */
  complement: string;
  /**
   * O bairro deste endereço
   */
  neighborhood: string;
  /**
   * Um nome ou descrição do endereço informado pelo usuário para que este possa ser identificado rapidamente
   */
  nick: string;
  /**
   * Número da cada/APTO
   */
  number: string;
  /**
   * será sempre composto por 2 caracteres, retornara qualquer uma das 26 siglas dos estados brasileiros eg.: PE, SP, RJ
   */
  state: IStateAcronym;
}

export interface IResponseError {
  data: null;
  error: true;
}

export interface IResponseSuccess<T = null> {
  data: T;
  error: false;
}

export type ISearchAddressResponse =
  | IResponseError
  | IResponseSuccess<IAddress[]>;

export type IDeleteAddressResponse =
  | IResponseError
  | IResponseSuccess<IAddress[]>;

export type IGetAddressDetails =
  | IResponseError
  | IResponseSuccess<IViaCEPPayload>;


// reset passwords

export interface IPasswordPayload {
  password: string;
  confirm_password: string;
}

export type IPasswordResponse =
  | IResponseError
  | IResponseSuccess<object>;


// redirecionamento

export interface IValidateAccountSuccess {
  email: string;
}

export type IValidateAccountToken =
  | IResponseError
  | IResponseSuccess<IValidateAccountSuccess>;


/**
 * SEARCH ADDRESS FUNCTION
 */

export type ISearchAddressFnResponse =
  | {
  error: true;
  data: {
    "traceId": string,
    "code": string,
    "message": string,
    "payload": null
  }
}
  | {
  error: false;
  address: IViaCEPPayload;
};


/**
 * CHECKOUT
 */

export type ISinglePaymentKey =
  | 'pix'
  | 'ticket'
  | 'creditcard';

export interface ISinglePaymentType {
  label: string;
  method: ISinglePaymentKey;
}

export type IAddressType =
  | 'same'
  | 'diff';

export interface IAddressModel {
  label: string;
  token: IAddressType;
}

export type ICorreiosDeliveryCode =
  | '20133'
  | '03298'
  | '03220';

export interface IDeliveryOption {
  value: string;
  option: string;
  deadline: string;
  code: ICorreiosDeliveryCode;
}

export interface IPagSeguroEncryptError {
  code:
    | 'INVALID_NUMBER'
    | 'INVALID_SECURITY_CODE'
    | 'INVALID_EXPIRATION_MONTH'
    | 'INVALID_EXPIRATION_YEAR'
    | 'INVALID_PUBLIC_KEY'
    | 'INVALID_HOLDER';
  message: string;
}

export interface IGetCreditCardTokenResponse {
  hasErrors: boolean;
  errors: IPagSeguroEncryptError[];
  encryptedCard: string | undefined;
}

export interface IAPIRootDetails {
  user_id: number | null;
  coupon_code: null | string;
  items: IParsedProducts[];
  shippingMethod: null | ICorreiosDeliveryCode;
}

export type ICouponType =
  | 'subtotal'
  | 'shipping'
  | 'product_id';

export type IAbandonmentCartKeys =
  | 'name'
  | 'email'
  | 'phone'
  | 'billing_cep'
  | 'shipping_cep';

export interface ICheckoutUserAddress {
  id: string,
  nick: string,
  cep: string,
  address: string,
  number: string,
  complement: string,
  neighborhood: string,
  city: string,
  state: IStateAcronym
}

export interface ICheckoutUser {
  id: number,
  name: string,
  email: string,
  cpf: string | null,
  birthday: string | null,
  telephone: string | null,
  addresses: ICheckoutUserAddress[];
}

export interface IUserAddressesSelection {
  billingaddress: string | null;
  shippingaddress: string | null;
}

export interface IYSCheckoutAppData {
  /**
   * Promoção de carrinho ativa capturada
   */
  basePromo: null | ICartOfferCoupon;

  /**
   * Exibe mensagens de instrução sobre a promoção de carrinho?
   */
  showInstructions: boolean;

  /**
   * Conteúdo da mensagem de instrução
   */
  invalidBasePromoMessage: Nullable<boolean>;

  /**
   * Identificador do carrinho abandonado
   */
  abandonment_id: null | number;

  /**
   * ID do endereço selecionado
   */
  user_address_id: IUserAddressesSelection;

  /**
   * Os dados do usuário, caso esteja logado
   */
  user: (ICheckoutUser & { complete: string, addresses: IParsedAddress[] }) | null;

  /**
   * Quantidade de vezes que o formulário foi submetido
   */
  countSubmissionTries: number;

  /**
   * Verifica se o formulário já foi enviado
   */
  submitted: boolean;

  /**
   * Indica se o SDK já carregou
   */
  isPagSeguroLoaded: boolean;

  /**
   * Possíveis erros gerados durante o uso da aplicação
   */
  validationFeedback: string[];
  /**
   * Método de pagamento selecionado
   */
  selectedPayment?: ISinglePaymentKey;
  /**
   * Métodos de pagamento disponíveis
   */
  availablePayments: ISinglePaymentType[];

  /**
   * E-mail do cliente
   */
  customerEmailModel: string;
  /**
   * Número de telefone do cliente
   */
  customerPhoneModel: string;
  /**
   * Data de nascimento do cliente
   */
  customerBirthdataModel: string;
  /**
   * Número de CPF do cliente
   */
  customerCPFCNPJModel: string;

  /**
   * Nome impresso no cartão
   */
  creditCardName: string;
  /**
   * Númeração do cartão de crédito do cliente
   */
  creditCardNumber: string;
  /**
   * Data de validade do cartão no padrão MM/YY
   */
  creditCardDate: string;
  /**
   * CVV do cartão
   */
  creditCardCode: string;

  /**
   * CEP de entrega
   */
  billingCEP: string;
  /**
   * Logradouro do endereço de cobrança
   */
  billingAddress: string;
  /**
   * Número da residência/apto do cliente
   */
  billingNumber: string;
  /**
   * Complemento do endereço de cobrança do cliente
   */
  billingComplement: string;
  /**
   * Bairro do endereço do cliente
   */
  billingNeighborhood: string;
  /**
   * Cidade do endereço de cobrança do cliente
   */
  billingCity: string;
  /**
   * Sigla do estado de cobrança do cliente
   */
  billingState: IStateAcronym;

  /**
   * Destinatário do endereço de entrega
   */
  shippingSender: string;
  /**
   * CEP do endereço de entrega do cliente
   */
  shippingCEP: string;
  /**
   * Logradouro do endereço de entrega do cliente
   */
  shippingAddress: string;
  /**
   * Número do endereço de entrega do cliente
   */
  shippingNumber: string;
  /**
   * Complemento do endereço de entrega do cliente
   */
  shippingComplement: string;
  /**
   * Bairo do endereço de entrega do cliente
   */
  shippingNeighborhood: string;
  /**
   * Cidade do endereço de entrega do cliente
   */
  shippingCity: string;
  /**
   * Estado do endereço de entrega do cliente
   */
  shippingState: string;

  /**
   * Define se o usuário irá usar um endereço de entrega adicional
   */
  deliveryPlace?: IAddressType;
  /**
   * Lista dos meios possíveis de cadastro de endereço
   */
  deliveryPlaces: IAddressModel[];

  /**
   * Indica se a busca pelos dados de entrega está em execução
   */
  loadingShipping: boolean;

  /**
   * Produto de envio selecionado
   */
  selectedShipping: ICorreiosDeliveryCode;
  /**
   * Lista dos produtos de envio disponíveis
   */
  productsCorreios: Record<ICorreiosDeliveryCode, 'string'>;

  /**
   * Taxa aplicada sobre o valor de frete
   */
  shippingTax: 1,
  /**
   * Detalhes da entrega
   */
  shippingDetails: null,

  /**
   * Código do cupom aplicado
   */
  cupomCode: null | string;

  /**
   * Cupom aplicado
   */
  cupomData: null | ISingleOrderCoupon;
}

export interface ISingleValidateCheckout {
  valid: boolean;
  ignoreIf?: boolean;
  field: Ref<HTMLElement> | HTMLElement;
}

export type IYSPromoType = 'coupon' | 'cart';

export type IVuelidateCheckout = Record<string, ISingleValidateCheckout>;

export interface Ref <T = never> {
  value: T;
}

export interface IParsedProducts {
  quantity: number;
  reference_id: string;
}

export interface IParsedAddress {
  zipPostalCode: string;
  street: string;
  number: string;
  complement: string;
  neighbourhood: string;
  city: string;
  state: string;
}

export interface IParsedAddressContent {
  billingaddress: IParsedAddress;
  shippingaddress: IParsedAddress;
}

export interface IGetParsedProductsContent {
  reference_id: string;
  quantity: string | number;
}

export interface IGetCustomerPayload {
  cpf: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
}







export interface IPriceDeadline {
  price: IPriceDeadlinePrice[];
  deadline: IPriceDeadlineDeadline[];
}

export interface IPriceDeadlinePrice {
  coProduto: ICorreiosDeliveryCode;
  pcBase: string;
  pcBaseGeral: string;
  peVariacao: string;
  pcReferencia: string;
  vlBaseCalculoImposto: string;
  nuRequisicao: string;
  inPesoCubico: string;
  psCobrado: string;
  peAdValorem: string;
  vlSeguroAutomatico: string;
  qtAdicional: string;
  pcFaixa: string;
  pcFaixaVariacao: string;
  pcProduto: string;
  pcFinal: string;
  txFinal: number;
}

export interface IPriceDeadlineDeadline {
  coProduto: ICorreiosDeliveryCode;
  nuRequisicao: string;
  prazoEntrega: string;
  dataMaxima: string;
  entregaDomiciliar: string;
  entregaSabado: string;
  entregaDomingo: string;
}









export interface IOrderPIXResponse {
  payment_method: ISinglePaymentKey,
  created_at: number,
  order_status: number,
  total: number;
  pago: boolean;
  due_time: number;
  is_expired: boolean;
  max_due_seconds: number;
  qrcode: string;
  qrcode_text: string;
}

export interface IConfirmPIXData {
  countdown: number;
  errorMessage: null | string;
  order: null | IOrderPIXResponse;
}










export interface IOrderDetailsProduct <T = number> {
  price: T;
  title: string;
  full_price: number;
  quantity: number;
  reference_id: string;
  image: string;
  sku_id: string;
  category: string;
}

export interface IOrderDetailsAddress {
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ISingleOrderCoupon {
  code: string,
  value: number,
  is_percentage: boolean,
  cupom_type: ICouponType;
  min_purchase: number;
  products_id: number[];
}

export interface IOrderDetailsResponse {
  id: number;
  email: string;
  transaction_id: string;
  shipping_method: ICorreiosDeliveryCode;
  shipping_total: number;
  payment_method: ISinglePaymentKey;
  installment_count: number;
  installment_price: number;
  order_status:
    | '0'
    | '1'
    | '2'
    | '3';
  pago: boolean;
  total: number;
  barcode?: string;
  boletourl?: string;
  qrcode?: string;
  qrcode_text?: string;
  order_items: IOrderDetailsProduct[];
  billing_address: IOrderDetailsAddress;
  shipping_address: IOrderDetailsAddress;
  discount_code?: string;
  discount?: number;
  coupon?: ISingleOrderCoupon;
}

export type IOrderAddressType =
  | 'shipping'
  | 'billing';


export interface IOrderConfirmationData {
  isExpanded: boolean;
  order?: IOrderDetailsResponse;
}











export interface IPaginateSchema <T> {
  items: T[];
  offset: number;
  curPage: number;
  perPage: number;
  itemsReceived: number;
  nextPage: Nullable<number>;
  prevPage: Nullable<number>;
}

















export interface INewsletterParams {
  email: string;
  accepted_terms: boolean;
}

export interface INewsletterSuccessfulResponse {
  message: string;
}

export interface FunctionSucceededPattern <T = null> {
  data: T;
  succeeded: true;
}

export interface FunctionErrorPattern {
  succeeded: false;
  message: string;
}

export type ResponsePattern <T> = FunctionSucceededPattern<T> | FunctionErrorPattern;

export interface ValidatorScheme {
  field: HTMLInputElement | null;
  validator: () => any;
}







export interface IUserOrder {
  status: string;
  total: string;
  created_at: string;
  relative_url: string;
  transaction_id: string;
  shipping_url?: string;
  order_items: ISingleOrderItem[];
}

export interface ISingleOrderItem {
  title: string;
  image: string;
  reference_id: string;
  inPaidOrder: boolean;
}

/** Avaliações */

export interface IEvaluableProduct {
  id: number;
  image: string;
  title: string;
  product_id: string;
}

export interface IEvaluatedProduct {
  id: number;
  product_id: string;
}

export interface IUserAreaTrackOrders {
  orders: IUserOrder[];
  evaluated: IEvaluatedProduct[];
}

export interface IReviewRate {
  rating: number;
  comment: string;
}

export interface IProductReview {
  title: string;
  image: string;
  review?: IReviewRate;
}

export type IGetProductReviewResponse<T, K = {}> =
  | {
  message: string;
  succeeded: false;
} & K
  | {
  data: T;
  succeeded: true;
}

export type ICreatedReview = IReviewRate & {
  product_id: number;
}






export type IPaginatedListReviewSchema = IReviewRate & {
  name: string;
  created_at: string;
}

export interface IProductReviewList {
  count: number;
  average: string;
  hasNextPage: Nullable<boolean>;
  hasPrevPage: Nullable<boolean>;
  reviews: IPaginateSchema<IPaginatedListReviewSchema>;
}

export type IProductReviewListKeys = keyof IProductReviewList;


/**
 * Floating cart
 */

type ICouponBase = {
  value: number;
  order_price: number;
  is_percentage: boolean;
  message?: string;
};

export type ICartOfferCoupon =
  | (ICouponBase & { cupom_type: 'subtotal' | 'shipping' })
  | (ICouponBase & {
  cupom_type: 'freebie';
  freebie_image: string;
});

export interface IFloatingResponse {
  basePromo?: ICartOfferCoupon;
  isCartOpened: boolean;
  showInstructions: boolean;
  subtotalPrice?: number;
  shippingPrice?: number;
  isFreebieOffer: false;
}

export type ICartOfferPayload = Nullable<{
  showable?: boolean;
  order_price: number;
}>;

/*
 * Personal User Data
 */

type ICurrentUserDataOptional = Omit<ICurrentUserData, 'id'>

export interface UserStateProxy extends ICurrentUserDataOptional {
  isFormVisible: boolean;
}

export interface IGoogleAuthURLResponse {
  authUrl: string;
}


export interface GoogleContinueOAuthResponse {
  token: string;
  maxAge: number;
}

export interface SignupStateStatus {
  valid: boolean;
  failedName: string;
}