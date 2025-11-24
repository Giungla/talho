
import Vue, {
  type Ref,
  type WatchOptions,
  type WatchCallback,
} from 'vue'

export type { OnCleanup } from '@vue/reactivity'

import {
  type PIXOrderResponse,
  type CreditCardOrderResponse,
  type CheckoutDeliveryRequestBody,
  type CheckoutDeliveryPriceResponse,
  type CheckoutDeliveryOption,
  type ComputedDeliveryDates,
  type CheckoutDeliveryResponse,
  type CheckoutDeliveryHour,
} from './types/checkout'

import {
  type CartAbandonmentParams,
} from './types/abandonment'

export type TypeofResult =
  | "string"
  | "number"
  | "boolean"
  | "undefined"
  | "object"
  | "function"
  | "symbol"
  | "bigint";

export type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  undefined: undefined;
  function: Function;
  object: object;
  symbol: symbol;
  bigint: bigint;
};

export type ComputedReturnValues <T> = {
  [K in keyof T]: T[K] extends () => infer R ? R : never;
};

export type Nullable <T> = null | T;

export type Binary = '0' | '1';

export interface ILoginUser {
  email: string;
  password: string;
}

export type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

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
  maxAge?: number;
}

export interface ISplitCookieObject <T extends string | boolean = string> {
  name: string;
  value: T;
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
  cpf: string | null;
  name: string;
  last_name?: string;
  email: string;
  birthday: string;
  telephone: string;
  points: number;
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

export interface SubsidyResponse {
  has: boolean;
  value: number;
}

export interface UserAddressCheckout {
  id: number;
  nick: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: IStateAcronym;
}

export interface UserPartialCheckout {
  name: string;
  last_name: string;
  cpf: string;
  telephone: string;
  email: string;
  birthday: string;
  address_list: UserAddressCheckout[];
}

export interface TalhoCheckoutAppData {
  /**
   * Armazena os dados do usuário, caso esteja logado no site
   */
  user: Nullable<UserPartialCheckout>,
  /**
   * Registra a mensagem do erro que aconteceu ao fechar o pedido
   */
  errorMessage: Nullable<string>;
  /**
   * Indica se existe alguma execução de pagamento em andamento
   */
  hasPendingPayment: boolean;
  /**
   * Indica se o form já foi submetido
   */
  isSubmitted: boolean;
  /**
   * Lista de produtos
   */
  productlist: Nullable<CartResponse>;
  /**
   * Lista de campos que já foram visitados/acessados
   */
  visitedFields: string[];
  /**
   * Método de pagamento selecionado
   */
  selectedPayment: Nullable<ISinglePaymentKey>;
  /**
   * Métodos de pagamento disponíveis
   */
  availablePayments: ISinglePaymentType[];
  /**
   * Define se o usuário irá usar um endereço de entrega adicional
   */
  deliveryPlace: Nullable<IAddressType>;
  /**
   * Lista dos meios possíveis de cadastro de endereço
   */
  deliveryPlaces: IAddressModel[];
  /**
   * Dados de parcelamento
   */
  installment: Nullable<InstallmentItem[]>;
  /**
   * Quantidade de parcelas selecionada
   */
  selectedInstallment: Nullable<number>;
  /**
   * Verifica se existe uma busca de cupom ainda pendente
   */
  isCouponPending: boolean;
  /**
   * Dados do cupom capturado da API
   */
  coupon: Nullable<CouponDefinition>;
  /**
   * Verifica se a lib do PagSeguro já carregou
   */
  isPagSeguroLoaded: boolean;
  /**
   * Armazena o valor de `shiftDays` que indica quantos dias se deslocar partindo da data atual
   */
  deliveryDate: Nullable<number>;
  /**
   * Armazena o valor inteiro que representa o horário fechado
   */
  deliveryHour: Nullable<number>;
  /**
   * Indica se o preço do frete ainda está sendo capturado
   */
  isDeliveryLoading: boolean;
  /**
   * Valor cobrado pela entrega dos produtos
   */
  deliveryPrice: Nullable<Omit<PostOrderDeliveryGroup, 'has_priority'>>;
  /**
   * Datas e horários disponíveis para entrega
   */
  deliveryOptions: Nullable<CheckoutDeliveryResponse>;
  /**
   * Indica qual é o percentual do subtotal cobrado adicionamente para ter prioridade na entrega do pedido
   */
  priorityTax: Nullable<number>;

