import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index-legacy.css";
import "@radix-ui/themes/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Theme } from "@radix-ui/themes";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Theme>
        <App />
        <ReactQueryDevtools />
      </Theme>
    </QueryClientProvider>
  </React.StrictMode>,
);
