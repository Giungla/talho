
import {
  type Nullable,
  type ResponsePattern,
  type ComputedReturnValues,
} from '../global'

import {
  type OrderStatusKeys,
  type OrderPrepareStatusKeys,
  type OrderPrepareNotStarted,
} from './order'

export interface OrderManagementListData {
  /**
   * Lista de pedidos recebidos da API
   */
  orders: Nullable<OrderManagementItem[]>;
  /**
   * Registra o nome do filtro ativo
   */
  activeFilter: Nullable<OrderStatusKeys | OrderPrepareStatusKeys>;
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
  applyFilter: (name: OrderStatusKeys | OrderPrepareStatusKeys) => void;
  /**
   * Captura um filtro específico pelo nome do token
   */
  getFilterByToken: (token: OrderStatusKeys | OrderPrepareStatusKeys) => RenderableOrderFilter | undefined;
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
  getAvailableStatus: () => (OrderStatusKeys | OrderPrepareStatusKeys | OrderPrepareNotStarted)[];
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
  prepare_status: OrderPrepareStatusKeys;
  /**
   * Status de entrega do pedido
   */
  status: Nullable<OrderStatusKeys>;
}

export interface OrderManagementItemParsed extends Omit<OrderManagementItem, 'created_at' | 'order_items' | 'total' | 'transaction_id' | 'prepare_status' | 'status'> {
  url: string;
  price: string;
  items_count: number;
  created_date: string;
  delivery_status?: OrderFilter;
}

export interface OrderFilter {
  /**
   * Nome do filtro (exibido no frontend)
   */
  label: string;
  /**
   * Token do filtro (usado para comparação com os status de pedido)
   */
  name: OrderStatusKeys | OrderPrepareStatusKeys | OrderPrepareNotStarted;
}

export type RenderableOrderFilter = OrderFilter & {
  /**
   * Nome da classe gerada com base no token do filtro
   */
  className: string;
}
