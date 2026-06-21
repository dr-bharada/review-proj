import { Component, inject, type OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import type { ReviewLink } from "../../core/models";
import { PublicStore } from "../../state/public";
import { AnalyticsService } from "../../core/services/analytics.service";
import {
  getPlatformIcon,
  getPlatformButtonClasses,
  getPlatformDisplayName,
} from "../../shared/utils";

@Component({
  selector: "app-public-review-page",
  imports: [ProgressSpinnerModule, ButtonModule, FormsModule],
  templateUrl: "./public-review-page.component.html",
})
export class PublicReviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly analyticsService = inject(AnalyticsService);
  readonly store = inject(PublicStore);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get("slug");
      if (slug) {
        this.store.loadProfile({ slug });
      }
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