  /**
   * Indica se o frete indicado para realização da entrega possui subsídio e qual o valor
   */
  subsidy: Nullable<SubsidyResponse>;

  /**
   * ID do endereço de cobrança selecionado
   */
  selectedBillingAddressId: Nullable<number>;
  /**
   * ID do endereço de envio do pedido
   */
  selectedShippingAddressId: Nullable<number>;
}

export interface TalhoCheckoutAppSetup {
  /**
   * Endereço de e-mail do cliente
   */
  customerMail: string;
  /**
   * Data de nascimento do cliente
   */
  customerBirthdate: string;
  /**
   * CPF do cliente
   */
  customerCPF: string;
  /**
   * Telefone do cliente
   */
  customerPhone: string;

  /**
   * Código de segurança do cartão
   */
  customerCreditCardCVV: string;
  /**
   * Data de validade do cartão
   */
  customerCreditCardDate: string;
  /**
   * Numeração do cartão de crédito do cliente
   */
  customerCreditCardNumber: string;
  /**
   * Nome impresso no cartão do cliente
   */
  customerCreditCardHolder: string;

  /**
   * CEP de cobrança do cliente
   */
  billingCEP: string;
  /**
   * Endereço de cobrança do cliente
   */
  billingAddress: string;
  /**
   * Número do endereço de cobrança
   */
  billingNumber: string;
  /**
   * Complemento do endereço de cobrança
   */
  billingComplement: string;
  /**
   * Bairro do endereço de cobrança
   */
  billingNeighborhood: string;
  /**
   * Cidade do endereço de cobrança
   */
  billingCity: string;
  /**
   * Estado do endereço de cobrança
   */
  billingState: IStateAcronym;

  /**
   * Quem será o destinatário deste envio
   */
  shippingRecipient: string;
  /**
   * CEP de entrega do cliente
   */
  shippingCEP: string;
  /**
   * Endereço de cobrança do cliente
   */
  shippingAddress: string;
  /**
   * Número do endereço de entrega
   */
  shippingNumber: string;
  /**
   * Complemento do endereço de entrega
   */
  shippingComplement: string;
  /**
   * Bairro do endereço de entrega
   */
  shippingNeighborhood: string;
  /**
   * Cidade do endereço de entrega
   */
  shippingCity: string;
  /**
   * Estado do endereço de entrega
   */
  shippingState: IStateAcronym;

  /**
   * Código de desconto informado pelo cliente
   */
  couponCode: string;

  customerCPFElement: Ref<HTMLInputElement | null>;
  customerMailElement: Ref<HTMLInputElement | null>;
  customerPhoneElement: Ref<HTMLInputElement | null>;
  customerBirthdateElement: Ref<HTMLInputElement | null>;

  paymentMethodMessageElement: Ref<HTMLInputElement | null>;

  customerCreditCardCVVElement: Ref<HTMLInputElement | null>;
  customerCreditCardDateElement: Ref<HTMLInputElement | null>;
  customerCreditCardNumberElement: Ref<HTMLInputElement | null>;
  customerCreditCardHolderElement: Ref<HTMLInputElement | null>;

  billingCEPElement: Ref<HTMLInputElement | null>;
  billingAddressElement: Ref<HTMLInputElement | null>;
  billingNumberElement: Ref<HTMLInputElement | null>;
  billingNeighborhoodElement: Ref<HTMLInputElement | null>;
  billingCityElement: Ref<HTMLInputElement | null>;
  billingStateElement: Ref<HTMLInputElement | null>;

  deliveryPlaceMessageElement: Ref<HTMLElement | null>;

  shippingRecipientElement: Ref<HTMLInputElement | null>;
  shippingCEPElement: Ref<HTMLInputElement | null>;
  shippingAddressElement: Ref<HTMLInputElement | null>;
  shippingNumberElement: Ref<HTMLInputElement | null>;
  shippingNeighborhoodElement: Ref<HTMLInputElement | null>;
  shippingCityElement: Ref<HTMLInputElement | null>;
  shippingStateElement: Ref<HTMLInputElement | null>;

