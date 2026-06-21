import { Injectable, inject, signal, computed, effect } from "@angular/core";
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
  readonly qrCode     = computed(() => this.state().qrCode);
  readonly isLoading  = computed(() => this.state().isLoading);
  readonly isClaiming = computed(() => this.state().isClaiming);
  readonly error      = computed(() => this.state().error);

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

  // ── Trigger signals ───────────────────────────────────────────────────
  private readonly loadTrigger  = signal<string | null>(null);
  private readonly claimTrigger = signal<{ businessId: string; slug: string } | null>(null);

  constructor() {
    // Effect: fires when loadTrigger changes
    effect(() => {
      const businessId = this.loadTrigger();
      if (!businessId) return;

      this.state.update((s) => ({ ...s, isLoading: true, error: null }));

      this.qrCodeService.getQrCode(businessId).subscribe({
        next: (qrCode) =>
          this.state.update((s) => ({ ...s, qrCode, isLoading: false })),
        error: (err: unknown) =>
          this.state.update((s) => ({
            ...s,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load QR code",
          })),
      });
    });

    // Effect: fires when claimTrigger changes
    effect(() => {
      const payload = this.claimTrigger();
      if (!payload) return;

      this.state.update((s) => ({ ...s, isClaiming: true, error: null }));

      this.qrCodeService.claimSlug(payload.businessId, payload.slug).subscribe({
        next: (qrCode) =>
          this.state.update((s) => ({ ...s, qrCode, isClaiming: false })),
        error: (err: unknown) =>
          this.state.update((s) => ({
            ...s,
            isClaiming: false,
            error: err instanceof Error ? err.message : "Failed to claim slug",
          })),
      });
    });
  }

  // ── Public methods ────────────────────────────────────────────────────
  loadQrCode(businessId: string): void {
    this.loadTrigger.set(businessId);
  }

  claimSlug(businessId: string, slug: string): void {
    this.claimTrigger.set({ businessId, slug });
  }

  reset(): void {
    this.state.set(initialState);
  }
}
