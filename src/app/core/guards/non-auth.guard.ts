import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AuthStore } from '../../state/auth/auth.store';

/**
 * Guards auth routes (login/signup). Redirects already-authenticated users
 * to the dashboard. Waits for auth state to resolve before redirecting.
 */
export const nonAuthGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const isLoaded$ = toObservable(authStore.isLoaded);
  const isAuthenticated$ = toObservable(authStore.isAuthenticated);

  return isLoaded$.pipe(
    filter(isLoaded => isLoaded),
    take(1),
    switchMap(() => isAuthenticated$.pipe(take(1))),
    map(isAuthenticated => {
      if (!isAuthenticated) return true;
      return router.createUrlTree(['/dashboard']);
    })
  );
};
