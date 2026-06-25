import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { FeedbackService } from "../../features/feedback/feedback.service";
import { type FeedbackState, initialState } from "./feedback.state";

@Injectable({ providedIn: "root" })
export class FeedbackStore {
  private readonly feedbackService = inject(FeedbackService);

  // ── Single state signal ───────────────────────────────────────────────
  readonly state = signal<FeedbackState>(initialState);

  // ── Derived selectors ─────────────────────────────────────────────────
  readonly feedbacks = computed(() => this.state().feedbacks);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error     = computed(() => this.state().error);

  // ── Trigger signals ───────────────────────────────────────────────────
  private readonly loadTrigger = signal<string | null>(null);

  constructor() {
    // Effect: fires when loadTrigger changes
    effect(() => {
      const businessId = this.loadTrigger();
      if (!businessId) return;

      this.state.update((s) => ({ ...s, isLoading: true, error: null }));

      this.feedbackService.getFeedbacks(businessId).subscribe({
        next: ({ data, error }) => {
          if (error) {
            this.state.update((s) => ({
              ...s,
              isLoading: false,
              error: error.message || "Failed to load private feedback",
            }));
          } else {
            this.state.update((s) => ({
              ...s,
              feedbacks: data || [],
              isLoading: false,
            }));
          }
        },
        error: (err: unknown) =>
          this.state.update((s) => ({
            ...s,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load private feedback",
          })),
      });
    });
  }

  // ── Public methods ────────────────────────────────────────────────────
  loadFeedbacks(businessId: string): void {
    this.loadTrigger.set(businessId);
  }

  reset(): void {
    this.state.set(initialState);
  }
}
