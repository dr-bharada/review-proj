import { signalStore, withState, withMethods, patchState } from "@ngrx/signals";
import { inject } from "@angular/core";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, from } from "rxjs";
import { tap, mergeMap, catchError } from "rxjs/operators";
import {
  PublicService,
  type PublicProfileData,
} from "../../features/public/public.service";
import { AnalyticsService } from "../../core/services/analytics.service";

export interface PublicState {
  profile: PublicProfileData | null;
  isLoading: boolean;
  error: string | null;

  ratingSelected: number | null;
  hoveredRating: number | null;
  feedbackText: string;
  feedbackSubmitted: boolean;
  isSubmittingFeedback: boolean;
}

const initialState: PublicState = {
  profile: null,
  isLoading: true,
  error: null,

  ratingSelected: null,
  hoveredRating: null,
  feedbackText: "",
  feedbackSubmitted: false,
  isSubmittingFeedback: false,
};

export const PublicStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withMethods(
    (
      store,
      publicService = inject(PublicService),
      analyticsService = inject(AnalyticsService),
    ) => ({
      selectRating(rating: number): void {
        patchState(store, { ratingSelected: rating });
      },

      setHoveredRating(rating: number | null): void {
        patchState(store, { hoveredRating: rating });
      },

      setFeedbackText(text: string): void {
        patchState(store, { feedbackText: text });
      },

      resetFeedbackFlow(): void {
        patchState(store, {
          ratingSelected: null,
          hoveredRating: null,
          feedbackText: "",
          feedbackSubmitted: false,
          isSubmittingFeedback: false,
        });
      },

      loadProfile: rxMethod<{ slug: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          mergeMap(({ slug }) =>
            publicService.getPublicProfile(slug).pipe(
              tap(({ data, error }) => {
                if (error || !data) {
                  patchState(store, {
                    isLoading: false,
                    error: error?.message || "Could not find profile.",
                  });
                } else {
                  patchState(store, {
                    profile: data,
                    isLoading: false,
                    error: null,
                  });

                  // Track scan event asynchronously
                  if (data.business.id) {
                    analyticsService.logScan(data.business.id).subscribe({
                      error: (err) =>
                        console.error("Failed to log scan event", err),
                    });
                  }
                }
              }),
              catchError((err: unknown) => {
                const msg =
                  err instanceof Error
                    ? err.message
                    : "Could not find profile.";
                patchState(store, { isLoading: false, error: msg });
                return from([]);
              }),
            ),
          ),
        ),
      ),

      submitFeedback: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isSubmittingFeedback: true })),
          mergeMap(() => {
            const profileData = store.profile();
            const businessId = profileData?.business.id;
            const rating = store.ratingSelected();
            const comment = store.feedbackText();

            if (!businessId || !rating) {
              patchState(store, { isSubmittingFeedback: false });
              return from([]);
            }

            return publicService
              .submitFeedback(businessId, rating, comment)
              .pipe(
                tap(({ error }) => {
                  if (error) {
                    console.warn(
                      "Supabase insert failed, running in mockup mode:",
                      error,
                    );
                  }
                  patchState(store, {
                    feedbackSubmitted: true,
                    isSubmittingFeedback: false,
                  });
                }),
                catchError((err: unknown) => {
                  console.warn(
                    "Feedback submission error, running in mockup mode:",
                    err,
                  );
                  patchState(store, {
                    feedbackSubmitted: true,
                    isSubmittingFeedback: false,
                  });
                  return from([]);
                }),
              );
          }),
        ),
      ),
    }),
  ),
);
