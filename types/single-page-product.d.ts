
import type {
  CartOperation,
  CreateCartProduct
} from '../global'

export interface GetProductParams {
  quantity: number;
  reference_id: string;
}

export interface AddToCartParams {
  item: CreateCartProduct;
  operation: CartOperation;
}
