import { signalStore, withState, withMethods, patchState } from "@ngrx/signals";
import { inject } from "@angular/core";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, from } from "rxjs";
import { tap, mergeMap, catchError, timeout } from "rxjs/operators";
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
          tap(() => {
            patchState(store, { isLoading: true, error: null });
          }),
          mergeMap(({ slug }) => {
            const lowerSlug = slug.toLowerCase();
            if (
              lowerSlug === "mock" ||
              lowerSlug === "test" ||
              lowerSlug === "demo"
            ) {
              const mockData: PublicProfileData = {
                business: {
                  id: "mock-business-id",
                  owner_id: "mock-owner-id",
                  business_name: "ReviewBoost Cafe",
                  category: "Gourmet Cafe & Bistro",
                  phone_number: "+1 (555) 019-2834",
                  address: "123 Premium Tech Boulevard, San Francisco, CA",
                  logo_url: "",
                  subscription_plan: "starter",
                  created_at: new Date().toISOString(),
                },
                links: [
                  {
                    id: "link-google",
                    business_id: "mock-business-id",
                    platform_name: "google",
                    platform_url: "https://google.com",
                    is_enabled: true,
                    created_at: new Date().toISOString(),
                  },
                  {
                    id: "link-yelp",
                    business_id: "mock-business-id",
                    platform_name: "yelp",
                    platform_url: "https://yelp.com",
                    is_enabled: true,
                    created_at: new Date().toISOString(),
                  },
                  {
                    id: "link-tripadvisor",
                    business_id: "mock-business-id",
                    platform_name: "tripadvisor",
                    platform_url: "https://tripadvisor.com",
                    is_enabled: true,
                    created_at: new Date().toISOString(),
                  },
                ],
              };
              patchState(store, {
                profile: mockData,
                isLoading: false,
                error: null,
              });
              return from([]);
            }

            return publicService.getPublicProfile(slug).pipe(
              tap(({ data, error }) => {
                if (error || !data) {
                  console.error(
                    "[PublicStore] Supabase profile fetch failed:",
                    error,
                  );
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
              timeout(4000),
              catchError((err: unknown) => {
                const msg =
                  err instanceof Error
                    ? err.message
                    : "Could not find profile.";
                patchState(store, { isLoading: false, error: msg });
                return from([]);
              }),
            );
          }),
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
