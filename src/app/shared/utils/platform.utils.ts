/**
 * Shared platform utilities used across public review page and review-links component.
 */

export function getPlatformDisplayName(platform: string): string {
  const map: Record<string, string> = {
    "google business profile": "Google Business Profile",
    google: "Google",
    facebook: "Facebook",
    instagram: "Instagram",
    zomato: "Zomato",
    swiggy: "Swiggy",
    justdial: "Justdial",
    practo: "Practo",
    tripadvisor: "TripAdvisor",
    yelp: "Yelp",
    trustpilot: "Trustpilot",
    custom: "Our Website",
  };
  return map[platform.toLowerCase()] || platform;
}

export function getPlatformIcon(platform: string): string {
  const map: Record<string, string> = {
    "google business profile": "pi pi-google",
    google: "pi pi-google",
    facebook: "pi pi-facebook",
    instagram: "pi pi-instagram",
    zomato: "pi pi-star-fill",
    swiggy: "pi pi-shopping-bag",
    justdial: "pi pi-phone",
    practo: "pi pi-heart-fill",
    tripadvisor: "pi pi-map-marker",
    yelp: "pi pi-star",
    trustpilot: "pi pi-check-circle",
    custom: "pi pi-link",
  };
  return map[platform.toLowerCase()] || "pi pi-link";
}

export function getPlatformButtonClasses(platform: string): string {
  const map: Record<string, string> = {
    "google business profile":
      "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-blue-600/20 shadow-lg",
    google:
      "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-blue-600/20 shadow-lg",
    facebook:
      "bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#166FE5] shadow-[#1877F2]/20 shadow-lg",
    instagram:
      "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white border-pink-500 hover:opacity-90 shadow-pink-500/20 shadow-lg",
    zomato:
      "bg-[#E23744] text-white border-[#CB202D] hover:bg-[#CB202D] shadow-[#E23744]/20 shadow-lg",
    swiggy:
      "bg-[#FC8019] text-white border-[#E46D08] hover:bg-[#E46D08] shadow-[#FC8019]/20 shadow-lg",
    justdial:
      "bg-[#FF6600] text-white border-[#e55c00] hover:bg-[#e55c00] shadow-[#FF6600]/20 shadow-lg",
    practo:
      "bg-[#5FBF24] text-white border-[#4da81d] hover:bg-[#4da81d] shadow-[#5FBF24]/20 shadow-lg",
    tripadvisor:
      "bg-[#34E0A1] text-slate-900 border-[#34E0A1] hover:bg-[#2CBF89] shadow-[#34E0A1]/20 shadow-lg",
    yelp: "bg-[#FF1A1A] text-white border-[#E60000] hover:bg-[#E60000] shadow-[#FF1A1A]/20 shadow-lg",
    trustpilot:
      "bg-[#00B67A] text-white border-[#009966] hover:bg-[#009966] shadow-[#00B67A]/20 shadow-lg",
    custom:
      "bg-slate-800 text-white border-slate-900 hover:bg-slate-900 shadow-slate-800/20 shadow-lg",
  };
  return map[platform.toLowerCase()] || map["custom"];
}
