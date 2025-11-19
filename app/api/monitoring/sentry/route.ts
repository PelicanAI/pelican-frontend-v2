import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/**
 * GET - Health check for Sentry integration
 * Returns the current Sentry configuration status
 */
export async function GET() {
  try {
    // Check if Sentry is configured
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    
    if (!dsn) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'Sentry DSN not found in environment variables'
      }, { status: 503 });
    }
    
    // Send a test message to verify connectivity
    Sentry.captureMessage('Sentry health check', 'info');
    
    // Mask the DSN for security (hide auth token)
    const maskedDsn = dsn.replace(/:\w+@/, ':***@');
    
    return NextResponse.json({
      status: 'healthy',
      dsn: maskedDsn,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST - Send a test error to Sentry
 * Useful for verifying Sentry is capturing errors correctly
 */
export async function POST() {
  try {
    // Create and capture a test error
    const testError = new Error('Test error from monitoring endpoint');
    
    Sentry.captureException(testError, {
      tags: { 
        type: 'test',
        source: 'monitoring',
        endpoint: '/api/monitoring/sentry'
      },
      extra: {
        timestamp: new Date().toISOString(),
        purpose: 'Integration test'
      }
    });
    
    return NextResponse.json({
      message: 'Test error sent to Sentry successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to send test error to Sentry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

