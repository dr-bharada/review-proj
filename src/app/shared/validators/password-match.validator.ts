import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Cross-field validator that ensures 'password' and 'confirmPassword' fields match.
 * Apply at FormGroup level.
 */
export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) return null;
  return password.value === confirmPassword.value
    ? null
    : { passwordMismatch: true };
};
