import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardPage } from "@/pages/dashboard";
import { ReposPage } from "@/pages/repos";
import { SettingsPage } from "@/pages/settings";
import { SessionCreatePage } from "@/pages/session-create";
import { SessionPromptPage } from "@/pages/session-prompt";
import { SessionActionsPage } from "@/pages/session-actions";

const rootRoute = createRootRoute({
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const reposRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/repos",
  component: ReposPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const sessionNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/new",
  component: SessionCreatePage,
});

const sessionPromptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$sessionId/prompt",
  component: SessionPromptPage,
});

const sessionActionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$sessionId/actions",
  component: SessionActionsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  reposRoute,
  settingsRoute,
  sessionNewRoute,
  sessionPromptRoute,
  sessionActionsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