  /**
   * Referência ao elemento "mensagem de erro" da seção de seleção de datas de entrega
   */
  deliveryDateMessageElement: Ref<Nullable<HTMLElement>>;
  /**
   * Referência ao elemento "mensagem de erro" da seção de seleção de intervalo de entrega
   */
  deliveryHourMessageElement: Ref<Nullable<HTMLElement>>;

  /**
   * Referência ao elemento "mensagem de erro" da seção "Defina a Quantidade de Parcelas do Pagamento"
   */
  installmentsMessageElement: Ref<Nullable<HTMLElement>>;

  couponCodeElement: Ref<HTMLInputElement | null>;

  deliveryPlaceAddressErrorMessage: Nullable<string>;

  deliveryBillingAddressErrorMessage: Nullable<string>;

  deliveryShippingAddressErrorMessage: Nullable<string>;
}

export type PaymentResponseMap = {
  pix: ResponsePattern<PIXOrderResponse>;
  creditcard: ResponsePattern<CreditCardOrderResponse>;
}

export interface TalhoCheckoutAppMethods {
  /**
   * Permite a seleção de um endereço prviamente criado
   */
  setPreviousAddress: (addressId: number, addressType: IOrderAddressType) => void;
  /**
   * Captura os dados do usuário logado, caso exista
   */
  getLoggedInUser: () => Promise<ResponsePattern<UserPartialCheckout>>;
  getCart: () => Promise<ResponsePattern<CartResponse>>;
  refreshCart: () => Promise<void>;
  getInstallments: () => Promise<ResponsePattern<InstallmentItem[]>>;
  refreshInstallments: () => Promise<void>;
  setSelectedInstallmentsCount: (installmentsCount: number) => void;
  setSelectedPaymentMethod: (method: ISinglePaymentKey) => void;
  setVisitedField: (fieldName: string) => number;
  hasVisitRegistry: (fieldName: string) => boolean;
  handlePayment: (e: MouseEvent) => Promise<void>;
  handlePostPayment (paymentType: 'pix'): Promise<PaymentResponseMap['pix']>;
  handlePostPayment (paymentType: 'creditcard'): Promise<PaymentResponseMap['creditcard']>;
  //handleProcessPIX: () => Promise<ResponsePattern<PIXOrderResponse>>;
  //handleProcessCreditCard: () => Promise<ResponsePattern<CreditCardOrderResponse>>;
  triggerValidations: () => void;
  feedAddress: (addressType: IOrderAddressType, address: VIACEPFromXano) => void;
  setDeliveryPlace: (deliveryPlace: IAddressType) => void;
  captureAddress: (addressType: IOrderAddressType, cep: string, oldCep?: string) => Promise<boolean>;
  captureCoupon: () => Promise<ResponsePattern<ISingleOrderCoupon>>;
  handleSearchCoupon: () => Promise<void>;
  handleRemoveCoupon: () => void;
  /**
   * Carrega a lib do PagSeguro para gerar a encriptação dos dados do cartão
   */
  loadPagSeguro: () => void;
  /**
   * Reseta os dados da seção "Cartão de crédito"
   */
  clearCreditCardData: () => void;
  /**
   * Captura e altera o estado com as datas e horários disponíveis para entrega
   */
  handleDeliveryOptions: () => Promise<void>;
  /**
   * Captura as datas e períodos de entrega disponíveis
   */
  captureDeliveryOptions: () => Promise<ResponsePattern<CheckoutDeliveryResponse>>;
  /**
   * Configura uma data de envio
   */
  setDeliveryDate: (shiftDays: number) => void;
  /**
   * Configura um horário de entrega
   */
  setDeliveryHour: (hour: number) => void;
  /**
   * Captura os dados de cotação de entrega do pedido
   */
  handleDeliveryQuotation: (controller: AbortController) => Promise<void>;
  /**
   * Captura uma e retorna uma cotação para entrega na Lalamove
   */
  captureDeliveryQuotation: (controller: AbortController) => Promise<ResponsePattern<CheckoutDeliveryPriceResponse>>;
  /**
   * Captura e salva no estado os dados de subsídio
   */
  handleSubsidy: () => Promise<void>;
  /**
   * Verifica se o CEP que será usado para entrega do pedido possui subsídio
   */
  verifyForSubsidy: (cep: string) => Promise<ResponsePattern<SubsidyResponse>>;
  /**
   * Gera um novo carrinho abandonado
   */
  createAbandonmentCart: (payload: CartAbandonmentParams) => Promise<ResponsePattern<void>>;
}

export interface TalhoCheckoutAppComputedDefinition {
  /**
   * Verifica se existe um meio de pagamento selecionado
   */
  hasSelectedPaymentMethod: () => boolean;
  /**
   * `true` se o metodo de pagamento selecionado for `creditcard`
   */
  isCreditCard: () => boolean;
  /**
   * Captura o subtotal do pedido
   */
  getOrderSubtotal: () => number;
  /**
   * Retorna o valor de `getOrderSubtotal` formatado em BRL
   */
  getOrderSubtotalFormatted: () => string;
  /**
   * Captura o valor total que será cobrado no pedido
   */
  getOrderPrice: () => number;
  /**
   * Retorna o valor de `getOrderPrice` formatado em BRL
   */
  getOrderPriceFormatted: () => string;
  /**
   * Captura o valor que será cobrado sobre o envio, retornará zero sempre que o valor do subtotal for igual ou maior a 400
   */
  getShippingPrice: () => number;
  /**
   * Retorna o valor de `getShippingPrice` formatado em BRL ou a mensagem 'Frete grátis' se o valor do carrinho for maior ou igual a 400 BRL
   */
  getShippingPriceFormatted: () => string;
  /**
   * Retorna o desconto fornecido pelo cupom aplicado (retorna 0 ou valor negativo)
   */
  getCouponDiscountPrice: () => number;
  /**
   * Retorna o valor de `getShippingPriceFormatted` formatado em BRL
   */
  getCouponDiscountPriceFormatted: () => string;
  /**
   * Retorna o preço onde deverá ser aplicado o cupom de desconto
   * Se o cupom for do tipo `subtotal` retorna o valor de `getOrderSubtotal`
   * Se o cupom for do tipo `shipping` retorna o valor de `getShippingPrice`
   * Se o cupom for do tipo `product_id` será retornado o valor do produto em questão
   */
  getParsedPriceForApplyDiscount: () => number;
  /**
   * Dados do produto
   */
  getParsedProducts: () => ParsedProductList[];

