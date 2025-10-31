
import type {
  Nullable,
  ResponsePattern,
  ComputedReturnValues,
} from '../global'

import {
  OrderPrepareStatus, OrderStatus
} from './order-note'

export interface OrderManagementListData {
  /**
   * Lista de pedidos recebidos da API
   */
  orders: Nullable<OrderManagementItem[]>;
  /**
   * Registra o nome do filtro ativo
   */
  activeFilter: Nullable<AvailablePrepareFilterNames | AvailableStatusFilterNames>;
  /**
   * Lista de filtros disponíveis para os pedidos
   */
  availableFilters: OrderFilter[];
}

export interface OrderManagementListMethods {
  /**
   * Captura os pedidos que serão exibidos na lista
   */
  getOrders: () => Promise<ResponsePattern<OrderManagementItem[]>>;
  /**
   * Aplica um filtro
   */
  applyFilter: (name: AvailablePrepareFilterNames) => void;
  /**
   * Captura um filtro específico pelo nome do token
   */
  getFilterByToken: (token: AvailablePrepareFilterNames | AvailableStatusFilterNames) => RenderableOrderFilter | undefined;
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
  /**
   * Retorna apenas os filtros que podem ser selecionados com base nos pedidos recebidos
   */
  getAppliableFilters: () => OrderFilter[];
  /**
   * Retorna os status dos pedidos que foram devolvidos pela API
   */
  getAvailableStatus: () => (AvailablePrepareFilterNames | AvailableStatusFilterNames)[];
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
  prepare_status: Nullable<AvailablePrepareFilterNames>;
  /**
   * Status de entrega do pedido
   */
  status: Nullable<AvailableStatusFilterNames>;
}

export interface OrderManagementItemParsed extends Omit<OrderManagementItem, 'created_at' | 'order_items' | 'total' | 'transaction_id' | 'prepare_status' | 'status'> {
  url: string;
  price: string;
  items_count: number;
  created_date: string;
  delivery_status?: OrderFilter;
}

export type AvailablePrepareFilterNames =
  | OrderPrepareStatus.PREPARED
  | OrderPrepareStatus.PREPARING
  | OrderPrepareStatus.DELIVERYREADY

export type AvailableStatusFilterNames =
  | OrderStatus.COMPLETED
  | OrderStatus.ASSIGNING_DRIVER
  | OrderStatus.CANCELED
  | OrderStatus.EXPIRED
  | OrderStatus.REJECTED
  | OrderStatus.ON_GOING
  | OrderStatus.PICKED_UP

export interface OrderFilter {
  /**
   * Nome do filtro (exibido no frontend)
   */
  label: string;
  /**
   * Token do filtro (usado para comparação com os status de pedido)
   */
  name: AvailablePrepareFilterNames | AvailableStatusFilterNames;
}

export type RenderableOrderFilter = OrderFilter & {
  /**
   * Nome da classe gerada com base no token do filtro
   */
  className: string;
}
