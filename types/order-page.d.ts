
import {
  Nullable,
  ResponsePattern,
  ISinglePaymentKey,
  ComputedReturnValues
} from '../global'

export interface TalhoOrderPageData {
  order: Nullable<OrderData>;
}

export interface TalhoOrderPageMethods {
  /**
   * Captura o pedido indicado
   */
  getOrder: (orderId: string) => Promise<ResponsePattern<OrderData>>;
  /**
   * Realiza tracking do pedido via backend
   */
  // logPurchase: (orderId: string, retry: number) => Promise<void>;
}

// como os dados computados serão declarados
export interface TalhoOrderPageComputedDefinition {
  /**
   * Indica se o método de pagamento selecionado neste pedido foi PIX
   */
  isPIXPayment: () => boolean;
  /**
   * Indica se o pedido realizado possui desconto pelo método de pagamento PIX
   */
  hasPIXDiscount: () => boolean;
  /**
   * Retorna o valor de desconto PIX se existir
   */
  getDiscountPIXPrice: () => string;
  /**
   * Nome do usuário que gerou o pedido
   */
  name: () => string;
  /**
   * Endereço de e-mail do usuário que gerou o pedido
   */
  email: () => string;
  /**
   * CPF do usuário que gerou o pedido
   */
  cpf: () => string;
  /**
   * Telefone do usuário que gerou o pedido
   */
  phone: () => string;
  /**
   * Retorna o endereço de entrega do pedido
   */
  shipping: () => OrderShippingAddress;
  /**
   * Retorna o endereço de cobrança do pedido
   */
  billing: () => OrderAddress;
  /**
   * Indica se um cupom de desconto foi usado
   */
  hasOrderDiscount: () => boolean;
  /**
   * Captura o subtotal do pedido
   */
  getOrderSubtotalPriceFormatted: () => string;
  /**
   * Captura o valor total do pedido formatado em BRL
   */
  getOrderPriceFormatted: () => string;
  /**
   * Retorna o valor do frete desse pedido
   */
  getOrderShipping: () => number;
  /**
   * Retorna o valor de `getOrderShipping` formatado em BRL
   */
  getOrderShippingPriceFormatted: () => string;
  /**
   * Captura o valor recebido de desconto sobre este pedido formatado em BRL
   */
  getOrderDiscountPriceFormatted: () => string;
  /**
   * Retorna a lista de produtos deste pedido
   */
  getParsedProducts: () => ParsedProduct[];
  /**
   * Indica se foi solicitada prioridade no pedido
   */
  hasPriority: () => boolean;
  /**
   * Indica o valor cobrado pela prioridade no pedido (0 se `hasPriority` for `false`)
   */
  getPriorityFee: () => number;
  /**
   * Retorna o valor de `getPriorityFee` formatado em BRL
   */
  getPriorityFeePriceFormatted: () => string;
  /**
   * Indica se o pedido tem desconto por subsídio
   */
  hasSubsidy: () => boolean;
  /**
   * Retorna o valor de subsídio deste pedido (0 se `hasSubsidy` for `false`)
   */
  getDeliverySubsidy: () => number;
  /**
   * Retorna o valor de `getDeliverySubsidy` formatado em BRL
   */
  getDeliverySubsidyPriceFormatted: () => string;
  /**
   * Indica se o pedido possui frete grátis fornecido pelo valor do subtotal
   */
  hasFreeShippingByCartPrice: () => boolean;
}

// como os dados computados serão capturados no contexto this
export type TalhoOrderPageComputed = ComputedReturnValues<TalhoOrderPageComputedDefinition>;

export type TalhoOrderPageContext = TalhoOrderPageData & TalhoOrderPageMethods & TalhoOrderPageComputed;

