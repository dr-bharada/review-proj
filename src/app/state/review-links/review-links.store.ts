import { Injectable, inject, signal, computed } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe } from "rxjs";
import { switchMap, mergeMap } from "rxjs/operators";
import type { ReviewLink } from "../../core/models/review-link.model";
import { ReviewLinksService } from "../../features/review-links/review-links.service";

export interface ReviewLinksState {
  links: ReviewLink[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: ReviewLinksState = {
  links: [],
  isLoading: false,
  isSaving: false,
  error: null,
};

@Injectable({ providedIn: "root" })
export class ReviewLinksStore {
  private readonly reviewLinksService = inject(ReviewLinksService);

  // ── Single state signal ───────────────────────────────────────────────
  readonly state = signal<ReviewLinksState>(initialState);

  // ── Derived selectors ─────────────────────────────────────────────────
  readonly links = computed(() => this.state().links);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly isSaving = computed(() => this.state().isSaving);
  readonly error = computed(() => this.state().error);

  // ── Public methods ────────────────────────────────────────────────────
  readonly loadLinks = rxMethod<{ businessId: string }>(
    pipe(
      switchMap((params) => {
        this.state.update((s) => ({ ...s, isLoading: true, error: null }));
        return this.reviewLinksService.getReviewLinks(params.businessId).pipe(
          tapResponse({
            next: ({ data, error }) => {
              if (error) {
                this.state.update((s) => ({
                  ...s,
                  error: error.message || "Failed to load review links",
                }));
              } else {
                this.state.update((s) => ({
                  ...s,
                  links: data || [],
                }));
              }
            },
            error: (err: unknown) => {
              this.state.update((s) => ({
                ...s,
                error:
                  err instanceof Error
                    ? err.message
                    : "Failed to load review links",
              }));
            },
            finalize: () => {
              this.state.update((s) => ({ ...s, isLoading: false }));
            },
          })
        );
      })
    )
  );

  readonly addLink = rxMethod<{ link: ReviewLink; onSuccess?: () => void }>(
    pipe(
      mergeMap((params) => {
        this.state.update((s) => ({ ...s, isSaving: true, error: null }));
        return this.reviewLinksService.addReviewLink(params.link).pipe(
          tapResponse({
            next: ({ data, error }) => {
              if (error) {
                this.state.update((s) => ({
                  ...s,
                  error: error.message || "Failed to add review link",
                }));
              } else if (data) {
                this.state.update((s) => ({
                  ...s,
                  links: [...s.links, data],
                }));
                if (params.onSuccess) params.onSuccess();
              } else {
                this.state.update((s) => ({
                  ...s,
                  error: "Failed to retrieve added link",
                }));
              }
            },
            error: (err: unknown) => {
              this.state.update((s) => ({
                ...s,
                error:
                  err instanceof Error
                    ? err.message
                    : "Failed to add review link",
              }));
            },
            finalize: () => {
              this.state.update((s) => ({ ...s, isSaving: false }));
            },
          })
        );
      })
    )
  );

  readonly updateLink = rxMethod<{
    id: string;
    updates: Partial<ReviewLink>;
    onSuccess?: () => void;
  }>(
    pipe(
      mergeMap((params) => {
        this.state.update((s) => ({ ...s, isSaving: true, error: null }));
        return this.reviewLinksService
          .updateReviewLink(params.id, params.updates)
          .pipe(
            tapResponse({
              next: ({ data, error }) => {
                if (error) {
                  this.state.update((s) => ({
                    ...s,
                    error: error.message || "Failed to update review link",
                  }));
                } else if (data) {
                  this.state.update((s) => ({
                    ...s,
                    links: s.links.map((l) => (l.id === data.id ? data : l)),
                  }));
                  if (params.onSuccess) params.onSuccess();
                } else {
                  this.state.update((s) => ({
                    ...s,
                    error: "Failed to retrieve updated link",
                  }));
                }
              },
              error: (err: unknown) => {
                this.state.update((s) => ({
                  ...s,
                  error:
                    err instanceof Error
                      ? err.message
                      : "Failed to update review link",
                }));
              },
              finalize: () => {
                this.state.update((s) => ({ ...s, isSaving: false }));
              },
            })
          );
      })
    )
  );

  readonly deleteLink = rxMethod<{ id: string }>(
    pipe(
      mergeMap((params) => {
        this.state.update((s) => ({ ...s, isSaving: true, error: null }));
        return this.reviewLinksService.deleteReviewLink(params.id).pipe(
          tapResponse({
            next: ({ error }) => {
              if (error) {
                this.state.update((s) => ({
                  ...s,
                  error: error.message || "Failed to delete review link",
                }));
              } else {
                this.state.update((s) => ({
                  ...s,
                  links: s.links.filter((l) => l.id !== params.id),
                }));
              }
            },
            error: (err: unknown) => {
              this.state.update((s) => ({
                ...s,
                error:
                  err instanceof Error
                    ? err.message
                    : "Failed to delete review link",
              }));
            },
            finalize: () => {
              this.state.update((s) => ({ ...s, isSaving: false }));
            },
          })
        );
      })
    )
  );
}
