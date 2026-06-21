import {
  Component,
  signal,
  inject,
  effect,
  input,
  type OnInit,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import type { ReviewLink } from "../../core/models";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { ReviewLinksStore } from "../../state/review-links/review-links.store";
import { getPlatformIcon } from "../../shared/utils";

@Component({
  selector: "app-review-links",
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, DropdownModule],
  templateUrl: "./review-links.component.html",
})
export class ReviewLinksComponent implements OnInit {
  readonly businessId = input.required<string>();

  // Regex requiring http:// or https:// followed by valid url format
  urlRegex =
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
    "(\\#[-a-z\\d_]*)?$"; // fragment locator

  private fb = inject(FormBuilder);
  private reviewLinksStore = inject(ReviewLinksStore);

  linkForm = this.fb.nonNullable.group({
    platform_name: ["", Validators.required],
    platform_url: [
      "",
      [Validators.required, Validators.pattern(this.urlRegex)],
    ],
  });

  reviewLinks = this.reviewLinksStore.links;
  isLoading = this.reviewLinksStore.isLoading;
  isSaving = this.reviewLinksStore.isSaving;
  formError = this.reviewLinksStore.error;

  isEditing = signal(false);
  editingLinkId = signal<string | undefined>(undefined);

  platforms = [
    { label: "Google Business Profile", value: "Google Business Profile" },
    { label: "Facebook", value: "Facebook" },
    { label: "Instagram", value: "Instagram" },
    { label: "Zomato", value: "Zomato" },
    { label: "Swiggy", value: "Swiggy" },
    { label: "Justdial", value: "Justdial" },
    { label: "Practo", value: "Practo" },
  ];

  constructor() {
    // React to save completion
    let wasSaving = false;
    effect(() => {
      const saving = this.isSaving();
      const error = this.formError();
      if (wasSaving && !saving && !error) {
        this.linkForm.reset();
        this.cancelEdit();
      }
      wasSaving = saving;
    });
  }

  ngOnInit() {
    this.reviewLinksStore.loadLinks({ businessId: this.businessId() });
  }

  // Delegate to shared platform utilities
  getPlatformIcon = getPlatformIcon;

  onSubmit() {
    if (this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }

    const formVal = this.linkForm.getRawValue();

    // Standardize URL to always prefix with http/https if missing
    let url: string = formVal.platform_url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const editingId = this.editingLinkId();
    if (this.isEditing() && editingId) {
      this.reviewLinksStore.updateLink({
        id: editingId,
        updates: {
          platform_name: formVal.platform_name || undefined,
          platform_url: url,
        },
      });
    } else {
      const newLink: ReviewLink = {
        business_id: this.businessId(),
        platform_name: formVal.platform_name,
        platform_url: url,
        is_enabled: true,
      };
      this.reviewLinksStore.addLink({ link: newLink });
    }
  }

  editLink(link: ReviewLink) {
    this.isEditing.set(true);
    this.editingLinkId.set(link.id || undefined);
    this.linkForm.patchValue({
      platform_name: link.platform_name,
      platform_url: link.platform_url,
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editingLinkId.set(undefined);
    this.linkForm.reset();
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
}
