import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { QrCode } from '../../core/models/qr-code.model';
import { from, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  getQrCode(businessId: string): Observable<QrCode | null> {
    return from(
      this.supabase
        .from('qr_codes')
        .select('*')
        .eq('business_id', businessId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        return data;
      })
    );
  }

  claimSlug(businessId: string, slug: string): Observable<QrCode> {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    if (!cleanSlug) {
      throw new Error('Invalid slug');
    }

    return from(
      this.supabase
        .from('qr_codes')
        .insert({ business_id: businessId, slug: cleanSlug })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === '23505') { // PostgreSQL unique violation code
            throw new Error('This slug is already taken. Please try another one.');
          }
          throw error;
        }
        return data;
      })
    );
  }
}

