import { Component, signal, computed, input, inject, type OnInit, type OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { from, Subject, takeUntil, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { QrCodeService } from './qr-code.service';
import type { QrCode } from '../../core/models/qr-code.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-qr-code-manager',
  imports: [FormsModule],
  templateUrl: './qr-code-manager.component.html',
})
export class QrCodeManagerComponent implements OnInit, OnDestroy {
  readonly businessId = input.required<string>();

  // ── State ────────────────────────────────────────────────────────────────
  readonly isLoading  = signal(true);
  readonly isSubmitting = signal(false);
  readonly copied     = signal(false);
  readonly qrCode     = signal<QrCode | null>(null);
  readonly error      = signal<string | null>(null);

  desiredSlug = '';

  /** Exposed to template (avoids importing environment in HTML) */
  readonly siteUrl = environment.siteUrl;

  // ── Derived ──────────────────────────────────────────────────────────────
  readonly qrImageUrl = computed(() => {
    const code = this.qrCode();
    if (!code) return '';
    const url = `${environment.siteUrl}/r/${code.slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}&margin=10`;
  });

  readonly publicUrl = computed(() => {
    const code = this.qrCode();
    return code ? `${environment.siteUrl}/r/${code.slug}` : '';
  });

  // ── RxJS ─────────────────────────────────────────────────────────────────
  private readonly qrCodeService = inject(QrCodeService);
  private readonly destroy$ = new Subject<void>();

  /** Trigger subjects for each operation */
  private readonly load$  = new Subject<void>();
  private readonly claim$ = new Subject<string>();

  constructor() {
    // Load QR code reactively
    this.load$
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap(() =>
          this.qrCodeService.getQrCode(this.businessId()).pipe(
            tap(code => {
              this.qrCode.set(code);
              this.isLoading.set(false);
            }),
            catchError((err: unknown) => {
              console.error('Failed to load QR code', err);
              this.isLoading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();

    // Claim slug reactively
    this.claim$
      .pipe(
        tap(() => {
          this.isSubmitting.set(true);
          this.error.set(null);
        }),
        switchMap(slug =>
          this.qrCodeService.claimSlug(this.businessId(), slug).pipe(
            tap(code => {
              this.qrCode.set(code);
              this.isSubmitting.set(false);
            }),
            catchError((err: unknown) => {
              const message = err instanceof Error ? err.message : 'An error occurred.';
              this.error.set(message);
              this.isSubmitting.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();

  }

  ngOnInit(): void {
    // Signal inputs are guaranteed to be set by ngOnInit — safe to read here
    this.load$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Public actions ────────────────────────────────────────────────────────
  claimSlug(): void {
    if (!this.desiredSlug.trim()) {
      this.error.set('Slug cannot be empty.');
      return;
    }
    this.claim$.next(this.desiredSlug.trim());
  }

  copyLink(): void {
    from(navigator.clipboard.writeText(this.publicUrl()))
      .pipe(
        tap(() => {
          this.copied.set(true);
          setTimeout(() => this.copied.set(false), 2000);
        }),
        catchError(err => {
          console.error('Failed to copy', err);
          return EMPTY;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  downloadQrCode(): void {
    const url = this.qrImageUrl();
    if (!url) return;

    from(fetch(url).then(r => r.blob()))
      .pipe(
        tap(blob => {
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = `qrcode-${this.qrCode()?.slug}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(objectUrl);
        }),
        catchError(err => {
          console.error('Failed to download QR code', err);
          window.open(url, '_blank');
          return EMPTY;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }
}
