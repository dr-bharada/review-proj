import { Injectable } from "@angular/core";
import {
  createClient,
  type SupabaseClient,
  type PostgrestError,
} from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { from, of, type Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

export interface AnalyticsEvent {
  id?: string;
  business_id: string;
  platform_name: string; // matches DB column: analytics_events.platform_name
  event_type: "click" | "scan";
  created_at?: string;
}

export interface PlatformStat {
  platform: string;
  count: number;
}

export interface AnalyticsData {
  stats: PlatformStat[];
  totalClicks: number;
  totalScans: number;
}

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
    );
  }

  logClick(
    businessId: string,
    platformName: string,
  ): Observable<{ error: PostgrestError | Error | null }> {
    return from(
      this.supabase.from("analytics_events").insert([
        {
          business_id: businessId,
          platform_name: platformName,
          event_type: "click",
        },
      ]),
    ).pipe(
      map(({ error }) => ({ error })),
      catchError((error: unknown) =>
        of({
          error: error instanceof Error ? error : new Error(String(error)),
        }),
      ),
    );
  }

  logScan(
    businessId: string,
  ): Observable<{ error: PostgrestError | Error | null }> {
    return from(
      this.supabase.from("analytics_events").insert([
        {
          business_id: businessId,
          event_type: "scan",
        },
      ]),
    ).pipe(
      map(({ error }) => ({ error })),
      catchError((error: unknown) =>
        of({
          error: error instanceof Error ? error : new Error(String(error)),
        }),
      ),
    );
  }

  getAnalyticsStats(businessId: string): Observable<{
    data: AnalyticsData | null;
    error: PostgrestError | Error | null;
  }> {
    return from(
      this.supabase
        .from("analytics_events")
        .select("event_type, platform_name")
        .eq("business_id", businessId),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return { data: null, error };
        }

        let totalClicks = 0;
        let totalScans = 0;
        const counts: Record<string, number> = {};

        data?.forEach((row) => {
          const type = row["event_type"] as "click" | "scan";
          if (type === "scan") {
            totalScans++;
          } else if (type === "click") {
            totalClicks++;
            const name = row["platform_name"] as string;
            if (name) {
              counts[name] = (counts[name] || 0) + 1;
            }
          }
        });

        const stats: PlatformStat[] = Object.entries(counts)
          .map(([platform, count]) => ({ platform, count }))
          .sort((a, b) => b.count - a.count);

        return {
          data: {
            stats,
            totalClicks,
            totalScans,
          },
          error: null,
        };
      }),
      catchError((error: unknown) =>
        of({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        }),
      ),
    );
  }
}
