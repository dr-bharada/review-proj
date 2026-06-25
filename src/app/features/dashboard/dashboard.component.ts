import { Component, inject, type OnInit, effect } from "@angular/core";
import { NgComponentOutlet } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
import { BusinessProfileComponent } from "../business/business-profile.component";
import { DashboardHeaderComponent } from "./components/dashboard-header/dashboard-header.component";
import { DashboardSidebarComponent } from "./components/dashboard-sidebar/dashboard-sidebar.component";
import { DashboardHomeComponent } from "./components/dashboard-home/dashboard-home.component";
import { AuthStore } from "../../state/auth/auth.store";
import { BusinessStore } from "../../state/business/business.store";
import type { Business } from "../../core/models";
import { type DashboardTab, VALID_TABS, NAV_ITEMS } from "./dashboard.config";

@Component({
  selector: "app-dashboard",
  imports: [
    NgComponentOutlet,
    BusinessProfileComponent,
    DashboardHeaderComponent,
    DashboardSidebarComponent,
    DashboardHomeComponent,
  ],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  private authStore = inject(AuthStore);
  private businessStore = inject(BusinessStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = this.businessStore.isLoading;
  businessProfile = this.businessStore.profile;
  currentUser = this.authStore.user;

  readonly validTabs = VALID_TABS;
  activeTab = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const tab = params.get("tab") as DashboardTab | null;
        const isValid = tab && this.validTabs.includes(tab);
        return isValid ? tab : "home";
      }),
    ),
    { initialValue: "home" as DashboardTab },
  );
  navItems = NAV_ITEMS;

  constructor() {
    // React to profile updates when on the profile tab to redirect to home
    effect(() => {
      const success = this.businessStore.success();
      if (success && this.activeTab() === "profile") {
        this.setTab("home");
      }
    });
  }

  getTabInputs(tab: DashboardTab) {
    const businessId = this.businessProfile()?.id;
    if (tab === "profile") return {};
    return { businessId };
  }

  ngOnInit() {
    this.businessStore.loadBusiness();
  }

  setTab(tab: DashboardTab) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  onProfileUpdated(_updatedProfile: Business) {
    this.setTab("home");
  }

  logout() {
    this.authStore.logout();
  }
}
