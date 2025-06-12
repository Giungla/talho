
import {
  Nullable,
  ResponsePattern,
  ISinglePaymentKey, ComputedReturnValues,
} from '../global'

export interface TalhoPixProcessData {
  /**
   * Detalhes do pedido atual
   */
  order: Nullable<PixOrderData>;
  /**
   * Indica se o código PIX foi copiado recentemente
   */
  hasCopied: boolean;
  /**
   * Timestamp atual
   */
  now: number;
  /**
   * Interval ID
   */
  nowInterval: Nullable<number>;
}

export interface TalhoPixProcessMethods {
  pollOrder: (orderId: string) => void;
  patchOrder: (payload: PixOrderDataPoll) => void;
  getOrder: (orderId: string) => Promise<ResponsePattern<PixOrderData>>;
  handleCopyQRCode: () => Promise<void>;
  clearInterval: () => void;
  setQRImage: () => void;
}

export interface TalhoPixOrderComputedDefinition {
  /**
   * Retorna o preço do pedido formatado em BRL
   */
  orderPrice: () => string;
  /**
   * Retornará o tempo restante para efetivação do pagamento
   */
  timmer: () => string;
  /**
   * Informará se o pedido já se encontra pago
   */
  hasPaid: () => boolean;
  /**
   * Informará se o pedido já se encontra expirado
   */
  isExpired: () => boolean;
  /**
   * Retorna o código QR para esse pedido
   */
  getQRCode: () => string;
}

export type TalhoPixOrderComputed = ComputedReturnValues<TalhoPixOrderComputedDefinition>;

export interface TalhoPixProcessWatch {
  timmer: (time: string) => void;
}

export type TalhoPixProcessContext = TalhoPixProcessData & TalhoPixProcessMethods & TalhoPixOrderComputed;

export interface PixOrderData {
  due_time: number;
  created_at: number;
  order_status: 1 | 2;
  payment_method: ISinglePaymentKey;
  total: number;
  pago: boolean;
  qrcode: string;
  qrcode_text: string;
  expired: boolean;
}

export type PixOrderDataPoll = Pick<PixOrderData, 'pago' | 'expired' | 'total'>;