  /**
   * Verifica se os dados básicos do usuário são válidos
   */
  isPersonalDataValid: () => boolean;
  /**
   * Verifica se o e-mail informado é válido
   */
  customerMailValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se a data de nascimento recebida é válida
   */
  customerBirthdateValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se o CPF fornecido é válido
   */
  customerCPFValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se o cliente forneceu um telefone válido
   */
  customerPhoneValidation: () => ISingleValidateCheckout;

  /**
   * Verifica se o usuário selecionou um meio de pagamento
   */
  paymentMethodValidation: () => ISingleValidateCheckout;

  /**
   * Verifica se o nome impresso no cartão é válido
   */
  customerCreditCardHolderValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se o número do cartão é válido
   */
  customerCreditCardNumberValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se a validade do cartão é válida
   */
  customerCreditCardDateValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se o valor do CVV é válido
   */
  customerCreditCardCVVValidation: () => ISingleValidateCheckout;
  /**
   * Indica se os campos de cartão de crédito são válidos
   */
  isCreditCardGroupValid: () => boolean;

  /**
   * Validação sobre o campo de sempre do endereço de entrega
   */
  billingCEPValidation: () => ISingleValidateCheckout;
  /**
   * Validação sobre o endereço de cobrança
   */
  billingAddressValidation: () => ISingleValidateCheckout;
  /**
   * Validação sobre o número do endereço de cobrança
   */
  billingNumberValidation: () => ISingleValidateCheckout;
  /**
   * Validação sobre o bairro do endereço de cobrança
   */
  billingNeighborhoodValidation: () => ISingleValidateCheckout;
  /**
   * Validação sobre a cidade do endereço de entrega
   */
  billingCityValidation: () => ISingleValidateCheckout;
  /**
   * Validação sobre o estado informado pelo usuário
   */
  billingStateValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se o grupo 'endereço de cobrança' é válido
   */
  isBillingAddressGroupValid: () => boolean;

