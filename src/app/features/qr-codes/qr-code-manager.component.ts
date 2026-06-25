import {
  Component,
  signal,
  inject,
  input,
  type OnInit,
  type OnDestroy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  from,
  Subject,
  takeUntil,
  switchMap,
  tap,
  catchError,
  EMPTY,
} from "rxjs";
import { QrCodeStore } from "../../state/qr-code/qr-code.store";
import { Clipboard } from "@angular/cdk/clipboard";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-qr-code-manager",
  imports: [FormsModule],
  templateUrl: "./qr-code-manager.component.html",
})
export class QrCodeManagerComponent implements OnInit, OnDestroy {
  readonly businessId = input.required<string>();

  // ── Store ─────────────────────────────────────────────────────────────
  readonly store = inject(QrCodeStore);
  private readonly clipboard = inject(Clipboard);

  // ── Local UI state ────────────────────────────────────────────────────
  readonly copied = signal(false);
  readonly isDownloading = signal(false);
  readonly siteUrl = environment.siteUrl;

  desiredSlug = "";

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.store.loadQrCode(this.businessId());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Actions ───────────────────────────────────────────────────────────
  claimSlug(): void {
    const slug = this.desiredSlug.trim();
    if (!slug) {
      this.store.state.update((s) => ({
        ...s,
        error: "Slug cannot be empty.",
      }));
      return;
    }
    this.store.claimSlug(this.businessId(), slug);
  }

