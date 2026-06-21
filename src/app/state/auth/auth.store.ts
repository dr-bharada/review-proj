import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from "@ngrx/signals";
import { inject, computed } from "@angular/core";
import { Router } from "@angular/router";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, from } from "rxjs";
import { tap, mergeMap, catchError } from "rxjs/operators";
import type { User, Session } from "@supabase/supabase-js";
import { AuthService } from "../../core/auth/auth.service";
import { SupabaseService } from "../../core/services/supabase.service";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoaded: false,
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed((state) => ({
    isAuthenticated: computed(() => state.user() !== null),
  })),
  withMethods(
    (store, authService = inject(AuthService), router = inject(Router)) => ({
      setSession(user: User | null, session: Session | null): void {
        patchState(store, {
          user,
          session,
          isLoaded: true,
          isLoading: false,
          error: null,
        });
      },

      login: rxMethod<{ email: string; password: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          mergeMap(({ email, password }) =>
            authService.signIn(email, password).pipe(
              tap(({ data, error }) => {
                if (error) {
                  patchState(store, { isLoading: false, error: error.message });
                } else if (data.user && data.session) {
                  patchState(store, {
                    user: data.user,
                    session: data.session,
                    isLoading: false,
                    error: null,
                  });
                  router.navigate(["/dashboard"]);
                } else {
                  patchState(store, {
                    isLoading: false,
                    error: "Failed to retrieve session details.",
                  });
                }
              }),
              catchError((err: unknown) => {
                const errorMessage =
                  err instanceof Error ? err.message : "Login failed";
                patchState(store, { isLoading: false, error: errorMessage });
                return from([]);
              }),
            ),
          ),
        ),
      ),

      signup: rxMethod<{ email: string; password: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          mergeMap(({ email, password }) =>
            authService.signUp(email, password).pipe(
              tap(({ data, error }) => {
                if (error) {
                  patchState(store, { isLoading: false, error: error.message });
                } else if (data.user) {
                  patchState(store, { isLoading: false, error: null });
                } else {
                  patchState(store, {
                    isLoading: false,
                    error: "Signup failed to return user.",
                  });
                }
              }),
              catchError((err: unknown) => {
                const errorMessage =
                  err instanceof Error ? err.message : "Signup failed";
                patchState(store, { isLoading: false, error: errorMessage });
                return from([]);
              }),
            ),
          ),
        ),
      ),

      logout: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          mergeMap(() =>
            authService.signOut().pipe(
              tap(({ error }) => {
                if (error) {
                  patchState(store, { isLoading: false, error: error.message });
                } else {
                  patchState(store, {
                    user: null,
                    session: null,
                    isLoading: false,
                    error: null,
                  });
                  router.navigate(["/auth/login"]);
                }
              }),
              catchError((err: unknown) => {
                const errorMessage =
                  err instanceof Error ? err.message : "Logout failed";
                patchState(store, { isLoading: false, error: errorMessage });
                return from([]);
              }),
            ),
          ),
        ),
      ),

      updatePassword: rxMethod<{ password: string }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          mergeMap(({ password }) =>
            authService.updateUserPassword(password).pipe(
              tap(({ error }) => {
                if (error) {
                  patchState(store, { isLoading: false, error: error.message });
                } else {
                  patchState(store, { isLoading: false, error: null });
                }
              }),
              catchError((err: unknown) => {
                const errorMessage =
                  err instanceof Error ? err.message : "Update password failed";
                patchState(store, { isLoading: false, error: errorMessage });
                return from([]);
              }),
            ),
          ),
        ),
      ),
    }),
  ),
  withHooks({
    onInit(store, supabaseService = inject(SupabaseService)) {
      // Fetch initial session status on load
      supabaseService.supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          store.setSession(session?.user ?? null, session);
        })
        .catch(() => {
          store.setSession(null, null);
        });

      // Listen to changes in authentication state
      supabaseService.supabase.auth.onAuthStateChange((_event, session) => {
        store.setSession(session?.user ?? null, session);
      });
    },
  }),
);
