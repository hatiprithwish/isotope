import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/chrome-extension";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles.css";

// A capture is always against the tab open right now, so nothing is worth reusing across opens.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0 } },
});

const PUBLISHABLE_KEY = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY;
const SYNC_HOST = import.meta.env.WXT_WEB_ORIGIN;

const root = document.getElementById("root");
if (!root) throw new Error("Side panel root element is missing");

if (!PUBLISHABLE_KEY || !SYNC_HOST) {
  // Surfaced in the panel rather than thrown — a blank side panel gives the user nothing to act on.
  ReactDOM.createRoot(root).render(
    <div className="p-4 text-[13px] leading-relaxed text-destructive">
      Extension is misconfigured: WXT_CLERK_PUBLISHABLE_KEY and WXT_WEB_ORIGIN must be set at build
      time.
    </div>,
  );
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      {/* syncHost borrows the session from the web app, so signing in there signs in here. */}
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} syncHost={SYNC_HOST}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ClerkProvider>
    </React.StrictMode>,
  );
}
