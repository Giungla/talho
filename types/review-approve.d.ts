
export type ReviewAction = 'approve' | 'reject';

export interface ReviewParams {
  reviewId: number;
  action: ReviewAction;
}

export interface ReviewDetails {
  /**
   * Indica se a avaliação já foi ou não aprovada
   */
  is_approved: boolean;
  /**
   * Texto curto com as informações da avaliação
   */
  text: string;
}

export interface ReviewResponse {
  message: string;
}
