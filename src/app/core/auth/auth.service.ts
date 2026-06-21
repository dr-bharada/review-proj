import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../services/supabase.service";
import type { User, AuthResponse, AuthError } from "@supabase/supabase-js";
import { from, type Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private supabaseService = inject(SupabaseService);

  // Sign up a new user with email and password
  signUp(email: string, password: string): Observable<AuthResponse> {
    return from(
      this.supabaseService.supabase.auth.signUp({
        email,
        password,
      }),
    );
  }

  // Log in using email and password
  signIn(email: string, password: string): Observable<AuthResponse> {
    return from(
      this.supabaseService.supabase.auth.signInWithPassword({
        email,
        password,
      }),
    );
  }

  // Sign out the current user
  signOut(): Observable<{ error: AuthError | null }> {
    return from(this.supabaseService.supabase.auth.signOut());
  }

  // Request a password reset email
  resetPasswordForEmail(
    email: string,
    redirectTo: string,
  ): Observable<{ data: Record<string, never>; error: AuthError | null }> {
    return from(
      this.supabaseService.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      }) as Promise<{
        data: Record<string, never>;
        error: AuthError | null;
      }>,
    );
  }

  // Set a new password for the current user session
  updateUserPassword(password: string): Observable<UserResponseMock> {
    return from(
      this.supabaseService.supabase.auth.updateUser({
        password,
      }) as Promise<UserResponseMock>,
    );
  }
}

// Minimal interface for Supabase Update User Response
interface UserResponseMock {
  data: { user: User | null };
  error: AuthError | null;
}