  /**
   * Valida o local de entrega
   */
  deliveryPlaceValidation: () => ISingleValidateCheckout;

  /**
   * Valida o destinatário do envio
   */
  shippingRecipientValidation: () => ISingleValidateCheckout;
  /**
   * Valida o CEP do endereço de envio
   */
  shippingCEPValidation: () => ISingleValidateCheckout;
  /**
   * Valida o endereço de envio
   */
  shippingAddressValidation: () => ISingleValidateCheckout;
  /**
   * Valida o número do endereço de entrega
   */
  shippingNumberValidation: () => ISingleValidateCheckout;
  shippingNeighborhoodValidation: () => ISingleValidateCheckout;
  shippingCityValidation: () => ISingleValidateCheckout;
  shippingStateValidation: () => ISingleValidateCheckout;
  /**
   * Verifica se o grupo 'endereço de cobrança' é válido
   */
  isShippingAddressGroupValid: () => boolean;

  /**
   * Indica se o grupo "Datas de entrega" é válido
   */
  deliveryDatesGroupValidation: () => ISingleValidateCheckout;
  /**
   * Indica se o grupo "Horários de entrega" é válido
   */
  deliveryHoursGroupValidation: () => ISingleValidateCheckout;

  /**
   * Verifica se o grupo "Defina a Quantidade de Parcelas do Pagamento" é válido
   */
  installmentGroupValidation: () => ISingleValidateCheckout;

  notIgnoredFields: () => ISingleValidateCheckout[];

  firstInvalidField: () => Nullable<ISingleValidateCheckout>;

  /**
   * Verifica se um endereço já foi selecionado
   */
  hasSelectedAddress: () => boolean;
  /**
   * Verifica se o valor de `deliveryPlace` é `same`
   */
  isSameAddress: () => boolean;
  /**
   * Verifica se o valor de `deliveryPlace` é `diff`
   */
  isDiffAddress: () => boolean;

  /**
   * Indica se a validação do endereço de envio deve ser feita
   */
  shouldValidateShippingAddress: () => boolean;
  showShippingAddressSelector: () => boolean;

  /**
   * Retorna os endereços formatados para o envio ao backend
   */
  getParsedAddresses: () => IParsedAddressContent;

  /**
   * Retorna os dados do usuário formatados para envio ao backend
   */
  getParsedCustomer: () => PostOrderCustomer;

  /**
   * Retorna os valores de data e horário de entrega, junto com seus respectivos validators
   */
  getParsedDeliveryData: () => Omit<PostOrderDelivery, 'delivery_price'>;

  /**
   * Retorna os dados base formatados para envio ao backend
   */
  getOrderBaseData: () => Omit<PostOrder, 'customer' | ''>;

  /**
   * Informa se a seção de parcelamento deve ser exibida
   */
  showInstallmentSection: () => boolean;
  /**
   * Captura e realiza o parse das informações de parcelamento
   */
  getParsedInstallments: () => InstallmentItem<BRLString>[];

