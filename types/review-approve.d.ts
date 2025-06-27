
export type ReviewAction = 'approve' | 'reject';

export interface ReviewParams {
  review_id: number;
  action: ReviewAction;
}

export interface ReviewResponse {
  message: string;
}
