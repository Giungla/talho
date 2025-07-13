
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
