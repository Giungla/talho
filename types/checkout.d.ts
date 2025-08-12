
import type {
  Nullable,
} from '../global'

export interface OrderResponse {
  succeeded: boolean;
  transactionid: string;
  errorMessage: Nullable<string>;
  paymentstatus: 1 | 2;
}

export interface CreditCardOrderResponse extends OrderResponse {
  recurring_card_id: Nullable<string>;
  transaction_charge_id: Nullable<string>;
}

export interface PIXOrderResponse extends OrderResponse {
  qrcode: string;
  qrcode_text: string;
}

export interface SearchAddressCheckout {
  cep: string;
  deliveryMode?: boolean;
}

export interface CheckoutDeliveryRequestBody {
  /**
   * CEP usado para gerar o pedido
   */
  cep: string;
  /**
   * Quantidade de dias decorridos desde a data de simulação/geração
   */
  shiftDays: number;
  /**
   * Token gerado com data e hora no backend
   */
  hourToken: string;
  /**
   * Indicativo do horário selecionado
   */
  selectedHour: number;
}

export interface CheckoutDeliveryPriceResponse {
  /**
   * Data de entrega selecionada
   */
  date: string;
  /**
   * Valor total da entrega (inteiro)
   */
  total: number;
  /**
   * Horário selecionado (inteiro)
   */
  selectedHour: number;
  /**
   * Token de verificação do valor de entrega
   */
  validator: string;
}

export interface CheckoutDeliveryHour {
  /**
   * Label usado para apresentar o horário no frontend do site
   */
  label: string;
  /**
   * Token usado para validar o horário no momento em que este for recebido de volta no backend
   */
  validator: string;
  /**
   * Indica o período de entrega desse horário, sendo P1 para manhã e P2 para tarde
   */
  period: 'P1' | 'P2';
  /**
   * Horário da entrega (inteiro)
   */
  hour: number;
  /**
   * Indica se esse horário dara preferência na entrega do pedido mediante taxa adicional
   */
  has_priority: boolean;
}

export interface CheckoutDeliveryPeriod {
  hours: CheckoutDeliveryHour[];
  periods_count: number;
}

export interface CheckoutDeliveryOption {
  /**
   * Quantidade de dias que se passaram desde a data atual
   */
  shift_days: number;
  /**
   * Data de entrega retornada nesse grupo
   */
  date: string;
  /**
   * Label usado para indicar o dia da entrega dessa data
   */
  label: string;
  /**
   * Períodos de entrega existentes nessa data
   */
  periods: CheckoutDeliveryPeriod;
  /**
   * Indica se a data retornada será usada para dar preferência na entrega do pedido
   */
  has_priority: boolean;
  /**
   * Token que será usado para validar o valor recebido no backend
   */
  validator: string;
}

export interface CheckoutDeliveryResponse {
  /**
   * Retorna o valor percentual de desconto fornecido para pagamentos PIX
   */
  pix_discount: number;
  /**
   * Informa qual taxa de prioridade será aplicada
   */
  priority_fee: number;
  /**
   * Informa as datas e horários disponíveis para entrega
   */
  dates: CheckoutDeliveryOption[];
}

export interface ComputedDeliveryDates {
  label: string;
  selected: boolean;
  shift_days: number;
}
