
import type {
  Nullable,
  ResponsePattern,
  ComputedReturnValues,
} from '../global'

import type {
  OrderPrepareStatus
} from './order-note'

export interface OrderManagementListData {
  orders: Nullable<OrderManagementItem[]>;
}

export interface OrderManagementListMethods {
  /**
   * Captura os pedidos que serão exibidos na lista
   */
  getOrders: () => Promise<ResponsePattern<OrderManagementItem[]>>;
}

export interface OrderManagementListComputedDefinition {
  /**
   * Indica se existem pedidos carregados em memória
   */
  hasOrders: () => boolean;
  /**
   * Captura a lista de pedidos transformada para renderização
   */
  getParsedOrders: () => OrderManagementItemParsed[];
}

export type OrderManagementListComputed = ComputedReturnValues<OrderManagementListComputedDefinition>

export type OrderManagementListContext = OrderManagementListData & OrderManagementListMethods & OrderManagementListComputed

export interface OrderManagementItem {
  /**
   * ID do registro
   */
  id: number;
  /**
   * Timestamp do momento de criação do registro
   */
  created_at: number;
  /**
   * ID da transação do pedido
   */
  transaction_id: string;
  /**
   * Valor total do pedido (inteiro)
   */
  total: number;
  /**
   * Data de entrega do pedido
   */
  date: string;
  /**
   * Horário de entrega do pedido
   */
  hour: number;
  /**
   * Quantidade de itens que foram adquiridos neste pedido
   */
  order_items: number;
  /**
   * Nome do usuário de acordo com o endereço de entrega
   */
  user_name: string;
  /**
   * Status de preparação do pedido
   */
  prepare_status: Nullable<OrderPrepareStatus>;
}

export interface OrderManagementItemParsed extends Omit<OrderManagementItem, 'created_at' | 'order_items' | 'total' | 'transaction_id'> {
  url: string;
  price: string;
  items_count: number;
  created_date: string;
}
