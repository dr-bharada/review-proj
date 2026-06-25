import type { Type } from "@angular/core";
import { ReviewLinksComponent } from "../review-links/review-links.component";
import { QrCodeManagerComponent } from "../qr-codes/qr-code-manager.component";
import { AnalyticsComponent } from "../analytics/analytics.component";
import { FeedbackListComponent } from "../feedback/feedback-list.component";
import { BusinessProfileComponent } from "../business/business-profile.component";

export type DashboardTab =
  | "home"
  | "links"
  | "qrcode"
  | "analytics"
  | "feedback"
  | "profile";

export interface NavItemTheme {
  hoverBorder: string;
  iconBg: string;
  iconBorder: string;
  iconText: string;
  arrowHover: string;
}

export interface NavItem {
  tab: DashboardTab;
  label: string;
  icon: string;
  description?: string;
  theme?: NavItemTheme;
  component?: Type<DashboardComponentType>;
}

export const VALID_TABS: readonly DashboardTab[] = [
  "home",
  "links",
  "qrcode",
  "analytics",
  "feedback",
  "profile",
];

export const NAV_ITEMS: readonly NavItem[] = [
  { tab: "home", label: "Home", icon: "pi pi-home" },
  {
    tab: "links",
    label: "Review Links",
    icon: "pi pi-link",
    description: "Connect Google, Facebook, Swiggy and more.",
    theme: {
      hoverBorder: "hover:border-violet-700/50",
      iconBg: "bg-violet-900/60",
      iconBorder: "border-violet-700/40",
      iconText: "text-violet-400",
      arrowHover: "group-hover:text-violet-400",
    },
    component: ReviewLinksComponent,
  },
  {
    tab: "qrcode",
    label: "QR Code",
    icon: "pi pi-qrcode",
    description: "Generate a shareable QR code for customers.",
    theme: {
      hoverBorder: "hover:border-fuchsia-700/50",
      iconBg: "bg-fuchsia-900/60",
      iconBorder: "border-fuchsia-700/40",
      iconText: "text-fuchsia-400",
      arrowHover: "group-hover:text-fuchsia-400",
    },
    component: QrCodeManagerComponent,
  },
  {
    tab: "analytics",
    label: "Analytics",
    icon: "pi pi-chart-bar",
    description: "Track clicks and see which platforms perform best.",
    theme: {
      hoverBorder: "hover:border-emerald-700/50",
      iconBg: "bg-emerald-900/60",
      iconBorder: "border-emerald-700/40",
      iconText: "text-emerald-400",
      arrowHover: "group-hover:text-emerald-400",
    },
    component: AnalyticsComponent,
  },
  {
    tab: "profile",
    label: "Edit Profile",
    icon: "pi pi-pencil",
    description: "Update your business details, logo and branding.",
    theme: {
      hoverBorder: "hover:border-amber-700/50",
      iconBg: "bg-amber-900/60",
      iconBorder: "border-amber-700/40",
      iconText: "text-amber-400",
      arrowHover: "group-hover:text-amber-400",
    },
    component: BusinessProfileComponent,
  },
  {
    tab: "feedback",
    label: "Private Feedback",
    icon: "pi pi-comment",
    description: "Read complaints and ratings sent privately by customers.",
    theme: {
      hoverBorder: "hover:border-violet-700/50",
      iconBg: "bg-violet-900/60",
      iconBorder: "border-violet-750",
      iconText: "text-violet-400",
      arrowHover: "group-hover:text-violet-400",
    },
    component: FeedbackListComponent,
  },
];

export type DashboardComponentType =
  | ReviewLinksComponent
  | QrCodeManagerComponent
  | AnalyticsComponent
  | FeedbackListComponent
  | BusinessProfileComponent;