  /**
   * Retornará `true` enquanto o campo `coupon` contiver o valor `null`.
   */
  hasNullCoupon: () => boolean;
  /**
   * Verifica se existe cupom aplicado
   */
  hasAppliedCoupon: () => boolean;
  /**
   * Verifica se um código inválido for fornecido
   */
  hasInvalidCoupon: () => boolean;
  /**
   * Verifica se o cupom que está sendo digitado é válido
   */
  isCouponCodeValid: () => boolean;
  /**
   * Retorna o token gerado com dados do cartão e possíveis erros
   */
  getCreditCardToken: () => PagSeguroCardEncrypt;
  /**
   * Verifica se existem datas de entrega
   */
  hasDeliveryDates: () => boolean;
  /**
   * Retorna as datas de envio parseadas
   */
  getParsedDeliveryDates: () => ComputedDeliveryDates[];
  /**
   * Retorna o objeto que representa o dia selecionado para entrega
   */
  getSelectedDateDetails: () => Nullable<CheckoutDeliveryOption>;
  /**
   * Retorna o objeto que representa o horário selecionado para entrega
   */
  getSelectedHourDetails: () => Nullable<CheckoutDeliveryHour>;
  /**
   * Indica se a data selecionada possui adicional por prioridade
   */
  hasPriorityFee: () => boolean;
  /**
   * Indica qual valor será cobrado adicionalmente pela entrega prioritária do pedido
   */
  priorityFee: () => number;
  /**
   * Retorna o valor de `priorityFee` formatado em BRL
   */
  priorityFeeFormatted: () => string;
  /**
   * Verifica se existem horários de entrega
   */
  hasDeliveryHour: () => boolean;
  /**
   * Retorna os horários de envio disponíveis para a data selecionada
   */
  getParsedDeliveryHours: () => ComputedDeliveryHours[];
  /**
   * Indica se os dados usados na geração da quotation são válidos
   */
  quotationPayload: () => false | (Omit<PostOrderDelivery, 'delivery_price'> & Pick<CheckoutDeliveryRequestBody, 'cep'>);

  /**
   * Indica se o CEP usado no envio possui subsídio
   */
  hasSubsidy: () => boolean;
  /**
   * Retorna o valor de desconto de subsídio (valor negativo ou zero)
   */
  subsidyDiscountPrice: () => number;
  /**
   * Retorna o valor de desconto de subsídio retornado em `subsidyDiscountPrice`
   */
  subsidyDiscountPriceFormatted: () => string;
  /**
   * Verifica se o cliente terá frete grátis baseado no valor do seu carrinho
   */
  hasFreeShippingByCartPrice: () => boolean;

  creditCardAdditionalInfo: () => CreditCardPostAdditional;

