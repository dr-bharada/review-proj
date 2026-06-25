import { Component, inject, effect, input, output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormBuilder,
  type FormControl,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import type { ReviewLink } from "../../../../core/models";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { ReviewLinksStore } from "../../../../state/review-links/review-links.store";

interface ReviewLinkForm {
  platform_name: FormControl<string>;
  platform_url: FormControl<string>;
}

@Component({
  selector: "app-review-links-form",
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule],
  templateUrl: "./review-links-form.component.html",
})
export class ReviewLinksFormComponent {
  readonly businessId = input.required<string>();
  readonly editingLink = input<ReviewLink | null>(null);
  readonly cancelEdit = output<void>();

  // Permissive URL pattern allowing modern social media and Google Maps link formats (with uppercase, @, commas, etc.)
  readonly urlRegex =
    "^(https?:\\/\\/)?([a-zA-Z\\d-]+\\.)+[a-zA-Z]{2,}(:\\d+)?(\\/.*)?$";

  private readonly fb = inject(FormBuilder);
  private readonly reviewLinksStore = inject(ReviewLinksStore);

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

  readonly isSaving = this.reviewLinksStore.isSaving;
  readonly formError = this.reviewLinksStore.error;

  readonly platforms = [
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

  private readonly platformRules = [
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

  constructor() {
    // React to editingLink changes
    effect(() => {
      const link = this.editingLink();
      if (link) {
        this.linkForm.patchValue({
          platform_name: link.platform_name,
          platform_url: link.platform_url,
        });
      } else {
        this.linkForm.reset();
      }
    });

    // Listen to platform_url changes to auto-select the platform
    this.linkForm.controls.platform_url.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((url) => {
        if (!url) return;

        const lowerUrl = url.toLowerCase();
        const matched = this.platformRules.find((rule) =>
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

    const resetFormCallback = () => {
      this.linkForm.reset();
      this.cancelEdit.emit();
    };

    const editing = this.editingLink();
    if (editing && editing.id) {
      this.reviewLinksStore.updateLink({
        id: editing.id,
        updates: {
          platform_name: formVal.platform_name || undefined,
          platform_url: url,
        },
        onSuccess: resetFormCallback,
      });
    } else {
      const newLink: ReviewLink = {
        business_id: this.businessId(),
        platform_name: formVal.platform_name,
        platform_url: url,
        is_enabled: true,
      };
      this.reviewLinksStore.addLink({
        link: newLink,
        onSuccess: resetFormCallback,
      });
    }
  }

  handleCancel() {
    this.cancelEdit.emit();
  }
}
