import { Component, signal, inject, type OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { PublicService, type PublicProfileData } from "./public.service";
import { AnalyticsService } from "../../core/services/analytics.service";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ButtonModule } from "primeng/button";
import type { ReviewLink } from "../../core/models";
import {
  getPlatformIcon,
  getPlatformButtonClasses,
  getPlatformDisplayName,
} from "../../shared/utils";

@Component({
  selector: "app-public-review-page",
  imports: [ProgressSpinnerModule, ButtonModule],
  templateUrl: "./public-review-page.component.html",
})
export class PublicReviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly analyticsService = inject(AnalyticsService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  profile = signal<PublicProfileData | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get("slug");
      if (slug) {
        this.loadProfile(slug);
      } else {
        this.error.set("No slug provided");
        this.isLoading.set(false);
      }
    });
  }

  loadProfile(slug: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.publicService.getPublicProfile(slug).subscribe({
      next: ({ data, error }) => {
        if (error || !data) {
          console.error("Error loading public profile", error);
          this.error.set("Could not find profile.");
        } else {
          this.profile.set(data);
          if (data.business.id) {
            this.analyticsService.logScan(data.business.id).subscribe({
              error: (err) => {
                console.error("Failed to log scan event", err);
              },
            });
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error("Error in public profile stream", err);
        this.error.set("Could not find profile.");
        this.isLoading.set(false);
      },
    });
  }

  onLinkClick(link: ReviewLink) {
    // Log the click asynchronously (don't wait for it to finish before opening the window)
    this.analyticsService
      .logClick(link.business_id, link.platform_name)
      .subscribe({
        error: (err) => {
          console.error("Failed to log analytics event", err);
        },
      });

    window.open(link.platform_url, "_blank", "noopener,noreferrer");
  }

  // Delegate to shared platform utilities
  getPlatformDisplayName = getPlatformDisplayName;
  getPlatformIcon = getPlatformIcon;
  getPlatformButtonClasses = getPlatformButtonClasses;
}
