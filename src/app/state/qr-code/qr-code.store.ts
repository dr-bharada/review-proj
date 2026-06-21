import { Injectable, inject, signal, computed } from "@angular/core";
import { Subject, takeUntil, switchMap, tap, catchError, EMPTY } from "rxjs";
import type { QrCode } from "../../core/models/qr-code.model";
import { QrCodeService } from "../../features/qr-codes/qr-code.service";
import { environment } from "../../../environments/environment";

export interface QrCodeState {
  qrCode: QrCode | null;
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
}

const initialState: QrCodeState = {
  qrCode: null,
  isLoading: false,
  isClaiming: false,
  error: null,
};

@Injectable({ providedIn: "root" })
export class QrCodeStore {
  private readonly qrCodeService = inject(QrCodeService);

  // ── Single state signal ───────────────────────────────────────────────
  readonly state = signal<QrCodeState>(initialState);

  // ── Derived selectors ─────────────────────────────────────────────────
  readonly qrCode    = computed(() => this.state().qrCode);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly isClaiming = computed(() => this.state().isClaiming);
  readonly error     = computed(() => this.state().error);

  readonly qrImageUrl = computed(() => {
    const code = this.state().qrCode;
    if (!code) return "";
    const url = `${environment.siteUrl}/r/${code.slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(url)}&margin=0`;
  });

  readonly publicUrl = computed(() => {
    const code = this.state().qrCode;
    return code ? `${environment.siteUrl}/r/${code.slug}` : "";
  });

  readonly displayName = computed(() => {
    const slug = this.state().qrCode?.slug ?? "";
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  });

  // ── RxJS triggers ─────────────────────────────────────────────────────
  private readonly load$    = new Subject<string>();
  private readonly claim$   = new Subject<{ businessId: string; slug: string }>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Load QR code
    this.load$
      .pipe(
        tap(() => this.state.update((s) => ({ ...s, isLoading: true, error: null }))),
        switchMap((businessId) =>
          this.qrCodeService.getQrCode(businessId).pipe(
            tap((qrCode) =>
              this.state.update((s) => ({ ...s, qrCode, isLoading: false })),
            ),
            catchError((err: unknown) => {
              this.state.update((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : "Failed to load QR code",
              }));
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();

    // Claim slug
    this.claim$
      .pipe(
        tap(() => this.state.update((s) => ({ ...s, isClaiming: true, error: null }))),
        switchMap(({ businessId, slug }) =>
          this.qrCodeService.claimSlug(businessId, slug).pipe(
            tap((qrCode) =>
              this.state.update((s) => ({ ...s, qrCode, isClaiming: false })),
            ),
            catchError((err: unknown) => {
              this.state.update((s) => ({
                ...s,
                isClaiming: false,
                error: err instanceof Error ? err.message : "Failed to claim slug",
              }));
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  // ── Public methods ────────────────────────────────────────────────────
  loadQrCode(businessId: string): void {
    this.load$.next(businessId);
  }

  claimSlug(businessId: string, slug: string): void {
    this.claim$.next({ businessId, slug });
  }

  reset(): void {
    this.state.set(initialState);
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
