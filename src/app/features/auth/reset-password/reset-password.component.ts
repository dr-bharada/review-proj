import {
  Component,
  signal,
  ViewEncapsulation,
  inject,
  type AfterViewInit,
  type OnDestroy,
  ElementRef,
  viewChild,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import {
  FormBuilder,
  type FormControl,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthService } from "../../../core/auth/auth.service";
import { CardModule } from "primeng/card";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { passwordMatchValidator } from "../../../shared/validators";

export interface ResetPasswordForm {
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: "app-reset-password",
  encapsulation: ViewEncapsulation.None,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: "./reset-password.component.html",
})
export class ResetPasswordComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private hostEl = inject(ElementRef);
  private autofillInterval: ReturnType<typeof setInterval> | undefined;

  passwordRef = viewChild("passwordRef", { read: ElementRef });
  confirmPasswordRef = viewChild("confirmPasswordRef", { read: ElementRef });

  resetForm: FormGroup<ResetPasswordForm> = this.fb.nonNullable.group(
    {
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  isLoading = signal(false);
  errorMessage = signal<string | undefined>(undefined);
  successMessage = signal<string | undefined>(undefined);

  ngAfterViewInit() {
    // Add title/aria-label to password toggle eye icons
    const toggleIcons = this.hostEl.nativeElement.querySelectorAll(
      ".p-password-toggle-mask-icon",
    );
    toggleIcons.forEach((icon: Element) => {
      icon.setAttribute("title", "Toggle password visibility");
      icon.setAttribute("aria-label", "Toggle password visibility");
    });

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
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(undefined);
    this.successMessage.set(undefined);

    const { password } = this.resetForm.getRawValue();

    this.authService.updateUserPassword(password).subscribe({
      next: ({ error }) => {
        if (error) {
          this.errorMessage.set(error.message);
        } else {
          this.successMessage.set(
            "Password updated successfully! Redirecting you to login...",
          );
          setTimeout(() => {
            this.router.navigate(["/auth/login"]);
          }, 2000);
        }
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        this.errorMessage.set(message);
        this.isLoading.set(false);
      },
    });
  }

  onFormChange() {
    const passwordElRef = this.passwordRef();
    if (passwordElRef) {
      const passwordEl = passwordElRef.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      if (
        passwordEl &&
        passwordEl.value !== this.resetForm.controls.password.value
      ) {
        this.resetForm.controls.password.setValue(passwordEl.value);
      }
    }
    const confirmPasswordElRef = this.confirmPasswordRef();
    if (confirmPasswordElRef) {
      const confirmPasswordEl =
        confirmPasswordElRef.nativeElement.querySelector(
          "input",
        ) as HTMLInputElement;
      if (
        confirmPasswordEl &&
        confirmPasswordEl.value !==
          this.resetForm.controls.confirmPassword.value
      ) {
        this.resetForm.controls.confirmPassword.setValue(
          confirmPasswordEl.value,
        );
      }
    }
  }
}
