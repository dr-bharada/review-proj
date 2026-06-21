import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AuthStore } from '../../state/auth/auth.store';

/**
 * Guards protected routes. Waits for auth state to be loaded from Supabase
 * before making a redirect decision — avoids flash redirects on refresh.
 */
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const isLoaded$ = toObservable(authStore.isLoaded);
  const isAuthenticated$ = toObservable(authStore.isAuthenticated);

  return isLoaded$.pipe(
    filter(isLoaded => isLoaded),       // wait until session is resolved
    take(1),
    switchMap(() => isAuthenticated$.pipe(take(1))),
    map(isAuthenticated => {
      if (isAuthenticated) return true;
      return router.createUrlTree(['/auth/login']);
    })
  );
};
