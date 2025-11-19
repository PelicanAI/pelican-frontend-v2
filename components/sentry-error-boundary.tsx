'use client';

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function SentryErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}) {
  return (
    <Sentry.ErrorBoundary
      fallback={fallback || ErrorFallback}
      showDialog={false}
      onError={(error, errorInfo) => {
        console.error('ErrorBoundary caught:', error, errorInfo);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error);
    }
  }, [error]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We've been notified and are working on a fix.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/chat'}>
            New Chat
          </Button>
        </div>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-muted rounded max-w-2xl w-full">
          <summary className="cursor-pointer font-semibold mb-2">
            Error Details (Dev Only)
          </summary>
          <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

