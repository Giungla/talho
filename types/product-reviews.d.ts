
import type {
  IPaginateSchema,
  Nullable
} from "../global"

import type { ProductReview } from "./user-orders"

export interface Review {
  /**
   * Lista de avaliaçôes capturadas
   */
  response: Nullable<ReviewResponse>;
}

export interface ReviewGetters {
  /**
   * Indica se existem reviews
   */
  hasReviews: boolean;
  /**
   * Quantidade de reviews capturadas
   */
  reviewsCount: number;
}

export type ReviewProxy = Review & Readonly<ReviewGetters>;

export type ReviewProperties = keyof ReviewProxy;

export interface SingleReview extends ProductReview {
  /**
   * Data em que a review for escrita
   */
  created_at: string;
  /**
   * Nome do usuário que forneceu a review
   */
  name: string;
}

export interface ReviewResponse {
  /**
   * Quantidade de avaliaçôes que o produto possui
   */
  count: number;
  /**
   * Média das avaliaçôes fornecidas pelo cliente
   */
  average: number;
  /**
   * Lista paginada das avaliaçôes capturadas e aprovadas para esse produto
   */
  reviews: IPaginateSchema<SingleReview>;
}
