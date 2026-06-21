import { signalStore, withState, withMethods, patchState } from "@ngrx/signals";
import { inject } from "@angular/core";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, from } from "rxjs";
import { tap, mergeMap, catchError } from "rxjs/operators";
import type { Business } from "../../core/models/business.model";
import { BusinessService } from "../../features/business/business.service";

export interface BusinessState {
  profile: Business | null;
  isLoading: boolean;
  isSaving: boolean;
  isUploadingLogo: boolean;
  error: string | null;
  success: boolean;
}

const initialState: BusinessState = {
  profile: null,
  isLoading: false,
  isSaving: false,
  isUploadingLogo: false,
  error: null,
  success: false,
};

export const BusinessStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withMethods((store, businessService = inject(BusinessService)) => ({
    clearBusinessSuccess(): void {
      patchState(store, { success: false });
    },

    setError(error: string | null): void {
      patchState(store, { error });
    },

    loadBusiness: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        mergeMap(() =>
          businessService.getBusinessProfile().pipe(
            tap(({ data, error }) => {
              if (error) {
                patchState(store, {
                  isLoading: false,
                  error: error.message || "Failed to load business profile",
                });
              } else {
                patchState(store, {
                  profile: data,
                  isLoading: false,
                  error: null,
                });
              }
            }),
            catchError((err: unknown) => {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "Failed to load business profile";
              patchState(store, { isLoading: false, error: errorMessage });
              return from([]);
            }),
          ),
        ),
      ),
    ),

    upsertBusiness: rxMethod<{ profile: Business }>(
      pipe(
        tap(() =>
          patchState(store, { isSaving: true, error: null, success: false }),
        ),
        mergeMap(({ profile }) =>
          businessService.upsertBusinessProfile(profile).pipe(
            tap(({ data, error }) => {
              if (error) {
                patchState(store, {
                  isSaving: false,
                  error: error.message || "Failed to save business profile",
                  success: false,
                });
              } else if (data) {
                patchState(store, {
                  profile: data,
                  isSaving: false,
                  error: null,
                  success: true,
                });
              } else {
                patchState(store, {
                  isSaving: false,
                  error: "Upsert did not return any data",
                  success: false,
                });
              }
            }),
            catchError((err: unknown) => {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "Failed to save business profile";
              patchState(store, {
                isSaving: false,
                error: errorMessage,
                success: false,
              });
              return from([]);
            }),
          ),
        ),
      ),
    ),

    uploadLogo: rxMethod<{ file: File }>(
      pipe(
        tap(() => patchState(store, { isUploadingLogo: true, error: null })),
        mergeMap(({ file }) =>
          businessService.uploadLogo(file).pipe(
            mergeMap(({ publicUrl, error }) => {
              if (error) {
                patchState(store, {
                  isUploadingLogo: false,
                  error: error.message || "Failed to upload logo",
                });
                return from([]);
              }

              if (!publicUrl) {
                patchState(store, {
                  isUploadingLogo: false,
                  error: "Upload did not return a public URL",
                });
                return from([]);
              }

              // Update in-memory state immediately so UI reflects the new logo
              const currentProfile = store.profile();
              const updatedProfile = currentProfile
                ? { ...currentProfile, logo_url: publicUrl }
                : null;

              patchState(store, { profile: updatedProfile });

              // Persist the new logo_url to the database
              if (!updatedProfile) {
                patchState(store, { isUploadingLogo: false });
                return from([]);
              }

              return businessService.upsertBusinessProfile(updatedProfile).pipe(
                tap(({ data, error: upsertError }) => {
                  if (upsertError) {
                    patchState(store, {
                      isUploadingLogo: false,
                      error:
                        upsertError.message ||
                        "Logo uploaded but failed to save profile",
                    });
                  } else {
                    patchState(store, {
                      profile: data ?? updatedProfile,
                      isUploadingLogo: false,
                      error: null,
                    });
                  }
                }),
              );
            }),
            catchError((err: unknown) => {
              const errorMessage =
                err instanceof Error ? err.message : "Failed to upload logo";
              patchState(store, {
                isUploadingLogo: false,
                error: errorMessage,
              });
              return from([]);
            }),
          ),
        ),
      ),
    ),
  })),
);
