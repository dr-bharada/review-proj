import { Injectable } from "@angular/core";
import {
  createClient,
  type SupabaseClient,
  type PostgrestError,
} from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import type { Business } from "../../core/models/business.model";
import type { ReviewLink } from "../../core/models/review-link.model";
import { from, of, forkJoin, type Observable } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";

export interface PublicProfileData {
  business: Business;
  links: ReviewLink[];
}

@Injectable({
  providedIn: "root",
})
export class PublicService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
    );
  }

  getPublicProfile(slug: string): Observable<{
    data: PublicProfileData | null;
    error: PostgrestError | Error | null;
  }> {
    // 1. Resolve slug to business_id
    return from(
      this.supabase
        .from("qr_codes")
        .select("business_id")
        .eq("slug", slug)
        .single(),
    ).pipe(
      switchMap(({ data: qrData, error: qrError }) => {
        if (qrError || !qrData) {
          return of({
            data: null,
            error: qrError || new Error("Profile not found"),
          });
        }

        const businessId = qrData.business_id;

        // 2. Fetch business and active review links in parallel
        return forkJoin({
          businessRes: from(
            this.supabase
              .from("businesses")
              .select("*")
              .eq("id", businessId)
              .single(),
          ),
          linksRes: from(
            this.supabase
              .from("review_links")
              .select("*")
              .eq("business_id", businessId)
              .eq("is_enabled", true)
              .order("platform_name", { ascending: true }),
          ),
        }).pipe(
          map(({ businessRes, linksRes }) => {
            if (businessRes.error) {
              return { data: null, error: businessRes.error };
            }

            return {
              data: {
                business: businessRes.data as Business,
                links: (linksRes.data || []) as ReviewLink[],
              },
              error: null,
            };
          }),
        );
      }),
      catchError((err: unknown) => {
        return of({
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }),
    );
  }
}
