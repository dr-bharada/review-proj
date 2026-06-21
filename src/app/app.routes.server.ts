import { RenderMode, type ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
  {
    path: "r/:slug",
    renderMode: RenderMode.Server,
  },
  {
    path: "dashboard",
    renderMode: RenderMode.Client,
  },
  {
    path: "**",
    renderMode: RenderMode.Prerender,
  },
];
