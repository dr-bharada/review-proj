import { Component, input, output } from "@angular/core";
import type { Business } from "../../../../core/models";
import type { DashboardTab, NavItem } from "../../dashboard.config";

@Component({
  selector: "app-dashboard-home",
  templateUrl: "./dashboard-home.component.html",
})
export class DashboardHomeComponent {
  profile = input.required<Business>();
  navItems = input.required<readonly NavItem[]>();
  tabSelected = output<DashboardTab>();
}
