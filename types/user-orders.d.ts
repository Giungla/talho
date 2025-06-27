
export interface Orders {
  list: Order[];
}

export interface OrderGetters {
  /**
   * Informa se existem pedidos capturados
   */
  hasOrders: boolean;
  /**
   * Quantidade de pedidos capturados
   */
  ordersCount: number;
}

export type OrderProxy = Orders & Readonly<OrderGetters>;

export type OrdersProperties = keyof OrderProxy;

export type OrderStatus = 'Confirmado' | 'Pendente';

export interface Order {
  /**
   * Valor total do pedido formatado em BRL
   */
  total: string;
  /**
   * Data e hora em que o pedido foi criado
   */
  created_at: string;
  /**
   * Indica se o pagamento deste pedido já foi realizado
   */
  pago: boolean;
  /**
   * Status de pagamento do pedido
   */
  status: OrderStatus;
  /**
   * ID da transação
   */
  transaction_id: string;
  /**
   * Indica o meio de pagamento usado no pedido
   */
  payment_method: string;
  /**
   * Lista dos produtos adquiridos
   */
  order_items: OrderItem[];
}

export interface OrderItem {
  /**
   * Nome do produto
   */
  name: string;
  /**
   * ID do SKU
   */
  sku_id: number;
  /**
   * ID do produto
   */
  product_id: number;
  /**
   * Quantidade de itens
   */
  quantity: number;
  /**
   * Valor do produto (inteiro)
   */
  unit_price: number;
  /**
   * URL da imagem do produto
   */
  image: string;
  /**
   * Slug do produto
   */
  slug: string;
  /**
   * Representação da quantidade em estoque
   */
  stock_quantity: number;
  /**
   * Dados de review que o usuário poderá fornecer ao produto
   */
  review?: ProductReview;
}

export interface ProductReview {
  /**
   * Comentário fornecido pelo usuário autenticado para o produto
   */
  comment: string;
  /**
   * Nota que o usuário deu ao produto
   */
  rating: number;
}

export type CreateProductReview = Pick<OrderItem, 'product_id'> & ProductReview;
