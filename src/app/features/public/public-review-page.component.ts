import { Component, inject, type OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import type { ReviewLink } from "../../core/models";
import { PublicStore } from "../../state/public";
import {
  getPlatformIcon,
  getPlatformButtonClasses,
  getPlatformDisplayName,
  getPlatformActionText,
} from "../../shared/utils";

@Component({
  selector: "app-public-review-page",
  imports: [ProgressSpinnerModule, ButtonModule, FormsModule],
  templateUrl: "./public-review-page.component.html",
})
export class PublicReviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(PublicStore);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get("slug");
      if (slug) {
        this.store.loadProfile({ slug });
      } else {
        console.warn(
          "[PublicReviewPageComponent] No slug found in route parameters!",
        );
      }
    });
  }

  onLinkClick(link: ReviewLink) {
    this.store.logLinkClick(link.business_id, link.platform_name);
    window.open(link.platform_url, "_blank", "noopener,noreferrer");
  }

  // Delegate to shared platform utilities
  getPlatformDisplayName = getPlatformDisplayName;
  getPlatformIcon = getPlatformIcon;
  getPlatformButtonClasses = getPlatformButtonClasses;
  getPlatformActionText = getPlatformActionText;
}
