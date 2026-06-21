import {
  Component,
  signal,
  inject,
  type AfterViewInit,
  type OnDestroy,
  ElementRef,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import {
  FormBuilder,
  type FormControl,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthService } from "../../../core/auth/auth.service";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { environment } from "../../../../environments/environment";

export interface ForgotPasswordForm {
  email: FormControl<string>;
}

@Component({
  selector: "app-forgot-password",
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: "./forgot-password.component.html",
})
export class ForgotPasswordComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private autofillInterval: ReturnType<typeof setInterval> | undefined;

  emailInput = viewChild("emailInput", { read: ElementRef });

  forgotForm: FormGroup<ForgotPasswordForm> = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });

  isLoading = signal(false);
  errorMessage = signal<string | undefined>(undefined);
  successMessage = signal<string | undefined>(undefined);

  ngAfterViewInit() {
    // Periodically sync browser-autofilled values that do not trigger events on load
    this.autofillInterval = setInterval(() => {
      this.onFormChange();
    }, 100);

    // Stop checking after 3 seconds to preserve resources
    setTimeout(() => {
      if (this.autofillInterval) {
        clearInterval(this.autofillInterval);
      }
    }, 3000);
  }

  ngOnDestroy() {
    if (this.autofillInterval) {
      clearInterval(this.autofillInterval);
    }
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(undefined);
    this.successMessage.set(undefined);

    const { email } = this.forgotForm.getRawValue();
    const redirectToUrl = `${environment.siteUrl}/auth/reset-password`;

    this.authService.resetPasswordForEmail(email, redirectToUrl).subscribe({
      next: ({ error }) => {
        if (error) {
          this.errorMessage.set(error.message);
        } else {
          this.successMessage.set(
            "Reset link sent! Please check your email inbox.",
          );
          this.forgotForm.reset();
        }
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        this.errorMessage.set(message);
        this.isLoading.set(false);
      }
    });
  }

  onFormChange() {
    const emailElRef = this.emailInput();
    if (emailElRef) {
      const emailEl = emailElRef.nativeElement as HTMLInputElement;
      if (emailEl && emailEl.value !== this.forgotForm.controls.email.value) {
        this.forgotForm.controls.email.setValue(emailEl.value);
      }
    }
  }
}
