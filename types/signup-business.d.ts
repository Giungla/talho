
import {
  type Nullable,
  type IStateAcronym,
  type VIACEPFromXano,
  type ResponsePattern,
  type ComputedReturnValues,
  type ISingleValidateCheckout,
} from '../global'

import {
  type Ref,
  type WatchCallback,
  type ObjectDirective,
} from 'vue'

export interface SignupBusinessSetup {
  /**
   * Referência do formulário
   */
  formElement: Ref<HTMLFormElement | undefined>;
  /**
   * Referência da mensagem global de erro
   */
  globalErrorMessageElement: Ref<HTMLDivElement | undefined>;
  /**
   * Referência da mensagem global de sucesso
   */
  globalSuccessMessageElement: Ref<HTMLDivElement | undefined>;
  /**
   * Referência do campo Nome
   */
  firstNameElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Sobrenome
   */
  lastNameElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo CPF
   */
  cpfElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Ee-mail
   */
  emailElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Data de nascimento
   */
  birthDayElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Telefone
   */
  phoneElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Senha
   */
  passwordElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo CEP
   */
  cepElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Endereço
   */
  addressElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Número
   */
  numberElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Bairro
   */
  neighborhoodElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Cidade
   */
  cityElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referência do campo Estado
   */
  stateElement: Ref<HTMLInputElement | undefined>;
  /**
   * Referênca do campo "Aceito os termos"
   */
  termsElement: Ref<HTMLInputElement | undefined>;
}

export interface SignupBusinessData {
  /**
   * Os dados do usuário que será cadastrado
   */
  user: User;
  /**
   * O endereço do usuário que será cadastrado
   */
  address: UserAddress;
  /**
   * Indica se o usuário aceitou os termos
   */
  acceptTerms: boolean;
  /**
   * Indica se o usuário quer receber notificações via E-mail e/ou SMS
   */
  optIn: boolean;
  /**
   * Registra os campos que foram visitados
   */
  visitedFields: string[];
  /**
   * Indicativo de carregamento
   */
  loadingText: Nullable<string>;
  /**
   * Registra a mensagem de erro ao capturar um endereço no caso de falha da requisição
   */
  addressMessageError: Nullable<string>;
  /**
   * Indica se houve tentativa de submissão do form
   */
  isSubmitted: boolean;
  /**
   * Resposta da requisição de criação de usuário
   */
  createResponse: Nullable<CreateUserResponse | string>;
}

export interface SignupBusinessMethods {
  /**
   * Permite criar um usuário usando os dados fornecidos ao formulário
   */
  createUser: (data: CreateUserPayload) => Promise<ResponsePattern<CreateUserResponse>>;
  /**
   * Permite realizar a busca por um endereço dado o seu CEP
   */
  searchAddress: (cep: string, signal: AbortSignal) => Promise<ResponsePattern<VIACEPFromXano>>;
  /**
   * Intercepta e trata o envio do formulário
   */
  handleSubmit: (e: SubmitEvent) => Promise<void>;
  /**
   * Adiciona um campo na lista de visitados
   */
  setVisitedField: (fieldName: string) => void;
  /**
   * Verifica se o campo indicado foi visitado
   */
  hasVisitEntry: (fieldName: string) => boolean;
  /**
   * Dispara todas as validações
   */
  triggerValidations: () => void;
}

export interface SignupBusinessComputedDefinition {
  /**
   * Validação do nome do usuário
   */
  nameValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do último nome do usuário
   */
  lastNameValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do CPF do usuário
   */
  cpfValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do e-mail do usuário
   */
  emailValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação da data de nascimento do usuário
   */
  birthDateValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do telefone do usuário
   */
  phoneValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do CEP do endereço do usuário
   */
  cepValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do endereço (nome da rua)
   */
  addressValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do número do endereço
   */
  numberValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do bairro do endereço
   */
  neighborhoodValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação da cidade do endereço
   */
  cityValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação do estado do endereço
   */
  stateValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação da senha do usuário
   */
  passwordValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Validação dos termos da loja
   */
  termsValidation: () => ISingleValidateCheckout<HTMLInputElement>;
  /**
   * Verifica se todos os campos do formulário são válidos
   */
  validatableFields: () => ISingleValidateCheckout<HTMLInputElement>[];
  /**
   * Captura o primeiro campo que esteja inválido
   */
  firstInvalidField: () => ISingleValidateCheckout<HTMLInputElement> | undefined;
  /**
   * Captura o status de envio dos dados do formulário
   */
  getLoadingText: () => Nullable<string>;
  /**
   * Captura a mensagem de erro para os dados de endereço
   */
  getAddressErrorMessage: () => Nullable<string>;
  /**
   * Indica qual tipo de resposta foi recebido na última requisição
   */
  getResponseType: () => Nullable<ResponseType>;
}

export type SignupBusinessComputed = ComputedReturnValues<SignupBusinessComputedDefinition>;

export interface SignupBusinessWatch {
  'address.cep': WatchCallback<string, string>;
}

export interface SignUpBusinessDirectives {
  /**
   * Remove os espaços no inicio e final do texto
   */
  trim: ObjectDirective;
  /**
   * Mascara para o CEP
   */
  maskCep: ObjectDirective;
  /**
   * Mascara para o CPF
   */
  maskCpf: ObjectDirective;
  /**
   * Mascara para a data
   */
  maskDate: ObjectDirective;
  /**
   * Mascara para o telefone
   */
  maskPhone: ObjectDirective;
  /**
   * Transforma o texto em caixa alta
   */
  uppercase: ObjectDirective;
  /**
   * Marca o nome de um campo como visitado
   */
  visitedField: ObjectDirective;
  /**
   * Permite alterar o valor do atributo "value" em um elemento HTML
   */
  value: ObjectDirective;
}

export type SignupBusinessContext = SignupBusinessSetup & SignupBusinessData & SignupBusinessMethods & SignupBusinessComputed;

export interface User {
  /**
   * Primeiro nome do usuário que será cadastrado
   */
  name: string;
  /**
   * Último nome do usuário que será cadastrado
   */
  lastName: string;
  /**
   * CPF do usuário cadastrado (formatado)
   */
  cpf: string;
  /**
   * Endereço de e-mail do cliente
   */
  email: string;
  /**
   * Telefone do usuário que será cadastrado
   */
  phone: string;
  /**
   * Data de nascimento do usuário que será cadastrado
   */
  birthDate: string;
  /**
   * Senha do usuário que será registrado
   */
  password: string;
}

export interface UserAddress {
  /**
   * CEP do endereço do usuário
   */
  cep: string;
  /**
   * Nome da rua do endereço
   */
  address: string;
  /**
   * Número da residência
   */
  number: string;
  /**
   * Complemento do endereço
   */
  complement: string;
  /**
   * Bairro do endereço
   */
  neighborhood: string;
  /**
   * Cidade do endereço
   */
  city: string;
  /**
   * Sigla do estado
   */
  state: IStateAcronym;
}

export type CreateUserPayload = Pick<SignupBusinessData, 'user' | 'address' | 'acceptTerms' | 'optIn'>;

export interface CreateUserResponse {
  /**
   * ID do usuário registrado no base de dados
   */
  user: number;
  /**
   * ID do endereço registrado na base de dados
   */
  address: number;
}

export type ResponseType = 'success' | 'error';
