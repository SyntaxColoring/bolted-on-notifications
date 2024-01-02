import React from "react";
import ReactDOM from "react-dom/client";
import "@radix-ui/themes/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Theme } from "@radix-ui/themes";
import { Router, RouterProvider } from "@tanstack/react-router";

import { rootRoute } from "./Root.tsx";
import { notFoundRoute } from "./pages/NotFoundPage.tsx";
import { route as homeRoute } from "./pages/HomePage.tsx";
import { route as textRoute } from "./pages/TextPage.tsx";
import { route as buttonsRoute } from "./pages/ButtonsPage.tsx";

const routeTree = rootRoute.addChildren([homeRoute, textRoute, buttonsRoute]);
const router = new Router({ routeTree, notFoundRoute });

// https://tanstack.com/router/v1/docs/guide/routes#registering-router-types
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Theme>
        <RouterProvider router={router} />
        <ReactQueryDevtools />
      </Theme>
    </QueryClientProvider>
  </React.StrictMode>,
);
