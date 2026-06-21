import {
  Component,
  signal,
  inject,
  effect,
  input,
  type OnInit,
} from "@angular/core";
import {
  FormBuilder,
  type FormControl,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import type { ReviewLink } from "../../core/models";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { ReviewLinksStore } from "../../state/review-links/review-links.store";
import { getPlatformIcon } from "../../shared/utils";

interface ReviewLinkForm {
  platform_name: FormControl<string>;
  platform_url: FormControl<string>;
}

@Component({
  selector: "app-review-links",
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule],
  templateUrl: "./review-links.component.html",
})
export class ReviewLinksComponent implements OnInit {
  readonly businessId = input.required<string>();

  // Permissive URL pattern allowing modern social media and Google Maps link formats (with uppercase, @, commas, etc.)
  urlRegex =
    "^(https?:\\/\\/)?([a-zA-Z\\d-]+\\.)+[a-zA-Z]{2,}(:\\d+)?(\\/.*)?$";

  private fb = inject(FormBuilder);
  private reviewLinksStore = inject(ReviewLinksStore);

  readonly linkForm: FormGroup<ReviewLinkForm> = this.fb.group({
    platform_name: this.fb.control("", {
      validators: [Validators.required],
      nonNullable: true,
    }),
    platform_url: this.fb.control("", {
      validators: [Validators.required, Validators.pattern(this.urlRegex)],
      nonNullable: true,
    }),
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
    { label: "TripAdvisor", value: "TripAdvisor" },
    { label: "Yelp", value: "Yelp" },
    { label: "Trustpilot", value: "Trustpilot" },
    { label: "Our Website (Custom)", value: "Custom" },
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

    // Listen to platform_url changes to auto-select the platform
    this.linkForm.controls.platform_url.valueChanges.subscribe((url) => {
      if (!url) return;

      const lowerUrl = url.toLowerCase();
      const platformRules = [
        {
          name: "Google Business Profile",
          patterns: ["google.com", "g.page", "google.co.in", "goo.gl"],
        },
        { name: "Facebook", patterns: ["facebook.com", "fb.me"] },
        { name: "Instagram", patterns: ["instagram.com", "instagr.am"] },
        { name: "Zomato", patterns: ["zomato.com"] },
        { name: "Swiggy", patterns: ["swiggy.com"] },
        { name: "Justdial", patterns: ["justdial.com"] },
        { name: "Practo", patterns: ["practo.com"] },
        {
          name: "TripAdvisor",
          patterns: ["tripadvisor.com", "tripadvisor.in"],
        },
        { name: "Yelp", patterns: ["yelp.com"] },
        { name: "Trustpilot", patterns: ["trustpilot.com"] },
      ];

      const matched = platformRules.find((rule) =>
        rule.patterns.some((pattern) => lowerUrl.includes(pattern)),
      );

      if (matched) {
        const currentPlatform = this.linkForm.controls.platform_name.value;
        if (!currentPlatform) {
          this.linkForm.controls.platform_name.setValue(matched.name);
        }
      }
    });
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
