import { Component, inject, signal, type OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { BusinessProfileComponent } from "../business/business-profile.component";
import { ReviewLinksComponent } from "../review-links/review-links.component";
import { QrCodeManagerComponent } from "../qr-codes/qr-code-manager.component";
import { AnalyticsComponent } from "../analytics/analytics.component";
import { AuthStore } from "../../state/auth/auth.store";
import { BusinessStore } from "../../state/business/business.store";
import type { Business } from "../../core/models";

@Component({
  selector: "app-dashboard",
  imports: [
    BusinessProfileComponent,
    ReviewLinksComponent,
    QrCodeManagerComponent,
    AnalyticsComponent,
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

  readonly validTabs = [
    "home",
    "links",
    "qrcode",
    "analytics",
    "profile",
  ] as const;

  activeTab = signal<"home" | "links" | "profile" | "qrcode" | "analytics">(
    "home",
  );

  navItems: {
    tab: "home" | "links" | "qrcode" | "analytics" | "profile";
    label: string;
    icon: string;
  }[] = [
    { tab: "home", label: "Home", icon: "pi pi-home" },
    { tab: "links", label: "Review Links", icon: "pi pi-link" },
    { tab: "qrcode", label: "QR Code", icon: "pi pi-qrcode" },
    { tab: "analytics", label: "Analytics", icon: "pi pi-chart-bar" },
    { tab: "profile", label: "Edit Profile", icon: "pi pi-pencil" },
  ];

  ngOnInit() {
    this.businessStore.loadBusiness();

    // Restore tab from query param on load / refresh
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get("tab") as
        | "home"
        | "links"
        | "profile"
        | "qrcode"
        | "analytics"
        | null;
      const isValid = tab && this.validTabs.includes(tab as never);
      this.activeTab.set(
        isValid
          ? (tab as "home" | "links" | "profile" | "qrcode" | "analytics")
          : "home",
      );
    });
  }

  setTab(tab: "home" | "links" | "profile" | "qrcode" | "analytics") {
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
