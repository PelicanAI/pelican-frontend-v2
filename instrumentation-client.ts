// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d77e0a5be44d5c1dddfddebe2ac38a90@o4510343032799232.ingest.us.sentry.io/4510343040663552",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content to protect user privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Sample 10% of traces to reduce performance overhead
  tracesSampleRate: 0.1,

  // Enable experimental logs feature
  _experiments: {
    enableLogs: true,
  },

  // Sample 10% of normal sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Scrub sensitive trading and auth data before sending to Sentry
  beforeSend(event, hint) {
    // Strip sensitive headers from fetch/xhr requests
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["Authorization"];
      delete event.request.headers["x-api-key"];
      delete event.request.headers["X-Api-Key"];
    }

    // Strip query strings that may contain sensitive data
    if (event.request?.query_string) {
      event.request.query_string = "[REDACTED]";
    }

    // Strip sensitive breadcrumb data (trading positions, prices, portfolio info)
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          const sanitizedData = { ...breadcrumb.data };
          
          // Remove sensitive trading data fields
          delete sanitizedData.positions;
          delete sanitizedData.entry_price;
          delete sanitizedData.portfolio;
          delete sanitizedData.balance;
          delete sanitizedData.api_key;
          delete sanitizedData.token;
          
          return { ...breadcrumb, data: sanitizedData };
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // DO NOT send user PII
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;