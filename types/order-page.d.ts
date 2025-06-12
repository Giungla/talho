
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
  getOrder: (orderId: string) => Promise<ResponsePattern<OrderData>>;
}

// como os dados computados serão declarados
export interface TalhoOrderPageComputedDefinition {
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
   * Captura o valor do frete do pedido formatado em BRL
   */
  getOrderShippingPriceFormatted: () => string;
  /**
   * Captura o valor recebido de desconto sobre este pedido formatado em BRL
   */
  getOrderDiscountPriceFormatted: () => string;
  getParsedProducts: () => ParsedProduct[];
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
  slug: string;
  title: string;
  image: string;
  sku_id: number;
  quantity: number;
  product_id: number;
  unit_amount: number;
}

export interface ParsedProduct {
  /**
   * Identificador único do item
   */
  key: string;
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
}

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
}
