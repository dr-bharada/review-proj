import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import type { PostgrestError } from '@supabase/supabase-js';
import type { StorageError } from '@supabase/storage-js';
import type { Business } from '../../core/models/business.model';
import { from, of, type Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private supabaseService = inject(SupabaseService);

  // Fetch the business profile owned by the authenticated user
  getBusinessProfile(): Observable<{ data: Business | null; error: PostgrestError | Error | null }> {
    return from(this.supabaseService.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error: userError }) => {
        if (userError || !user) {
          return of({ data: null, error: userError || new Error('No authenticated user found') });
        }

        return from(
          this.supabaseService.supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle()
        ).pipe(
          map(({ data, error }) => ({ data: data as Business | null, error }))
        );
      }),
      catchError((err: unknown) =>
        of({ data: null, error: err instanceof Error ? err : new Error(String(err)) })
      )
    );
  }

  // Create or update the business profile
  upsertBusinessProfile(business: Business): Observable<{ data: Business | null; error: PostgrestError | Error | null }> {
    return from(this.supabaseService.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error: userError }) => {
        if (userError || !user) {
          return of({ data: null, error: userError || new Error('No authenticated user found') });
        }

        const { id, ...rest } = business;
        const profileToUpsert = {
          ...rest,
          owner_id: user.id,
          ...(id ? { id } : {})
        };

        return from(
          this.supabaseService.supabase
            .from('businesses')
            .upsert(profileToUpsert)
            .select()
            .single()
        ).pipe(
          map(({ data, error }) => ({ data: data as Business | null, error }))
        );
      }),
      catchError((err: unknown) =>
        of({ data: null, error: err instanceof Error ? err : new Error(String(err)) })
      )
    );
  }

  // Upload a logo to the 'logos' Supabase Storage bucket
  uploadLogo(file: File): Observable<{ publicUrl: string | null; error: StorageError | Error | null }> {
    return from(this.supabaseService.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error: userError }) => {
        if (userError || !user) {
          return of({ publicUrl: null, error: userError || new Error('No authenticated user') });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `logos/${user.id}/${fileName}`;

        return from(
          this.supabaseService.supabase.storage
            .from('review')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            })
        ).pipe(
          switchMap(({ error: uploadError }) => {
            if (uploadError) {
              return of({ publicUrl: null, error: uploadError });
            }

            const { data } = this.supabaseService.supabase.storage
              .from('review')
              .getPublicUrl(filePath);

            return of({ publicUrl: data.publicUrl, error: null });
          })
        );
      }),
      catchError((err: unknown) =>
        of({ publicUrl: null, error: err instanceof Error ? err : new Error(String(err)) })
      )
    );
  }
}

