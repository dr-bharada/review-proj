import { Component, input, signal, inject, effect } from "@angular/core";
import type { ReviewLink } from "../../core/models";
import { ReviewLinksFormComponent } from "./components/review-links-form/review-links-form.component";
import { ReviewLinksListComponent } from "./components/review-links-list/review-links-list.component";
import { ReviewLinksStore } from "../../state/review-links/review-links.store";

@Component({
  selector: "app-review-links",
  templateUrl: "./review-links.component.html",
  imports: [ReviewLinksFormComponent, ReviewLinksListComponent],
})
export class ReviewLinksComponent {
  readonly businessId = input.required<string>();
  editingLink = signal<ReviewLink | null>(null);

  private readonly reviewLinksStore = inject(ReviewLinksStore);

  constructor() {
    // Load links whenever the businessId changes
    effect(() => {
      const id = this.businessId();
      if (id) {
        this.reviewLinksStore.loadLinks({ businessId: id });
      }
    });
  }
}
