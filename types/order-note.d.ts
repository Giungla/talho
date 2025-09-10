
import {
  ComputedReturnValues,
  ISinglePaymentKey,
  Nullable,
  ResponsePattern,
} from '../global'

export interface OrderCompany {
  name: string;
  website: string;
  address: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
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

export type FinalOrder = OrderDetails & OrderSubsidy & OrderPriority & OrderPayment;

export type FinalCOrder = Pick<FinalOrder, 'number' | 'date' | 'time' | 'change_for' | 'shipping' | 'notes_short' | 'observations' | 'subtotal' | 'discounts' | 'total'> & {
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
