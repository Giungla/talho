
import {
  Nullable,
  CartOperation,
  CreateCartProduct,
  SingleProductPageProduct
} from '../global'

export interface GetProductParams {
  quantity: number;
  reference_id: string;
}

export interface AddToCartParams {
  item: CreateCartProduct;
  operation: CartOperation;
}

export interface GetProductResponse {
  product: SingleProductPageProduct;
  delivery: Nullable<QuotationPayload>;
}

export interface DeliveryQuotationBody {
  cep: string;
  reference_id: string;
}

export type QuotationResponseType = 'locationlist' | 'quotation';

export interface QuotationResponse <T extends QuotationResponseType, K> {
  type: T;
  data: K;
}

export interface LocationCoords <T = number> {
  lat: T;
  lng: T;
}

export interface LocationList {
  formatted_address: string;
  location: LocationCoords;
}

export interface QuotationPayload {
  /**
   * String indicando data e hora do momento máximo de validade da cotação
   */
  expires_at: string;
  /**
   * Valor retornado pela cotação reprensentado por um inteiro
   */
  total: number;
}

export type LocationResponse = QuotationResponse<'locationlist', LocationList[]>;

export type QuotationPrice = QuotationResponse<'quotation', QuotationPayload>;


