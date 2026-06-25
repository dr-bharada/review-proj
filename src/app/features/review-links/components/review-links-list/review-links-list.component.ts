import { Component, inject, signal, output } from "@angular/core";
import { Clipboard } from "@angular/cdk/clipboard";
import type { ReviewLink } from "../../../../core/models";
import { ReviewLinksStore } from "../../../../state/review-links/review-links.store";
import { getPlatformIcon } from "../../../../shared/utils";

@Component({
  selector: "app-review-links-list",
  imports: [],
  templateUrl: "./review-links-list.component.html",
})
export class ReviewLinksListComponent {
  readonly editLink = output<ReviewLink>();

  private reviewLinksStore = inject(ReviewLinksStore);
  private clipboard = inject(Clipboard);

  reviewLinks = this.reviewLinksStore.links;
  isLoading = this.reviewLinksStore.isLoading;

  copiedLinkId = signal<string | null>(null);

  // Delegate to shared platform utilities
  getPlatformIcon = getPlatformIcon;

  copyToClipboard(url: string, id: string) {
    if (this.clipboard.copy(url)) {
      this.copiedLinkId.set(id);
      setTimeout(() => {
        if (this.copiedLinkId() === id) {
          this.copiedLinkId.set(null);
        }
      }, 2000);
    }
  }

  toggleLink(link: ReviewLink) {
    if (!link.id) return;
    const updatedStatus = !link.is_enabled;
    this.reviewLinksStore.updateLink({
      id: link.id,
      updates: { is_enabled: updatedStatus },
    });
  }

  deleteLink(id: string) {
    if (!confirm("Are you sure you want to delete this link?")) return;
    this.reviewLinksStore.deleteLink({ id });
  }

  handleEdit(link: ReviewLink) {
    this.editLink.emit(link);
  }
}
