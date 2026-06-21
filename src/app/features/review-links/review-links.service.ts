import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import type { PostgrestError } from '@supabase/supabase-js';
import type { ReviewLink } from '../../core/models/review-link.model';
import { from, of, type Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReviewLinksService {
  private supabaseService = inject(SupabaseService);

  // Fetch all review links connected to a specific business ID
  getReviewLinks(businessId: string): Observable<{ data: ReviewLink[] | null; error: PostgrestError | Error | null }> {
    return from(
      this.supabaseService.supabase
        .from('review_links')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => ({ data: data as ReviewLink[] | null, error })),
      catchError((err: unknown) =>
        of({ data: null, error: err instanceof Error ? err : new Error(String(err)) })
      )
    );
  }

  // Add a new review link
  addReviewLink(link: ReviewLink): Observable<{ data: ReviewLink | null; error: PostgrestError | Error | null }> {
    return from(
      this.supabaseService.supabase
        .from('review_links')
        .insert(link)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => ({ data: data as ReviewLink | null, error })),
      catchError((err: unknown) =>
        of({ data: null, error: err instanceof Error ? err : new Error(String(err)) })
      )
    );
  }

  // Update an existing review link (url, enabled status, etc.)
  updateReviewLink(id: string, updates: Partial<ReviewLink>): Observable<{ data: ReviewLink | null; error: PostgrestError | Error | null }> {
    return from(
      this.supabaseService.supabase
        .from('review_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => ({ data: data as ReviewLink | null, error })),
      catchError((err: unknown) =>
        of({ data: null, error: err instanceof Error ? err : new Error(String(err)) })
      )
    );
  }

  // Delete a review link
  deleteReviewLink(id: string): Observable<{ error: PostgrestError | Error | null }> {
    return from(
      this.supabaseService.supabase
        .from('review_links')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => ({ error })),
      catchError((err: unknown) =>
        of({ error: err instanceof Error ? err : new Error(String(err)) })
      )
    );
  }
}

