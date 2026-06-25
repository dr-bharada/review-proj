import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../core/services/supabase.service";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Feedback } from "../../core/models/feedback.model";
import { from, of, type Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class FeedbackService {
  private supabaseService = inject(SupabaseService);

  // Fetch all private feedbacks for a specific business ID, ordered by newest first
  getFeedbacks(
    businessId: string,
  ): Observable<{
    data: Feedback[] | null;
    error: PostgrestError | Error | null;
  }> {
    return from(
      this.supabaseService.supabase
        .from("private_feedbacks")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
    ).pipe(
      map(({ data, error }) => ({ data: data as Feedback[] | null, error })),
      catchError((err: unknown) =>
        of({
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
        }),
      ),
    );
  }
}
