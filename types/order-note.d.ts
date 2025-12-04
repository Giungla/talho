
import {
  type Nullable,
  type ResponsePattern,
  type ComputedReturnValues,
} from '../global'

import {
  type OrderStatusKeys,
  type OrderPrepareStatusKeys,
} from './order'

import {
  type WritableComputedOptions,
} from 'vue'

import {
  type AvailableFilterStatus,
} from './order-management-list'

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
  /**
   * Status de preparo do pedido
   */
  prepare_status: OrderPrepareStatusKeys;
  /**
   * Status de entrega do pedido
   */
  status: Nullable<Exclude<AvailableFilterStatus, OrderPrepareStatusKeys>>;
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

export interface AvailableFilterChangeOptions {
  label: string;
  filterKey: AvailableFilterStatus;
}

export interface OrderPrepareStatusChangeable {
  /**
   * Valor que foi configurado pelo usuário ou recebido da API
   */
  selected: AvailableFilterStatus;
  /**
   * Valor do status real do pedido
   */
  current: Nullable<AvailableFilterStatus>;
}

export interface OrderNoteData {
  order: Nullable<Order>;
  /**
   * Registra o timer da mensagem presente na tela, `null` se não houverem mensagens
   */
  messageTimer: Nullable<NodeJS.Timeout>;
  prepareMessage: Nullable<string>;
  prepare_status: OrderPrepareStatusChangeable;
}

export interface OrderNoteMethods {
  getOrder: (transactionid: string) => Promise<ResponsePattern<Order>>;
  handleOrderStatus: () => Promise<void>;
  setOrderStatus: (order_id: number, status: AvailableFilterStatus) => Promise<ResponsePattern<PatchPrepareStatuszResponse>>;
  printPage: () => void;
  /**
   * Responsável pela limpeza da mensagem e do timer atrelado a ela
   */
  clearMessage: () => void;
  /**
   * Sincroniza o estado recebido do backend com as variáveis locais em casos de updates e/ou falhas nas requisições
   */
  syncOrderStatuses: () => void;
}

export interface OrderNoteComputedDefinition {
  finalOrderStatus: WritableComputedOptions<AvailableFilterStatus>;
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
  getAvailableFilterChangeOptions: () => AvailableFilterChangeOptions[];
}

export type OrderNoteComputed = ComputedReturnValues<OrderNoteComputedDefinition>;

export type OrderNoteContext = OrderNoteData & OrderNoteMethods & OrderNoteComputed;

export interface PatchPrepareStatusParams {
  order_id: number;
  prepare_status: AvailableFilterStatus;
}

export interface PatchPreparedStatusResponse extends PatchPrepareStatusParams{
  /**
   * Status de entrega atualizado do item
   */
  status: OrderStatusKeys;
  /**
   * Status de preparo atualizado do item
   */
  prepare_status: OrderPrepareStatusKeys;
}
