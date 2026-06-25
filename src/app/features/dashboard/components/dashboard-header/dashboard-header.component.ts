import { Component, input, output } from "@angular/core";
import type { User } from "@supabase/supabase-js";
import type { Business } from "../../../../core/models";

@Component({
  selector: "app-dashboard-header",
  templateUrl: "./dashboard-header.component.html",
})
export class DashboardHeaderComponent {
  profile = input<Business | null>(null);
  currentUser = input<User | null>(null);
  logout = output<void>();
}
