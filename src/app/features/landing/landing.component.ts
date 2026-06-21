import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-landing",
  imports: [RouterLink],
  templateUrl: "./landing.component.html",
})
export class LandingComponent {
  readonly isYearly = signal(false);

  toggleBilling(): void {
    this.isYearly.update((val) => !val);
  }
}
