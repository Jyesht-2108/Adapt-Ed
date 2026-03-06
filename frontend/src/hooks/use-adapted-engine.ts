import { useEffect, useRef } from 'react';

interface AdaptedEngineConfig {
  enableVision?: boolean;
  aiProvider?: 'mock' | 'openai' | 'gemini';
  apiKey?: string;
}

export function useAdaptedEngine(config: AdaptedEngineConfig = {}) {
  const initializedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;

    const initializeEngine = async () => {
      try {
        // Dynamically import the adapted-engine modules
        const { TelemetryObserver } = await import('@/lib/adapted-engine/telemetry');
        const { visionTracker } = await import('@/lib/adapted-engine/vision');
        const { aiSimplifier, configureAISimplifier } = await import('@/lib/adapted-engine/simplifier');
        
        // Initialize telemetry observer
        const observer = new TelemetryObserver();
        
        // Expose to window for dashboard access
        (window as any).telemetryObserver = observer;
        
        // Initialize cognitive engine worker
        const EngineWorker = await import('@/lib/adapted-engine/engine.worker?worker');
        const worker = new EngineWorker.default();
        
        // Expose to window for external access
        (window as any).visionTracker = visionTracker;
        (window as any).aiSimplifier = aiSimplifier;
        (window as any).configureAISimplifier = configureAISimplifier;
        
        // Configure AI - use Gemini by default
        const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        configureAISimplifier({
          provider: config.aiProvider || 'gemini',
          apiKey: config.apiKey || geminiApiKey,
        });
        
        // Send snapshots to worker every 3 seconds
        const workerInterval = setInterval(() => {
          const snapshot = observer.getSnapshot();
          worker.postMessage({
            type: 'CALCULATE_LOAD',
            snapshot
          });
        }, 3000);
        
        // Handle worker responses
        worker.onmessage = (event: MessageEvent) => {
          if (event.data.type === 'LOAD_CALCULATED') {
            const result = event.data.result;
            
            // Trigger overload event if score > 0.7
            if (result.score > 0.7) {
              const overloadEvent = new CustomEvent('ADAPTED_OVERLOAD_TRIGGERED', {
                detail: result
              });
              window.dispatchEvent(overloadEvent);
              
              console.warn('🚨 COGNITIVE OVERLOAD TRIGGERED!', result);
            }
          }
        };
        
        // Listen for cognitive overload events
        const handleOverload = (event: CustomEvent) => {
          console.log('🚨 Cognitive overload detected:', event.detail);
        };

        window.addEventListener('ADAPTED_OVERLOAD_TRIGGERED', handleOverload as EventListener);
        
        // Handle restore button clicks - delegated event listener
        const handleRestoreClick = (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          
          // Check if clicked element or any parent is the restore button
          const button = target.closest('.restore-original-btn');
          if (button) {
            event.preventDefault();
            event.stopPropagation();
            
            const simplifiedContent = button.closest('.ai-simplified-content');
            if (simplifiedContent && simplifiedContent.parentElement) {
              aiSimplifier.restoreOriginal(simplifiedContent.parentElement as HTMLElement);
            }
          }
        };
        
        document.addEventListener('click', handleRestoreClick, true);
        
        initializedRef.current = true;
        console.log('✅ AdaptEd Cognitive Engine initialized');

        // Store cleanup function
        cleanupRef.current = () => {
          clearInterval(workerInterval);
          worker.terminate();
          observer.destroy();
          window.removeEventListener('ADAPTED_OVERLOAD_TRIGGERED', handleOverload as EventListener);
          document.removeEventListener('click', handleRestoreClick, true);
          
          // Stop vision tracking if enabled
          if (visionTracker?.isEnabled()) {
            visionTracker.stop();
          }
        };
      } catch (error) {
        console.error('Error initializing adapted-engine:', error);
      }
    };

    initializeEngine();

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [config.aiProvider, config.apiKey]);

  return {
    isLoaded: initializedRef.current,
  };
}
