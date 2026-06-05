
// utils/errorLogger.ts
import { v4 as uuidv4 } from 'uuid';
import { MiaAlert } from '../types';
import { appEventBus } from '../lib/eventBus';

export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * Creates a user-friendly, actionable error message from a raw API error object.
 * @param error The error object caught from an API call.
 * @returns A string containing a user-friendly message.
 */
export const parseApiError = (error: any): string => {
    let detailedMessage = '';

    // 1. Unpack the error message from various possible structures
    if (typeof error === 'string') {
        detailedMessage = error;
    } else if (error?.error?.message) {
        // Handle { error: { message: "..." } } structure (common in Google APIs)
        detailedMessage = error.error.message;
    } else if (error?.message) {
        detailedMessage = error.message;
    } else {
        try {
            detailedMessage = JSON.stringify(error);
        } catch {
            detailedMessage = 'Unknown error object';
        }
    }

    // 2. If the message is a JSON string, try to parse it to get the inner text
    if (typeof detailedMessage === 'string' && detailedMessage.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(detailedMessage);
            if (parsed.error?.message) {
                detailedMessage = parsed.error.message;
            } else if (parsed.message) {
                detailedMessage = parsed.message;
            }
        } catch (e) {
            // Not a JSON string, assume it's the raw text
        }
    }

    const lowerMsg = detailedMessage.toLowerCase();

    // 3. Match specific error patterns with actionable advice

    // -- Authentication / API Key --
    if (lowerMsg.includes('api key') || lowerMsg.includes('403') || lowerMsg.includes('unauthenticated')) {
        return 'Authentication Failed: The API key provided is invalid, expired, or missing. Please verify your settings configuration.';
    }

    // -- Quota / Billing --
    if (lowerMsg.includes('quota') || lowerMsg.includes('billing')) {
        return "Quota Exceeded: You have reached the API usage limit for your current Google AI Studio plan. Please check your billing details.";
    }
    if (lowerMsg.includes('429') || lowerMsg.includes('resource_exhausted')) {
        return 'Rate Limit Hit: The system is making too many requests too quickly. Please wait a moment before trying again.';
    }

    // -- Connectivity --
    if (lowerMsg.includes('fetch') || lowerMsg.includes('network') || lowerMsg.includes('failed to fetch')) {
        return 'Connection Issue: Unable to reach the AI service. Please check your internet connection and ensure no firewall is blocking access to Google APIs.';
    }
    if (lowerMsg.includes('503') || lowerMsg.includes('unavailable')) {
        return 'Service Unavailable: The AI service is currently experiencing high load or downtime. Please try again in a few minutes.';
    }

    // -- Content / Safety --
    if (lowerMsg.includes('safety') || lowerMsg.includes('blocked') || lowerMsg.includes('harmful')) {
        return 'Safety Block: The request was blocked by the model\'s safety filters. Please try rephrasing your prompt to be less ambiguous.';
    }
    
    // -- Input / Format --
    if (lowerMsg.includes('image') && (lowerMsg.includes('format') || lowerMsg.includes('decode') || lowerMsg.includes('corrupt'))) {
        return 'Unsupported Image: The model could not process the provided image. Please ensure it is a valid JPEG, PNG, or WebP file.';
    }
    if (lowerMsg.includes('400') || lowerMsg.includes('invalid argument')) {
        return 'Invalid Request: The input data was malformed or missing required fields. If using a custom prompt, check the prompt syntax.';
    }

    // 4. Clean up Google's formatted error strings like "[400 Bad Request] The model ... does not exist."
    const match = detailedMessage.match(/\[\d{3}.*?\]\s*(.*)/);
    if (match && match[1]) {
        return match[1];
    }

    // If we extracted a meaningful message, return it; otherwise fallback
    if (detailedMessage && detailedMessage !== '{}' && !detailedMessage.includes('[object Object]')) {
        return detailedMessage;
    }

    return 'An unexpected system error occurred. Please use the "Diagnose" button for a detailed analysis.';
}

export const logFrontendError = (
  error: any,
  severity: ErrorSeverity = ErrorSeverity.Medium,
  context?: Record<string, any>
) => {
  let message: string;
  let stack: string | undefined;
  let title: string = "An error occurred";

  // Attempt to extract meaningful message from error object
  if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
    title = error.name;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Event && error.type === 'error') {
    message = (error as ErrorEvent).message || 'An unknown error occurred from an Event.';
    title = 'Unhandled Error Event';
  } else {
    title = 'Unknown Error';
    if (typeof error === 'object' && error !== null) {
        if (error.message) {
            message = String(error.message);
        } else {
            try {
                message = JSON.stringify(error);
            } catch {
                message = 'An un-serializable object was thrown.';
            }
        }
        if (error.stack) {
            stack = String(error.stack);
        }
    } else {
        message = 'An unknown value was thrown.';
    }
  }

  // --- Clean up JSON-stringified messages ---
  if (message && message.trim().startsWith('{')) {
      try {
          const parsed = JSON.parse(message);
          if (parsed.error?.message) {
              message = parsed.error.message;
              if (parsed.error.code) title = `API Error ${parsed.error.code}`;
          } else if (parsed.message) {
              message = parsed.message;
          }
      } catch (e) {
          // Ignore parse errors, keep original message
      }
  }

  // --- Map Status Codes to Titles ---
  if (message.includes('429') || message.toLowerCase().includes('quota')) {
      title = 'Quota Exceeded';
  } else if (message.includes('503')) {
      title = 'Service Unavailable';
  }

  const errorContext = {
    ...context,
    stack: stack,
    timestamp: new Date().toISOString(),
  };

  // Log to console for immediate developer feedback.
  console.error('[AetherShunt ErrorLogger] - An error was caught:');
  console.error('  Severity:', severity);
  console.error('  Title:', title);
  console.error('  Message:', message);
  console.error('  Context:', errorContext);

  // Map severity to Mia's alert levels
  let miaSeverity: 'info' | 'warning' | 'critical';
  switch (severity) {
    case ErrorSeverity.Critical:
    case ErrorSeverity.High:
      miaSeverity = 'critical';
      break;
    case ErrorSeverity.Medium:
      miaSeverity = 'warning';
      break;
    case ErrorSeverity.Low:
    default:
      miaSeverity = 'info';
      break;
  }

  // Create an alert for Mia to handle, but only for medium severity and above
  if (severity === ErrorSeverity.Medium || severity === ErrorSeverity.High || severity === ErrorSeverity.Critical) {
    const alert: MiaAlert = {
      id: uuidv4(),
      type: 'error_diagnosis',
      severity: miaSeverity,
      title: title,
      message: message,
      timestamp: new Date().toISOString(),
      context: errorContext,
      actions: [{ label: 'Diagnose Error', actionType: 'diagnose' }]
    };
    appEventBus.emit('mia-alert', alert);
  }
};

export const setupGlobalErrorHandlers = () => {
  window.onerror = (message, source, lineno, colno, error) => {
    logFrontendError(error || message, ErrorSeverity.Critical, {
      source,
      lineno,
      colno,
      context: 'window.onerror',
    });
    return true;
  };

  window.onunhandledrejection = (event) => {
    logFrontendError(event.reason, ErrorSeverity.High, {
      context: 'window.onunhandledrejection',
    });
  };
};
