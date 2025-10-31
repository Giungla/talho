
import {
  Nullable,
  ResponsePattern,
  ComputedReturnValues,
} from '../global'

export interface OrderCompany {
  name: string;
  website: string;
  address: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  cpf: string;
  zip: string;
  address: string;
  complement: string;
  district: string;
}

export interface OrderDetails {
  date: string;
  time: string;
  number: number;
  delivery_type: string;
  change_for: string;
  shipping: string;
  notes_short: string;
  observations: string;
  subtotal: string;
  discounts: string;
  total: string;
  items_count: number;
  paid: boolean;
  delivered_at: Nullable<string>;
  has_free_shipping: boolean;
  delivery_hour: string;
  delivery_date: string;
  prepare_status: OrderPrepareStatus;
}

export type OrderPayment = (
  | { payment_method: 'creditcard' }
  | { payment_method: 'pix'; pix_discount_percentual: string; pix_discount_price: string; }
)

export type OrderPriority =
  | { has_priority: false; }
  | { has_priority: true; priority_price: string; }

export type OrderSubsidy =
  ({ has_subsidy: false; }
  | { has_subsidy: true; subsidy_price: string; })

export interface OrderItem {
  code: number;
  description: string;
  portion: string;
  qty: number;
  unit_price: string;
  total: string;
}

export interface PixDiscount {
  discountPercentual: string;
  discountPrice: string;
}

enum OrderPrepareStatus {
  PREPARING     = 'PREPARING',
  PREPARED      = 'PREPARED',
  DELIVERYREADY = 'DELIVERYREADY',
}

enum OrderStatus {
  /**
   * Representa um pedido entregue
   */
  COMPLETED        = 'COMPLETED',
  /**
   * Representa um pedido que ainda está buscando um motorista
   */
  ASSIGNING_DRIVER = 'ASSIGNING_DRIVER',
  /**
   * Representa um pedido que já está a caminho do cliente
   */
  ON_GOING         = 'ON_GOING',
  /**
   * Representa um pedido que foi retirado pelo entregador
   */
  PICKED_UP        = 'PICKED_UP',
  /**
   * Representa um pedido que teve sua entrega cancelada
   */
  CANCELED         = 'CANCELED',
  /**
   * Representa um pedido que foi rejeitado, após ser cancelado por 2 vezes
   */
  REJECTED         = 'REJECTED',
  /**
   * Representa um pedido que expirou, por não encontrar um motorista para a realização da entrega
   */
  EXPIRED          = 'EXPIRED',
}

export type FinalOrder = OrderDetails & OrderSubsidy & OrderPriority & OrderPayment;

export type FinalCOrder = Pick<FinalOrder, 'number' | 'date' | 'time' | 'change_for' | 'shipping' | 'notes_short' | 'observations' | 'subtotal' | 'discounts' | 'total' | 'has_free_shipping'> & {
  payment_method: string;
};

export interface Order {
  company: OrderCompany;
  customer: OrderCustomer;
  order: FinalOrder;
  items: OrderItem[];
}

export interface OrderNoteData {
  order: Nullable<Order>;
  prepare_status: Nullable<OrderPrepareStatus>;
  prepareMessage: Nullable<string>;
}

export interface OrderNoteMethods {
  getOrder: (transactionid: string) => Promise<ResponsePattern<Order>>;
  handleOrderStatus: () => Promise<void>;
  setOrderStatus: (order_id: number, status: OrderPrepareStatus) => Promise<ResponsePattern<PatchPrepareStatusParams>>;
  printPage: () => void;
}

export interface OrderNoteComputedDefinition {
  company: () => Nullable<OrderCompany>;
  customer: () => Nullable<OrderCustomer>;
  items: () => Nullable<OrderItem[]>;
  itemsCount: () => number;
  cOrder: () => Nullable<FinalCOrder>;
  deliveryDate: () => Nullable<string>;
  priorityTax: () => Nullable<string>;
  subsidyDiscount: () => Nullable<string>;
  pixDiscount: () => Nullable<PixDiscount>;
  hasPaid: () => boolean;
  deliveredAt: () => Nullable<string>;
}

export type OrderNoteComputed = ComputedReturnValues<OrderNoteComputedDefinition>;

export type OrderNoteContext = OrderNoteData & OrderNoteMethods & OrderNoteComputed;

export interface PatchPrepareStatusParams {
  order_id: number;
  prepare_status: OrderPrepareStatus;
}
