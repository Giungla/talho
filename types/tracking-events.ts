
export interface AdvancedMatchingData {
  /**
   * Endereço de e-mail após aplicação do SHA256
   */
  em: string;
  /**
   * Número de telefone após aplicação do SHA256
   */
  ph?: string;
  /**
   * Primeiro nome após aplicação do SHA256
   */
  fn?: string;
  /**
   * Último nome após aplicação do SHA256
   */
  ln?: string;
  /**
   * Data de nascimento após aplicação do SHA256
   */
  db?: string;
}

export interface PageViewMeta {
  /**
   * ID do dataset da Meta
   */
  app_id: string;
  /**
   * ID do evento de PageView registrado no backend
   */
  event_id: string;
  /**
   * Dados do cliente para correspondência avançada manual
   */
  customer_data?: AdvancedMatchingData;
}

export interface PageViewResponse {
  /**
   * ID do evento enviado para a Meta
   */
  meta: PageViewMeta;
}







export interface ViewContentProduct {
  type: 'product';
  payload: {
    sku_id: number;
    reference_id: string;
  }
}

export interface ViewContentLandingPage {
  type: 'landing_page';
  payload: {
    page_title: string;
    page_description: string;
  }
}

export type ViewContentParams = ViewContentProduct | ViewContentLandingPage;

export interface ViewContentResponse {
  meta: {
    event_id: string;
    event_body: Omit<InitiateCheckoutBody, 'num_items'> & {
      content_name: string;
    };
  }
}






export interface InitiateCheckoutContents {
  id: string;
  quantity: number;
  item_price: number;
}

export interface InitiateCheckoutBody {
  value: number;
  currency: string;
  content_type: string;
  contents: InitiateCheckoutContents[];
  contents_ids: string[];
  num_items: number;
}

export interface InitiateCheckoutResponse {
  meta: {
    event_id: string;
    event_body: InitiateCheckoutBody;
  }
}






export interface AddToCartTrackingParams {
  /**
   * Identificador do SKU
   */
  sku_id: number;
  /**
   * Quantidade de itens adicionados
   */
  quantity: number;
  /**
   * Identificador do produto
   */
  reference_id: string;
}

export interface AddToCartContentsTracking {
  /**
   * Identificador do produto
   */
  id: string;
  /**
   * Quantidade de itens
   */
  quantity: number;
  /**
   * Valor unitário do produto
   */
  item_price: number;
}

export interface AddToCartTrackingEventData {
  value: number;
  currency: string;
  content_ids: string[];
  content_type: string;
  contents: AddToCartContentsTracking[];
}

export interface AddToCartTrackingResponse {
  event_id: string;
  event_data: AddToCartTrackingEventData;
}
