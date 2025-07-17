
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
}
