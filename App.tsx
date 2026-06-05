
import React, { useEffect, useState, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AppProviders } from './components/AppProviders';
import { useSettings } from './context/SettingsContext';
import MissionControl from './components/mission_control/MissionControl';
import MiaAssistant from './components/mia/MiaAssistant';
import LandingPage from './components/LandingPage';
import { LiveFeed } from './components/cortex/LiveFeed'; // Import the new Cortex Feed
import { useMiaContextTracker } from './hooks/useMiaContextTracker';
import { audioService } from './services/audioService';
import { appEventBus } from './lib/eventBus';
import { useAuth } from './context/AuthContext';
import { useTelemetry } from './context/TelemetryContext';
import Loader from './components/Loader';

// Fallback UI for critical crashes
const FatalErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <div role="alert" className="flex flex-col items-center justify-center h-screen bg-[#09090b] text-white p-6 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">System Critical Failure</h2>
      <pre className="bg-black/50 p-4 rounded border border-red-900 text-red-300 mb-6 max-w-2xl overflow-auto text-left font-mono text-sm">
        {error.message}
        {error.stack}
      </pre>
      <button 
        onClick={resetErrorBoundary}
        className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded text-white font-semibold transition-colors"
      >
        Reboot System
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <ErrorBoundary FallbackComponent={FatalErrorFallback}>
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#09090b]"><Loader className="w-12 h-12" /></div>}>
          <AppContent />
        </Suspense>
      </ErrorBoundary>
    </AppProviders>
  );
};

// This sub-component ensures context hooks are used within the provider scope
const AppContent: React.FC = () => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const { updateTelemetryContext } = useTelemetry();
    
    // State to track if the user has "Entered" the OS from the landing page
    const [isAppLaunched, setIsAppLaunched] = useState(false);
    // State for toggling the Cortex Feed
    const [showCortex, setShowCortex] = useState(true);
    
    useMiaContextTracker(); // Activate Mia's context tracking globally

    // Effect: Sync Auth User to Telemetry
    useEffect(() => {
        if (user) {
            updateTelemetryContext({ userID: user.id, activeProjectName: `${user.name}'s Workspace` });
        }
    }, [user, updateTelemetryContext]);

    // Effect: Global Style & Theme Management
    useEffect(() => {
        // Mia's font color
        document.documentElement.style.setProperty('--mia-font-color', settings.miaFontColor);
        
        // Dynamic background color
        document.body.style.backgroundColor = settings.backgroundColor;

        // Dynamic wallpaper
        document.body.style.backgroundImage = settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none';

        // Toggle animations globally via CSS class
        if (settings.animationsEnabled) {
            document.body.classList.add('animations-enabled');
        } else {
            document.body.classList.remove('animations-enabled');
        }
    }, [settings.miaFontColor, settings.backgroundColor, settings.backgroundImage, settings.animationsEnabled]);

    // Effect: Audio Service Configuration
    useEffect(() => {
        audioService.setMuted(!settings.audioFeedbackEnabled);
    }, [settings.audioFeedbackEnabled]);

    // Effect: Pre-compute and Validate Prompt Instruction Configuration
    useEffect(() => {
        const validatePromptSettings = () => {
            const risks: string[] = [];
            
            // Check for critical prompt safety layers
            if (!settings.inputSanitizationEnabled) {
                risks.push('Input Sanitization');
            }
            if (!settings.promptInjectionGuardEnabled) {
                risks.push('Prompt Injection Guard');
            }

            // If prompt construction logic is compromised, alert the user via Mia
            if (risks.length > 0 && isAppLaunched) { // Only alert if app is launched
                appEventBus.emit('mia-alert', {
                    id: 'prompt-integrity-warning',
                    type: 'system_health',
                    severity: 'warning',
                    title: 'Prompt Integrity Compromised',
                    message: `The prompt instruction set is being constructed without: ${risks.join(' & ')}. This may lead to malformed outputs or expose the LLM to injection attacks during conversion.`,
                    timestamp: new Date().toISOString(),
                    context: { 
                        disabledFeatures: risks,
                        recommendation: 'Enable all security safeguards in Settings.'
                    }
                });
            }
        };

        validatePromptSettings();
    }, [settings.inputSanitizationEnabled, settings.promptInjectionGuardEnabled, isAppLaunched]);

    const handleLaunch = () => {
        audioService.playSound('success');
        setIsAppLaunched(true);
    };

    if (!isAppLaunched) {
        return <LandingPage onLaunch={handleLaunch} />;
    }

    return (
        <div className="app-container w-full h-full flex overflow-hidden">
            <div className="flex-grow relative h-full">
                <ErrorBoundary FallbackComponent={FatalErrorFallback}>
                  <MissionControl />
                </ErrorBoundary>
                <ErrorBoundary FallbackComponent={FatalErrorFallback}>
                  <MiaAssistant />
                </ErrorBoundary>
            </div>
            
            {/* The Cortex "Live Feed" Panel - Integrated on the right edge */}
            {showCortex && (
                <div className="flex-shrink-0 h-full hidden xl:block animate-fade-in border-l border-gray-800">
                    <ErrorBoundary FallbackComponent={() => <div className="text-red-500 p-2 text-xs">Cortex Error</div>}>
                        <LiveFeed />
                    </ErrorBoundary>
                </div>
            )}
        </div>
    );
}

export default App;
