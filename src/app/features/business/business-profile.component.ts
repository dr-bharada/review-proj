import { Component, signal, output, inject, effect } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { BusinessStore } from "../../state/business/business.store";
import type { Business } from "../../core/models";

@Component({
  selector: "app-business-profile",
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, DropdownModule],
  templateUrl: "./business-profile.component.html",
})
export class BusinessProfileComponent {
  private fb = inject(FormBuilder);
  private businessStore = inject(BusinessStore);

  profileForm = this.fb.nonNullable.group({
    id: [null as string | null],
    business_name: ["", Validators.required],
    category: ["", Validators.required],
    phone_number: ["", Validators.required],
    address: ["", Validators.required],
    logo_url: [null as string | null],
  });

  isSaving = this.businessStore.isSaving;
  isUploading = this.businessStore.isUploadingLogo;
  errorMessage = this.businessStore.error;
  successMessage = this.businessStore.success;
  businessProfile = this.businessStore.profile;

  logoUrlPreview = signal<string | null>(null);
  profileUpdated = output<Business>();

  categories = [
    { label: "Restaurant", value: "Restaurants" },
    { label: "Café", value: "Cafés" },
    { label: "Salon", value: "Salons" },
    { label: "Gym", value: "Gyms" },
    { label: "Clinic", value: "Clinics" },
    { label: "Hotel", value: "Hotels" },
    { label: "Retail Store", value: "Retail stores" },
    { label: "Educational Institute", value: "Educational institutes" },
  ];

  constructor() {
    // React to store updates and update the form
    effect(() => {
      const profile = this.businessProfile();
      if (profile) {
        this.profileForm.patchValue(
          {
            id: profile.id ?? null,
            business_name: profile.business_name,
            category: profile.category,
            phone_number: profile.phone_number,
            address: profile.address,
            logo_url: profile.logo_url ?? null,
          },
          { emitEvent: false },
        );
        this.logoUrlPreview.set(profile.logo_url ?? null);
      }
    });

    // React to success and emit update
    effect(() => {
      const success = this.successMessage();
      if (success) {
        const profile = this.businessProfile();
        if (profile) {
          this.profileUpdated.emit(profile);
          // Wait briefly, then clear success to prevent duplicate emissions
          setTimeout(() => {
            this.businessStore.clearBusinessSuccess();
          }, 100);
        }
      }
    });
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Check size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.businessStore.setError("Logo exceeds 2MB limit.");
      return;
    }

    this.businessStore.uploadLogo({ file });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const businessData: Business = this.profileForm.getRawValue() as Business;
    this.businessStore.upsertBusiness({ profile: businessData });
  }
}
