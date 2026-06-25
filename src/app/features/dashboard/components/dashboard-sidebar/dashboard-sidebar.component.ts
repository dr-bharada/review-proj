import { Component, input, output } from "@angular/core";
import type { Business } from "../../../../core/models";
import type { DashboardTab, NavItem } from "../../dashboard.config";

@Component({
  selector: "app-dashboard-sidebar",
  templateUrl: "./dashboard-sidebar.component.html",
})
export class DashboardSidebarComponent {
  profile = input.required<Business>();
  activeTab = input.required<DashboardTab>();
  navItems = input.required<readonly NavItem[]>();
  tabSelected = output<DashboardTab>();
}
