import { Component, Input } from "@angular/core";

@Component({
  selector: "app-loading-spinner",
  template: `
    <div [class]="containerClass">
      <i class="pi pi-spin pi-spinner" [class]="spinnerClass"></i>
      @if (message) {
        <p class="text-slate-400 text-sm mt-2">{{ message }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() message = "";
  @Input() size: "sm" | "md" | "lg" = "md";
  @Input() center = true;

  get containerClass(): string {
    return this.center
      ? "flex flex-col items-center justify-center p-8"
      : "flex flex-col items-start";
  }

  get spinnerClass(): string {
    const sizes = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" };
    return `${sizes[this.size]} text-violet-500`;
  }
}