  /**
   * Indica se o desconto por pagamento PIX é aplicável
   */
  hasPIXDiscount: () => boolean;
  /**
   * Indica o valor de desconto aplicado para pagamentos via PIX (quando disponível)
   */
  PIXDiscountPrice: () => number;
  /**
   * Retorna o valor de `PIXDiscountPrice` formatado em BRL
   */
  PIXDiscountPriceFormatted: () => string;
  /**
   * Retorna a lista de endereços salvos por este usuário
   */
  userAddresses: () => UserAddressCheckout[];
}

export type TalhoCheckoutAppComputed = ComputedReturnValues<TalhoCheckoutAppComputedDefinition>;

export interface TalhoCheckoutAppWatch {
  billingCEP: WatchCallback<TalhoCheckoutContext['billingCEP'], TalhoCheckoutContext['billingCEP']>;
  shippingCEP: WatchCallback<TalhoCheckoutContext['shippingCEP'], TalhoCheckoutContext['shippingCEP']>;
  getOrderPrice: WatchOptions;
  getCreditCardToken: WatchCallback<TalhoCheckoutContext['getCreditCardToken'], TalhoCheckoutContext['getCreditCardToken']>;
  quotationPayload: WatchCallback<false | CheckoutDeliveryRequestBody, false | CheckoutDeliveryRequestBody>;
  getParsedAddresses: WatchCallback<IParsedAddressContent, IParsedAddressContent>;
  user: WatchCallback<Nullable<UserPartialCheckout>, Nullable<UserPartialCheckout>>;
}

export type TalhoCheckoutContext = TalhoCheckoutAppData & TalhoCheckoutAppSetup & TalhoCheckoutAppMethods & TalhoCheckoutAppComputed;

export type BRLString = `R$ ${string}`;

export interface InstallmentItem <T = number> {
  installments: number;
  installment_value: T;
}

export interface ParsedProductList {
  name: string;
  image: string;
  price: string;
  quantity: number;
  finalPrice: string;
  imageStyle: string;
}

export interface ISingleValidateCheckout <T = Ref<HTMLElement> | HTMLElement> {
  /**
   * Referência ao campo
   */
  field: T;
  /**
   * Indica se o `value` contido no campo é válido
   */
  valid: boolean;
  /**
   * Indica se o campo será ignorado para validação
   */
  ignoreIf?: boolean;
}

export interface PagSeguroEncryptCardDetails {
  publicKey: string;
  holder: string;
  number: string;
  expMonth: string;
  expYear: string;
  securityCode: string;
}

export interface PagSeguro {
  encryptCard: (card: PagSeguroEncryptCardDetails) => PagSeguroCardEncrypt;
}

export type PagSeguroEncryptErrors =
  | 'INVALID_EXPIRATION_MONTH'
  | 'INVALID_EXPIRATION_YEAR'
  | 'INVALID_SECURITY_CODE'
  | 'INVALID_PUBLIC_KEY'
  | 'INVALID_HOLDER'
  | 'INVALID_NUMBER';

export interface PagSeguroEncryptError {
  message: string;
  code: PagSeguroEncryptErrors;
}

export interface PagSeguroCardEncrypt {
  hasErrors: boolean;
  errors: PagSeguroEncryptError[];
  encryptedCard: Nullable<string>;
}

declare global {
  interface Window {
    Vue: Vue;
    PagSeguro: PagSeguro;
  }
}

export type ISODateString = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export type DeliveryPeriod = 'P1' | 'P2' | 'P1|P2';

export interface DeliveryDate <T = ISODateString> {
  /**
   * Dias de diferença entre a data simulada e a data de entrega.
   */
  shiftDays: number;
  /**
   * Data estimada de entrega.
   */
  date: T;
  /**
   * Período de entrega
   */
  deliveryPeriod: DeliveryPeriod;
}

export interface ComputedDeliveryDate extends DeliveryDate<string> {
  selected: boolean;
}

export interface DeliveryHourItem {
  /**
   * Label indicativo para o horário
   */
  label: string;
  /**
   * Token de validação para a data e horário
   */
  validator: string;
  /**
   * Período de entrega desse item
   */
  period: 'P1' | 'P2';
  /**
   * Indicativo do horário selecionado
   */
  hour: number;
}

export interface DeliveryHoursResponse {
  periods_count: number;
  hours: DeliveryHourItem[];
}

export interface ComputedDeliveryHours {
  hour: number;
  label: string;
}

export interface GetInstallmentsBody {
  amount: number;
  cardBin: string;
}

export interface PostOrderCustomer {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
}

export interface PostOrderCreditCard {
  holderName: string;
  creditCardToken: string;
  numberOfPayments: number;
  installmentValue: number;
}

export interface PostOrderDeliveryGroup {
  value: number;
  validator: string;
  has_priority: boolean;
}

export interface PostOrderDelivery {
  /**
   * Envia o valor de `shiftDays` e um token para validação no backend
   */
  delivery_date: PostOrderDeliveryGroup;
  /**
   * Envia o valor inteiro do horário selecionado e um token para validação no backend
   */
  delivery_hour: PostOrderDeliveryGroup;
  /**
   * Envia o valor de frete que será cobrado e um token para validação no backend
   */
  delivery_price: Omit<PostOrderDeliveryGroup, 'has_priority'>;
}

export interface PostOrder {
  user_id: Nullable<number>;
  coupon_code: Nullable<string>;
  customer: PostOrderCustomer & IParsedAddressContent;
  delivery: PostOrderDelivery;
}

export interface CreditCardPostAdditional {
  is_same_address: boolean;
  credit_card_info: PostOrderCreditCard;
}

export type CreditCardPostOrder = PostOrder & CreditCardPostAdditional;

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

export interface GetCouponRequestBody {
  cpf: Nullable<string>;
  coupon_code: string;
  has_subsidy: boolean;
  verify_amount: boolean;
  has_selected_delivery: boolean;
  delivery_cep?: string;
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
  code: string;
  name: string;
  value: number;
  is_percentage: boolean;
  cupom_type: ICouponType;
  min_purchase: number;
}

export interface ISingleOrderCouponError {
  /**
   * Indica que um erro foi encontrado na busca pelo cupom
   */
  error: true;
  /**
   * Mensagem de erro
   */
  message: string;
}

export type CouponDefinition = ISingleOrderCoupon | ISingleOrderCouponError










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











export interface IPaginateSchema <T> {
  /**
   * Lista de itens que retornaram da consulta
   */
  items: T[];
  /**
   * Quantidade de itens "deslocados" na consulta
   */
  offset: number;
  /**
   * Indica a página que está sendo visualizada
   */
  curPage: number;
  /**
   * Indica quantos itens estão retornando em cada página
   */
  perPage: number;
  /**
   * Indica quantos itens retornaram em "items"
   */
  itemsReceived: number;
  /**
   * Indica a próxima página, se existir
   */
  nextPage: Nullable<number>;
  /**
   * Indica a página anterior, se existir
   */
  prevPage: Nullable<number>;
  /**
   * Indica quantas páginas existem
   */
  pageTotal: number;
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

export type ResponsePatternCallback = (...params: any) => void;

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
  /**
   * Indica se o acesso realizado foi o primeiro (usuário não tinha conta até este momento)
   */
  firstAccess: boolean;
  /**
   * Token de acesso fornecido para o cliente
   */
  token: string;
  /**
   * Indica o tempo de duração do token
   */
  maxAge: number;
}

export interface SignupStateStatus {
  valid: boolean;
  failedName: string;
}

export type ValidatorResponse = (valid: boolean) => [string, boolean]






export interface SingleProductPageState {
  /**
   * Quantidade de produtos selecionados
   */
  quantity: number;
  /**
   * Dados do produto
   */
  product: Nullable<SingleProductPageProduct>;
  /**
   * ID da variação do produto selecionada
   */
  selectedVariation: Nullable<number>;
  /**
   * Quantidade de itens em estoque
   */
  stockCount: number;
}

export type SingleProductPageStateKeys = keyof SingleProductPageState;

export interface SingleProductPageStateHandler {
  prices: Prices;
  BRLPrices: Prices<string>;
  computedFinalPrices: ComputedFinalPrices;
  hasPriceDifference: boolean;
  variationsCount: number;
  hasSelectedVariation: boolean;
}

export interface Prices <T = number> {
  price: T;
  full_price: T;
}

export interface ComputedFinalPrices {
  price: Prices;
  currency: Prices<string>;
}

export enum VARIATION_TYPE {
  KG = 'KG',
  UN = 'UN',
  MI = 'MI',
  LI = 'LI',
  CX = 'CX',
}

export type VariationType =
  | VARIATION_TYPE.KG
  | VARIATION_TYPE.UN
  | VARIATION_TYPE.MI
  | VARIATION_TYPE.LI
  | VARIATION_TYPE.CX;

export interface ProductVariation {
  id: number;
  label: string;
  price: number;
  full_price: number;
  variation_type: VariationType;
}

export interface SingleProductPageProduct {
  /**
   * Indentificador do produto
   */
  slug: string;
  /**
   * Nome do produto
   */
  title: string;
  /**
   * Quantas unidades existem em estoque
   */
  stock_quantity: number;
  /**
   * As variações que este produto possui
   */
  variations: ProductVariation[];
}

export interface CreateCartProduct {
  /**
   * SKU do produto indicado
   */
  sku_id: number;
  /**
   * Quantidade de vezes que esse item foi adicionado ao carrinho
   */
  quantity: number;
  /**
   * Referência única deste produto
   */
  reference_id: string;
}



export type CartOperation =
  | 'add'
  | 'delete'
  | 'increase'
  | 'decrease';

export interface CartResponseItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  slug: string;
  sku_id: number;
}

export interface CartResponse {
  order_price: number;
  items: CartResponseItem[];
}

export interface FloatingCartState {
  /**
   * Indica se já houve uma busca pelos dados do carrinho
   */
  fetched: Nullable<boolean>;
  /**
   * Indica se existe uma busca em andamento pelos itens do carrinho
   */
  isPending: boolean;
  /**
   * Indica o estado de visibilidade do carrinho
   */
  isCartOpened: boolean;
  /**
   * Dados devolvidos pela API
   */
  cart: Nullable<CartResponse>;
}

export interface FloatingCartStateHandler {
  /**
   * Valor total do pedido formatado em BRL
   */
  getOrderPrice: string;
  /**
   * Indica se a mensagem de frete grátis será exibida
   */
  hasFreeShipping: boolean;
  /**
   * Quanto ainda falta para conseguir frete grátis
   */
  missingForFreeShipping: number;
}

export type GroupFloatingCartState = FloatingCartState & FloatingCartStateHandler;