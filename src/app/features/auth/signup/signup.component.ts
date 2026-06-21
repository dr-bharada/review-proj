import {
  Component,
  inject,
  ViewEncapsulation,
  type AfterViewInit,
  type OnDestroy,
  ElementRef,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { AuthStore } from "../../../state/auth/auth.store";
import { passwordMatchValidator } from "../../../shared/validators";
import {
  FormBuilder,
  type FormControl,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

export interface SignupForm {
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: "app-signup",
  templateUrl: "./signup.component.html",
  styleUrl: "./signup.component.scss",
  encapsulation: ViewEncapsulation.None,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
})
export class SignupComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authStore = inject(AuthStore);
  private hostEl = inject(ElementRef);
  private autofillInterval: ReturnType<typeof setInterval> | undefined;

  emailInput = viewChild("emailInput", { read: ElementRef });
  passwordRef = viewChild("passwordRef", { read: ElementRef });
  confirmPasswordRef = viewChild("confirmPasswordRef", { read: ElementRef });

  signupForm: FormGroup<SignupForm> = this.fb.nonNullable.group(
    {
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  /** Reflects AuthStore loading state */
  isLoading = this.authStore.isLoading;

  /** Reflects AuthStore error state */
  errorMessage = this.authStore.error;

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

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.signupForm.getRawValue();
    if (email && password) {
      this.authStore.signup({ email, password });
    }
  }

  onFormChange() {
    const emailElRef = this.emailInput();
    if (emailElRef) {
      const emailEl = emailElRef.nativeElement as HTMLInputElement;
      if (emailEl && emailEl.value !== this.signupForm.controls.email.value) {
        this.signupForm.controls.email.setValue(emailEl.value);
      }
    }
    const passwordElRef = this.passwordRef();
    if (passwordElRef) {
      const passwordEl = passwordElRef.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      if (
        passwordEl &&
        passwordEl.value !== this.signupForm.controls.password.value
      ) {
        this.signupForm.controls.password.setValue(passwordEl.value);
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
          this.signupForm.controls.confirmPassword.value
      ) {
        this.signupForm.controls.confirmPassword.setValue(
          confirmPasswordEl.value,
        );
      }
    }
  }
}
