import {
  Component,
  signal,
  computed,
  input,
  inject,
  type OnInit,
  type OnDestroy,
} from "@angular/core";
import {
  Subject,
  EMPTY,
  switchMap,
  tap,
  catchError,
  takeUntil,
} from "rxjs";
import {
  AnalyticsService,
  type PlatformStat,
} from "../../core/services/analytics.service";

@Component({
  selector: "app-analytics",
  templateUrl: "./analytics.component.html",
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  readonly businessId = input.required<string>();

  // ── State ────────────────────────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly stats = signal<PlatformStat[]>([]);

  // ── Derived ──────────────────────────────────────────────────────────────
  readonly totalClicks = computed(() =>
    this.stats().reduce((sum, s) => sum + s.count, 0),
  );

  readonly maxClicks = computed(() => {
    const s = this.stats();
    return s.length === 0 ? 1 : Math.max(...s.map((s) => s.count));
  });

  // ── RxJS ─────────────────────────────────────────────────────────────────
  private readonly analyticsService = inject(AnalyticsService);
  private readonly destroy$ = new Subject<void>();
  private readonly load$ = new Subject<void>();

  constructor() {
    this.load$
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap(() =>
          this.analyticsService.getAnalyticsStats(this.businessId()).pipe(
            tap(({ data, error }) => {
              if (!error && data) {
                this.stats.set(data);
              } else {
                console.error("Failed to load analytics", error);
              }
              this.isLoading.set(false);
            }),
            catchError((err: unknown) => {
              console.error("Failed to load analytics", err);
              this.isLoading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.load$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  getPercentage(count: number): number {
    return Math.round((count / this.maxClicks()) * 100);
  }

  getDisplayName(platform: string): string {
    const map: Record<string, string> = {
      "google business profile": "Google",
      google: "Google",
      facebook: "Facebook",
      instagram: "Instagram",
      zomato: "Zomato",
      swiggy: "Swiggy",
      justdial: "Justdial",
      practo: "Practo",
      tripadvisor: "TripAdvisor",
      yelp: "Yelp",
      trustpilot: "Trustpilot",
    };
    return map[platform.toLowerCase()] ?? platform;
  }

  getIconClass(platform: string): string {
    const map: Record<string, string> = {
      "google business profile": "pi pi-google",
      google: "pi pi-google",
      facebook: "pi pi-facebook",
      instagram: "pi pi-instagram",
      zomato: "pi pi-star-fill",
      swiggy: "pi pi-shopping-bag",
      justdial: "pi pi-phone",
      practo: "pi pi-heart-fill",
      tripadvisor: "pi pi-map-marker",
      yelp: "pi pi-star",
      trustpilot: "pi pi-check-circle",
    };
    return map[platform.toLowerCase()] ?? "pi pi-link";
  }

  getIconBgClass(platform: string): string {
    const map: Record<string, string> = {
      "google business profile": "bg-blue-900/60 text-blue-400",
      google: "bg-blue-900/60 text-blue-400",
      facebook: "bg-blue-900/60 text-blue-500",
      instagram: "bg-pink-900/60 text-pink-400",
      zomato: "bg-red-900/60 text-red-400",
      swiggy: "bg-orange-900/60 text-orange-400",
      tripadvisor: "bg-green-900/60 text-green-400",
      trustpilot: "bg-emerald-900/60 text-emerald-400",
    };
    return map[platform.toLowerCase()] ?? "bg-violet-900/60 text-violet-400";
  }

  getBarClass(platform: string): string {
    const map: Record<string, string> = {
      "google business profile": "bg-gradient-to-r from-blue-600 to-blue-400",
      google: "bg-gradient-to-r from-blue-600 to-blue-400",
      facebook: "bg-gradient-to-r from-blue-700 to-blue-500",
      instagram: "bg-gradient-to-r from-pink-600 to-rose-400",
      zomato: "bg-gradient-to-r from-red-600 to-red-400",
      swiggy: "bg-gradient-to-r from-orange-600 to-orange-400",
      tripadvisor: "bg-gradient-to-r from-green-600 to-emerald-400",
      trustpilot: "bg-gradient-to-r from-emerald-600 to-teal-400",
    };
    return (
      map[platform.toLowerCase()] ??
      "bg-gradient-to-r from-violet-600 to-fuchsia-500"
    );
  }
}
