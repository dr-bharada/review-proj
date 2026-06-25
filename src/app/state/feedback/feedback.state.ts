import type { Feedback } from "../../core/models/feedback.model";

export interface FeedbackState {
  feedbacks: Feedback[];
  isLoading: boolean;
  error: string | null;
}

export const initialState: FeedbackState = {
  feedbacks: [],
  isLoading: false,
  error: null,
};
