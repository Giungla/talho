
import {
  type Nullable,
  type ResponsePattern,
  type ComputedReturnValues,
  type IPaginateSchema, IPaginatedSchemaAddon,
} from '../global'

import {
  type OrderStatusKeys,
  type OrderPrepareStatusKeys,
} from './order'

import {
  type WritableComputedOptions,
} from 'vue'

export type AvailableFilterStatus = OrderPrepareStatusKeys | Extract<OrderStatusKeys, 'COMPLETED' | 'CANCELED'>;

export interface OrderManagementFilter {
  /**
   * Indica a página que está sendo visualizada
   */
  page: number;
  /**
   * Indica qual o status de preparação/entrega selecionado para visualização
   */
  status: Nullable<AvailableFilterStatus>;
  /**
   * Data final usada no filtro
   */
  endDate: Nullable<string>;
  /**
   * Data inicial usada no filtro
   */
  startDate: Nullable<string>;
}

export interface OrderManagementListData {
  /**
   * Lista de pedidos recebidos da API
   */
  orders: Nullable<IPaginatedSchemaAddon<OrderManagementItem, OrderManagementDateLimitObject>>;
  /**
   * Lista de filtros disponíveis para os pedidos
   */
  availableFilters: OrderFilter[];
  /**
   * Filtros usados na captura dos registros
   */
  filter: OrderManagementFilter;
  /**
   * Referencia o método responsável por atualizar a URL
   */
  refreshURLState: null | (() => void);
}

export interface OrderManagementListMethods {
  /**
   * Captura os pedidos que serão exibidos na lista
   */
  getOrders: () => Promise<ResponsePattern<IPaginatedSchemaAddon<OrderManagementItem, OrderManagementDateLimitObject>>>;
  /**
   * Captura um filtro específico pelo nome do token
   */
  getFilterByToken: (token: OrderStatusKeys | OrderPrepareStatusKeys) => RenderableOrderFilter | undefined;
  /**
   * Captura os registro de outra página
   */
  refresh: (shouldUpdatedURL: boolean = true) => Promise<void>;
  /**
   * Método responsável por alterar a página que está sendo visualizada
   */
  handlePaginate: (page: number) => Promise<void>;
  /**
   * Método responsável por alterar o filtro de preparação/entrega
   */
  handleStatus: (status: Nullable<AvailableFilterStatus>) => Promise<void>;
  /**
   * Reseta as datas do filtro para o mínimo e máximo disponível
   */
  resetFilterDates: () => void;
  /**
   * Permite resetar as datas usadas no filtro
   */
  handleResetDates: () => void;
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
   * Indica se a paginação possui página anterior
   */
  hasPrevPage: () => boolean;
  /**
   * Indica se a paginação possui próxima página
   */
  hasNextPage: () => boolean;
  /**
   * Indica se uma rota para a última página deve ser exibida
   */
  hasLastPage: () => boolean;
  /**
   * Indica se uma rota para a primeira página deve ser exibida
   */
  hasFirstPage: () => boolean;
  /**
   * Retorna os parâmetros responsáveis pelo filtro como query parameters
   */
  getFilteringQueryParams: () => string;
  /**
   * Permite escrita e leitura (formatada) da data final
   */
  endDate: WritableComputedOptions<Nullable<string>>;
  /**
   * Permite escrita e leitura (formatada) da data inicial
   */
  startDate: WritableComputedOptions<Nullable<string>>;
  /**
   * Informa se a ordem fornecida para as datas está incorreta
   */
  hasReversedDates: () => boolean;
  /**
   * Retorna os limites de busca
   */
  getLimits: () => OrderManagementDateLimits<Nullable<string>>;
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
  name: AvailableFilterStatus;
}

export type RenderableOrderFilter = OrderFilter & {
  /**
   * Nome da classe gerada com base no token do filtro
   */
  className: string;
}

export interface OrderManagementDateLimits <T> {
  /**
   * Timestamp do pedido mais antigo da base
   */
  oldest: T;
  /**
   * Timestamp do pedido mais recente da base
   */
  newest: T;
}

export interface OrderManagementDateLimitObject {
  dateLimits: OrderManagementDateLimits<number>;
}