export interface OrderAddress {
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderShippingAddress extends OrderAddress {
  user_name: string;
}

export interface OrderProduct {
  /**
   * Nome do produto
   */
  name: string;
  /**
   * ID do produto no Xano
   */
  product_id: number;
  /**
   * ID do SKU adquirido
   */
  sku_id: number;
  /**
   * Valor unitário do produto
   */
  unit_price: number;
  /**
   * Indica quantas unidades deste item foram adquiridas neste pedido
   */
  quantity: number;
  /**
   * Retorna a URL da imagem do produto
   */
  image: Nullable<string>;
}

export interface ParsedProduct {
  /**
   * Identificador único do item
   */
  key: number;
  /**
   * Nome do produto
   */
  title: string;
  /**
   * Quantas unidades deste item foram adquiridas
   */
  quantity: number;
  /**
   * Preço unitário do produto representado em BRL (ex: R$ 154,90)
   */
  unit_amount: string;
  /**
   * Preço final deste produto (`unit_amount` * `quantity`) representado em BRL
   */
  final_price: string;
  /**
   * Retorna o estilo para ser aplicado no elemento de imagem
   */
  imageStyle: string;
}

export interface OrderPriority <T, K> {
  has_priority: T;
  priority_price: K;
}

export interface OrderSubsidy <T, K> {
  has_subsidy: T;
  subsidy_price: K;
}

export interface BaseOrderDelivery {
  quotation_price: number;
  date: string;
  hour: number;
  delivered: boolean;
  status: null;
  address: OrderShippingAddress;
  has_freeship_by_cart_price: boolean;
}

export type DeliveryOrder =
  | (BaseOrderDelivery & OrderPriority<true, number> & OrderSubsidy<true, number>)
  | (BaseOrderDelivery & OrderPriority<true, number> & OrderSubsidy<false, null>)
  | (BaseOrderDelivery & OrderPriority<false, null> & OrderSubsidy<true, number>)
  | (BaseOrderDelivery & OrderPriority<false, null> & OrderSubsidy<false, null>);

export interface OrderData {
  /**
   * Nome do usuário que gerou o pedido
   */
  name: string;
  /**
   * Endereço de e-mail do usuário que gerou o pedido
   */
  email: string;
  /**
   * CPF do usuário que gerou o pedido
   */
  cpf_cnpj: string;
  /**
   * Telefone do usuário que gerou o pedido
   */
  phone: string;
  /**
   * Custo do frete do pedido
   */
  shipping_total: number;
  /**
   * Método de pagamento usado no pedido
   */
  payment_method: ISinglePaymentKey;
  /**
   * Informa quantas em parcelas o usuário fez o pagamento (retorna 1 se o método usado for pix)
   */
  installment_count: number;
  /**
   * Valor de cada uma das parcelas (retorna o valor do pedido se o método usado for pix)
   */
  installment_price: number;
  /**
   * Código do cupom de desconto usado
   */
  discount_code: Nullable<number>;
  /**
   * Valor do desconto fornecido em função do uso do cupom
   */
  discount: number;
  /**
   * Status do pedido (1 = Pago, 2 = Pendente, 3 = Cancelado)
   */
  order_status: '1' | '2' | '3';
  /**
   * Valor total do pedido considerando todos os descontos e o frete
   */
  total: number;
  /**
   * Informa se o pagamento deste pedido já foi realizado
   */
  pago: boolean;
  /**
   * Retorna os dados do endereço de cobrança do pedido
   */
  billing_address: OrderAddress;
  /**
   * Retorna os dados do endereço de entrega do pedido
   */
  shipping_address: OrderShippingAddress;
  /**
   * Lista de produtos que foram adquiros neste pedido
   */
  order_items: OrderProduct[];
  /**
   * Dados de entrega do pedido
   */
  delivery: DeliveryOrder;
  /**
   * Indica o percentual de desconto fornecido sobre o subtotal para pagamentos via PIX
   */
  pix_discount_percentual: Nullable<number>;
  /**
   * Indica o valor do desconto fornecido para o pagamento quando este foi realizado via PIX
   */
  pix_discount_price: Nullable<number>;
  /**
   * Retorna o valor do subtotal do pedido (considera somente os produtos no cálculo)
   */
  subtotal: number;
}
