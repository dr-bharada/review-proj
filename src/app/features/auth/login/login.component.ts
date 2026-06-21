import { Component, inject, ViewEncapsulation, type AfterViewInit, type OnDestroy, ElementRef, viewChild, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormBuilder, type FormControl, type FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { AuthStore } from "../../../state/auth/auth.store";

export interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: "app-login",
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
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authStore = inject(AuthStore);
  private hostEl = inject(ElementRef);
  private autofillInterval: ReturnType<typeof setInterval> | undefined;

  emailInput = viewChild("emailInput", { read: ElementRef });
  passwordRef = viewChild("passwordRef", { read: ElementRef });

  isEmailReadonly = signal(true);

  loginForm: FormGroup<LoginForm> = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required]],
  });

  isLoading = this.authStore.isLoading;
  errorMessage = this.authStore.error;

  ngAfterViewInit() {
    // Add title/aria-label to password toggle eye icons
    const toggleIcons = this.hostEl.nativeElement.querySelectorAll(".p-password-toggle-mask-icon");
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
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.authStore.login({ email, password });
  }

  onFormChange() {
    const emailElRef = this.emailInput();
    if (emailElRef) {
      const emailEl = emailElRef.nativeElement as HTMLInputElement;
      if (emailEl && emailEl.value !== this.loginForm.controls.email.value) {
        this.loginForm.controls.email.setValue(emailEl.value);
      }
    }
    const passwordElRef = this.passwordRef();
    if (passwordElRef) {
      const passwordEl = passwordElRef.nativeElement.querySelector("input") as HTMLInputElement;
      if (passwordEl && passwordEl.value !== this.loginForm.controls.password.value) {
        this.loginForm.controls.password.setValue(passwordEl.value);
      }
    }
  }
}