  copyLink(): void {
    const success = this.clipboard.copy(this.store.publicUrl());
    if (success) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  clearError(): void {
    this.store.state.update((s) => ({ ...s, error: null }));
  }

  /**
   * Renders a branded card on an offscreen canvas and triggers a PNG download.
   */
  downloadQrCode(): void {
    const qrUrl = this.store.qrImageUrl();
    const slug = this.store.qrCode()?.slug ?? "review";
    const businessName = this.store.displayName();
    const publicUrl = this.store.publicUrl();
    if (!qrUrl) return;

    this.isDownloading.set(true);

    from(fetch(qrUrl).then((r) => r.blob()))
      .pipe(
        switchMap(
          (blob) =>
            new Promise<void>((resolve, reject) => {
              const qrObjectUrl = URL.createObjectURL(blob);
              const qrImg = new Image();
              qrImg.crossOrigin = "anonymous";

              qrImg.onload = () => {
                try {
                  const W = 800;
                  const H = 1000;
                  const canvas = document.createElement("canvas");
                  canvas.width = W;
                  canvas.height = H;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) {
                    throw new Error("Failed to get 2D context");
                  }

                  // Background
                  const bg = ctx.createLinearGradient(0, 0, W, H);
                  bg.addColorStop(0, "#0d0b18");
                  bg.addColorStop(1, "#0a0e18");
                  ctx.fillStyle = bg;
                  ctx.beginPath();
                  ctx.roundRect(0, 0, W, H, 36);
                  ctx.fill();

                  // Violet glow top-left
                  const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 520);
                  g1.addColorStop(0, "rgba(139,92,246,0.22)");
                  g1.addColorStop(1, "transparent");
                  ctx.fillStyle = g1;
                  ctx.fillRect(0, 0, W, H);

                  // Fuchsia glow bottom-right
                  const g2 = ctx.createRadialGradient(W, H, 0, W, H, 520);
                  g2.addColorStop(0, "rgba(217,70,239,0.16)");
                  g2.addColorStop(1, "transparent");
                  ctx.fillStyle = g2;
                  ctx.fillRect(0, 0, W, H);

                  // Border
                  ctx.strokeStyle = "rgba(139,92,246,0.4)";
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.roundRect(2, 2, W - 4, H - 4, 34);
                  ctx.stroke();

                  // Top accent line
                  const accent = ctx.createLinearGradient(60, 0, W - 60, 0);
                  accent.addColorStop(0, "transparent");
                  accent.addColorStop(0.35, "#8b5cf6");
                  accent.addColorStop(0.65, "#d946ef");
                  accent.addColorStop(1, "transparent");
                  ctx.strokeStyle = accent;
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.moveTo(60, 2);
                  ctx.lineTo(W - 60, 2);
                  ctx.stroke();

                  // Star icon circle
                  const cx = W / 2,
                    cy = 96,
                    cr = 40;
                  const iconGrad = ctx.createRadialGradient(
                    cx,
                    cy,
                    0,
                    cx,
                    cy,
                    cr,
                  );
                  iconGrad.addColorStop(0, "rgba(139,92,246,0.45)");
                  iconGrad.addColorStop(1, "rgba(139,92,246,0.08)");
                  ctx.fillStyle = iconGrad;
                  ctx.beginPath();
                  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = "rgba(139,92,246,0.55)";
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                  ctx.fillStyle = "#a78bfa";
                  ctx.font = "bold 34px serif";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText("★", cx, cy + 1);

                  // "SCAN TO REVIEW"
                  ctx.fillStyle = "#7c3aed";
                  ctx.font = "bold 11px sans-serif";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "alphabetic";
                  ctx.fillText("SCAN  TO  REVIEW", W / 2, 168);

                  // Business name
                  ctx.fillStyle = "#f8fafc";
                  ctx.font = "bold 38px sans-serif";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "alphabetic";
                  let name = businessName || slug;
                  while (
                    ctx.measureText(name).width > W - 80 &&
                    name.length > 4
                  ) {
                    name = name.slice(0, -1);
                  }
                  if (name !== (businessName || slug)) name += "…";
                  ctx.fillText(name, W / 2, 220);

                  // Sub-label
                  ctx.fillStyle = "#64748b";
                  ctx.font = "14px sans-serif";
                  ctx.fillText(
                    "Share this code with your customers",
                    W / 2,
                    248,
                  );

                  // QR card
                  const qrSize = 400,
                    qrPad = 24;
                  const qrX = (W - qrSize) / 2,
                    qrY = 272;
                  ctx.shadowColor = "rgba(139,92,246,0.3)";
                  ctx.shadowBlur = 48;
                  ctx.fillStyle = "#ffffff";
                  ctx.beginPath();
                  ctx.roundRect(qrX, qrY, qrSize, qrSize, 24);
                  ctx.fill();
                  ctx.shadowBlur = 0;
                  ctx.drawImage(
                    qrImg,
                    qrX + qrPad,
                    qrY + qrPad,
                    qrSize - qrPad * 2,
                    qrSize - qrPad * 2,
                  );
                  ctx.strokeStyle = "rgba(139,92,246,0.35)";
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.roundRect(qrX, qrY, qrSize, qrSize, 24);
                  ctx.stroke();

                  // Corner dots
                  [
                    [qrX - 12, qrY - 12],
                    [qrX + qrSize + 12, qrY - 12],
                    [qrX - 12, qrY + qrSize + 12],
                    [qrX + qrSize + 12, qrY + qrSize + 12],
                  ].forEach(([dx, dy]) => {
                    ctx.fillStyle = "rgba(139,92,246,0.6)";
                    ctx.beginPath();
                    ctx.arc(dx, dy, 5, 0, Math.PI * 2);
                    ctx.fill();
                  });

                  // URL pill
                  const pillW = 580,
                    pillH = 54;
                  const pillX = (W - pillW) / 2,
                    pillY = qrY + qrSize + 36;
                  ctx.fillStyle = "rgba(13,11,24,0.95)";
                  ctx.strokeStyle = "rgba(139,92,246,0.45)";
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
                  ctx.fill();
                  ctx.stroke();
                  ctx.fillStyle = "#7c3aed";
                  ctx.beginPath();
                  ctx.arc(pillX + 24, pillY + pillH / 2, 4, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = "#94a3b8";
                  ctx.font = "13px monospace";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  let urlText = publicUrl;
                  while (
                    ctx.measureText(urlText).width > pillW - 56 &&
                    urlText.length > 8
                  ) {
                    urlText = urlText.slice(0, -1);
                  }
                  if (urlText !== publicUrl) urlText += "…";
                  ctx.fillText(urlText, W / 2 + 8, pillY + pillH / 2);

                  // Divider
                  const divY = pillY + pillH + 44;
                  const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
                  divGrad.addColorStop(0, "transparent");
                  divGrad.addColorStop(0.5, "rgba(139,92,246,0.25)");
                  divGrad.addColorStop(1, "transparent");
                  ctx.strokeStyle = divGrad;
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(100, divY);
                  ctx.lineTo(W - 100, divY);
                  ctx.stroke();

                  // Footer stars + text
                  ctx.fillStyle = "#f59e0b";
                  ctx.font = "14px serif";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "alphabetic";
                  ctx.fillText("★ ★ ★ ★ ★", W / 2, divY + 30);
                  ctx.fillStyle = "#475569";
                  ctx.font = "12px sans-serif";
                  ctx.fillText("Powered by Review Platform", W / 2, divY + 54);

                  // Export
                  canvas.toBlob((pngBlob) => {
                    if (!pngBlob) {
                      reject(new Error("Canvas export failed"));
                      return;
                    }
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(pngBlob);
                    a.download = `review-qr-${slug}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                    URL.revokeObjectURL(qrObjectUrl);
                    resolve();
                  }, "image/png");
                } catch (e) {
                  reject(e);
                }
              };

              qrImg.onerror = reject;
              qrImg.src = qrObjectUrl;
            }),
        ),
        tap(() => this.isDownloading.set(false)),
        catchError((err) => {
          console.error("Failed to download QR code", err);
          this.isDownloading.set(false);
          window.open(qrUrl, "_blank");
          return EMPTY;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }
}
