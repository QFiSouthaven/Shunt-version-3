
import React, { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SettingsProvider } from '../context/SettingsContext';
import { TelemetryProvider } from '../context/TelemetryContext';
import { MCPProvider } from '../context/MCPContext';
import { MailboxProvider } from '../context/MailboxContext';
import { MiaProvider } from '../context/MiaContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { AuthProvider } from '../context/AuthContext';
import { GlobalTelemetryContext } from '../types/telemetry';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Fallback IDs for anonymous users
  const initialUserID = localStorage.getItem('userID') || `anon_${uuidv4()}`;
  const initialSessionID = sessionStorage.getItem('sessionID') || `session_${uuidv4()}`;

  // Side effects for ID persistence
  if (!localStorage.getItem('userID')) localStorage.setItem('userID', initialUserID);
  if (!sessionStorage.getItem('sessionID')) sessionStorage.setItem('sessionID', initialSessionID);

  const initialGlobalContext: GlobalTelemetryContext = {
    userID: initialUserID,
    sessionID: initialSessionID,
    appVersion: '2.1.0-oauth',
    browserInfo: navigator.userAgent,
  };

  return (
    <SettingsProvider>
      <AuthProvider>
        <TelemetryProvider initialGlobalContext={initialGlobalContext}>
            <MCPProvider>
            <MailboxProvider>
                <MiaProvider>
                <SubscriptionProvider>
                    {children}
                </SubscriptionProvider>
                </MiaProvider>
            </MailboxProvider>
            </MCPProvider>
        </TelemetryProvider>
      </AuthProvider>
    </SettingsProvider>
  );
};
