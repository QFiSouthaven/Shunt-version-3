
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setupGlobalErrorHandlers } from './utils/errorLogger';
import ErrorBoundary from './components/ErrorBoundary';

setupGlobalErrorHandlers();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* The <ErrorBoundary> component requires a 'children' prop. Wrapping <App /> inside it provides this prop and enables top-level error catching. */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);