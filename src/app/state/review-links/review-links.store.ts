import { signalStore, withState, withMethods, patchState } from "@ngrx/signals";
import { inject } from "@angular/core";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, from } from "rxjs";
import { tap, mergeMap, catchError } from "rxjs/operators";
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

export const ReviewLinksStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withMethods((store, reviewLinksService = inject(ReviewLinksService)) => ({
    loadLinks: rxMethod<{ businessId: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        mergeMap(({ businessId }) =>
          reviewLinksService.getReviewLinks(businessId).pipe(
            tap(({ data, error }) => {
              if (error) {
                patchState(store, {
                  isLoading: false,
                  error: error.message || "Failed to load review links",
                });
              } else {
                patchState(store, {
                  links: data || [],
                  isLoading: false,
                  error: null,
                });
              }
            }),
            catchError((err: unknown) => {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "Failed to load review links";
              patchState(store, { isLoading: false, error: errorMessage });
              return from([]);
            }),
          ),
        ),
      ),
    ),

    addLink: rxMethod<{ link: ReviewLink }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        mergeMap(({ link }) =>
          reviewLinksService.addReviewLink(link).pipe(
            tap(({ data, error }) => {
              if (error) {
                patchState(store, {
                  isSaving: false,
                  error: error.message || "Failed to add review link",
                });
              } else if (data) {
                const currentLinks = store.links();
                patchState(store, {
                  links: [...currentLinks, data],
                  isSaving: false,
                  error: null,
                });
              } else {
                patchState(store, {
                  isSaving: false,
                  error: "Failed to retrieve added link",
                });
              }
            }),
            catchError((err: unknown) => {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "Failed to add review link";
              patchState(store, { isSaving: false, error: errorMessage });
              return from([]);
            }),
          ),
        ),
      ),
    ),

    updateLink: rxMethod<{ id: string; updates: Partial<ReviewLink> }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        mergeMap(({ id, updates }) =>
          reviewLinksService.updateReviewLink(id, updates).pipe(
            tap(({ data, error }) => {
              if (error) {
                patchState(store, {
                  isSaving: false,
                  error: error.message || "Failed to update review link",
                });
              } else if (data) {
                const currentLinks = store.links();
                patchState(store, {
                  links: currentLinks.map((l) => (l.id === data.id ? data : l)),
                  isSaving: false,
                  error: null,
                });
              } else {
                patchState(store, {
                  isSaving: false,
                  error: "Failed to retrieve updated link",
                });
              }
            }),
            catchError((err: unknown) => {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "Failed to update review link";
              patchState(store, { isSaving: false, error: errorMessage });
              return from([]);
            }),
          ),
        ),
      ),
    ),

    deleteLink: rxMethod<{ id: string }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        mergeMap(({ id }) =>
          reviewLinksService.deleteReviewLink(id).pipe(
            tap(({ error }) => {
              if (error) {
                patchState(store, {
                  isSaving: false,
                  error: error.message || "Failed to delete review link",
                });
              } else {
                const currentLinks = store.links();
                patchState(store, {
                  links: currentLinks.filter((l) => l.id !== id),
                  isSaving: false,
                  error: null,
                });
              }
            }),
            catchError((err: unknown) => {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "Failed to delete review link";
              patchState(store, { isSaving: false, error: errorMessage });
              return from([]);
            }),
          ),
        ),
      ),
    ),
  })),
);
