import {
  Component,
  signal,
  computed,
  input,
  inject,
  type OnInit,
  type OnDestroy,
} from "@angular/core";
import { Subject, EMPTY, switchMap, tap, catchError, takeUntil } from "rxjs";
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
  readonly totalClicks = signal<number>(0);
  readonly totalScans = signal<number>(0);

  // ── Derived ──────────────────────────────────────────────────────────────
  readonly clickThroughRate = computed(() => {
    const scans = this.totalScans();
    if (scans === 0) return 0;
    return Math.round((this.totalClicks() / scans) * 100);
  });

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
                this.stats.set(data.stats);
                this.totalClicks.set(data.totalClicks);
                this.totalScans.set(data.totalScans);
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

  getPlatformKey(platform: string): string {
    const knownKeys = new Set([
      "google",
      "facebook",
      "instagram",
      "zomato",
      "swiggy",
      "tripadvisor",
      "trustpilot",
    ]);
    const map: Record<string, string> = {
      "google business profile": "google",
      google: "google",
      facebook: "facebook",
      instagram: "instagram",
      zomato: "zomato",
      swiggy: "swiggy",
      tripadvisor: "tripadvisor",
      trustpilot: "trustpilot",
    };
    const key = map[platform.toLowerCase()] ?? platform.toLowerCase();
    return knownKeys.has(key) ? key : "default";
  }
}
