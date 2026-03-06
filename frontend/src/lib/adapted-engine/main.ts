import { TelemetryObserver } from './telemetry';
import './mutator'; // Initialize DOM mutator (listens for events)
import { aiSimplifier, configureAISimplifier } from './simplifier';
import { visionTracker } from './vision';
import { paragraphTracker } from './paragraph-tracker';

// Export for external use
(window as any).aiSimplifier = aiSimplifier;
(window as any).configureAISimplifier = configureAISimplifier;
(window as any).visionTracker = visionTracker;
(window as any).paragraphTracker = paragraphTracker;

// Custom event for cognitive overload
declare global {
  interface WindowEventMap {
    'ADAPTED_OVERLOAD_TRIGGERED': CustomEvent<{ score: number; level: string }>;
    'ADAPTED_VISION_UPDATE': CustomEvent<any>;
  }
}

interface CognitiveLoadResult {
  score: number;
  factors: {
    velocityVariance: number;
    backspaceImpact: number;
    dwellImpact: number;
    directionImpact: number;
    smoothnessBonus: number;
  };
  level: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

// Initialize the telemetry observer
const observer = new TelemetryObserver();

// Initialize the cognitive engine worker
const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
  type: 'module'
});

// Handle messages from worker
worker.onmessage = (event) => {
  if (event.data.type === 'WORKER_READY') {
    console.log('✅ Cognitive Engine Worker initialized');
    return;
  }
  
  if (event.data.type === 'LOAD_CALCULATED') {
    const result: CognitiveLoadResult = event.data.result;
    
    // Update cognitive load display
    updateCognitiveLoadUI(result);
    
    // Trigger overload event if score > 0.7
    if (result.score > 0.7) {
      const overloadEvent = new CustomEvent('ADAPTED_OVERLOAD_TRIGGERED', {
        detail: {
          score: result.score,
          level: result.level,
          factors: result.factors,
          recommendations: result.recommendations
        }
      });
      window.dispatchEvent(overloadEvent);
      
      console.warn('🚨 COGNITIVE OVERLOAD TRIGGERED!', {
        score: result.score,
        level: result.level,
        recommendations: result.recommendations
      });
    }
    
    // Log detailed results
    console.log('🧠 Cognitive Load Analysis:', {
      score: result.score,
      level: result.level,
      factors: result.factors,
      recommendations: result.recommendations
    });
  }
};

// Send telemetry snapshot to worker every 3 seconds
const workerInterval = setInterval(() => {
  const snapshot = observer.getSnapshot();
  worker.postMessage({
    type: 'CALCULATE_LOAD',
    snapshot
  });
}, 3000);

// Update UI with metrics every 200ms
const updateInterval = setInterval(() => {
  const snapshot = observer.getSnapshot();
  
  // Update metric displays
  updateMetric('velocity', snapshot.velocity.toFixed(3));
  updateMetric('directionChanges', snapshot.directionChanges.toString());
  updateMetric('backspaceRate', snapshot.backspaceRate.toString());
  updateMetric('dwellTime', snapshot.dwellTime.toString());
}, 200);

function updateMetric(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
    
    // Add visual feedback on update
    element.style.transition = 'none';
    element.style.color = '#007bff';
    setTimeout(() => {
      element.style.transition = 'color 0.3s';
      element.style.color = '#333';
    }, 50);
  }
}

function updateCognitiveLoadUI(result: CognitiveLoadResult): void {
  // Update cognitive load score display
  const scoreElement = document.getElementById('cognitiveScore');
  if (scoreElement) {
    scoreElement.textContent = (result.score * 100).toFixed(0);
  }
  
  // Update level display
  const levelElement = document.getElementById('cognitiveLevel');
  if (levelElement) {
    levelElement.textContent = result.level.toUpperCase();
    
    // Color code by level
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    levelElement.style.color = colors[result.level];
  }
  
  // Update recommendations
  const recsElement = document.getElementById('recommendations');
  if (recsElement && result.recommendations.length > 0) {
    recsElement.innerHTML = result.recommendations
      .map(rec => `<li>${rec}</li>`)
      .join('');
  }
}

// Listen for overload events
window.addEventListener('ADAPTED_OVERLOAD_TRIGGERED', (event) => {
  console.log('🔔 Overload event received:', event.detail);
  
  // Visual alert
  document.body.style.transition = 'background-color 0.5s';
  document.body.style.backgroundColor = '#fff3cd';
  setTimeout(() => {
    document.body.style.backgroundColor = '#f5f5f5';
  }, 2000);
  
  // Show alert banner
  showOverloadAlert(event.detail);
});

function showOverloadAlert(detail: any): void {
  // Remove existing alert if any
  const existingAlert = document.getElementById('overload-alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  // Create alert banner
  const alert = document.createElement('div');
  alert.id = 'overload-alert';
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 9999;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  alert.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
      <span style="font-size: 1.5rem;">🚨</span>
      <strong>High Cognitive Load Detected!</strong>
    </div>
    <p style="margin: 0; font-size: 0.875rem;">
      Score: ${(detail.score * 100).toFixed(0)}% | Level: ${detail.level}
    </p>
  `;
  
  document.body.appendChild(alert);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    alert.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  clearInterval(updateInterval);
  clearInterval(workerInterval);
  worker.terminate();
  observer.destroy();
});

// Listen for vision metrics updates
window.addEventListener('ADAPTED_VISION_UPDATE', (event: any) => {
  const metrics = event.detail;
  
  // Update vision metrics display if elements exist
  updateVisionMetric('eyeSaccadeRate', metrics.eyeSaccadeRate.toFixed(1));
  updateVisionMetric('pupilDilation', (metrics.pupilDilation * 100).toFixed(0) + '%');
  
  // Face presence - Just Yes/No during tracking (percentage shown at end)
  const faceStatus = metrics.facePresent ? '✅ Yes' : '❌ No';
  updateVisionMetric('facePresent', faceStatus);
  
  updateVisionMetric('attentionScore', (metrics.attentionScore * 100).toFixed(0) + '%');
  
  // Check for copying or distraction
  if (visionTracker.isLikelyCopying()) {
    console.warn('⚠️ User may be copying from another source');
  }
  
  if (visionTracker.isDistracted()) {
    console.warn('⚠️ User appears distracted');
  }
  
  if (visionTracker.hasReadingDifficulty()) {
    console.warn('⚠️ Reading difficulty detected (high saccade rate)');
  }
});

function updateVisionMetric(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
    
    // Add visual feedback
    element.style.transition = 'none';
    element.style.color = '#28a745';
    setTimeout(() => {
      element.style.transition = 'color 0.3s';
      element.style.color = '#333';
    }, 50);
  }
}

// Enable vision tracking button - Manual control only
document.getElementById('enable-vision-btn')?.addEventListener('click', async () => {
  const button = document.getElementById('enable-vision-btn') as HTMLButtonElement;
  
  if (visionTracker.isEnabled()) {
    // Disable
    visionTracker.stop();
    button.textContent = 'Enable Webcam Tracking';
    button.style.background = '#28a745';
    console.log('🛑 Webcam tracking disabled by user');
  } else {
    // Enable
    button.textContent = 'Initializing...';
    button.disabled = true;
    
    const success = await visionTracker.initialize();
    
    if (success) {
      button.textContent = 'Disable Webcam Tracking';
      button.style.background = '#dc3545';
      button.disabled = false;
      console.log('✅ Webcam tracking enabled - will trace until disabled');
    } else {
      button.textContent = 'Enable Webcam Tracking (Failed)';
      button.style.background = '#6c757d';
      button.disabled = false;
      
      alert('Failed to access webcam. Please grant camera permissions and try again.');
    }
  }
});

// Listen for reset completion
window.addEventListener('ADAPTED_RESET_COMPLETE', () => {
  console.log('✅ Focus mode reset complete');
});

// Add some helpful console messages
console.log('%c🧠 AdaptEd Cognitive Load Engine - Phase 3', 'font-size: 16px; font-weight: bold; color: #007bff;');
console.log('✅ Telemetry Observer initialized');
console.log('✅ Cognitive Engine Worker initialized');
console.log('✅ DOM Mutator initialized');
console.log('\nPhase 1 - Telemetry Tracking:');
console.log('  • Mouse velocity (px/ms)');
console.log('  • Direction changes (sharp turns)');
console.log('  • Backspace rate (last 10s)');
console.log('  • Dwell time (hover duration)');
console.log('\nPhase 2 - Cognitive Load Analysis:');
console.log('  • Velocity variance analysis');
console.log('  • Backspace impact scoring');
console.log('  • Dwell time impact (15s threshold)');
console.log('  • Direction change patterns');
console.log('  • Smoothness bonus calculation');
console.log('\nPhase 3 - Adaptive UI Mutations:');
console.log('  • Focus mode activation');
console.log('  • Distraction hiding (opacity: 0.1)');
console.log('  • Content enhancement (font-size, line-height)');
console.log('  • Stuck paragraph highlighting');
console.log('  • Reset button for manual control');
console.log('\nFinal Phase - AI Text Simplification:');
console.log('  • Mock AI simplification (2s delay)');
console.log('  • OpenAI integration ready');
console.log('  • Gemini integration ready');
console.log('  • 3-bullet point summaries');
console.log('  • Fade-in animations');
console.log('  • Restore original content');
console.log('\n⚡ Worker updates every 3 seconds');
console.log('🚨 Overload event triggers at score > 0.7');
console.log('🎨 DOM mutations apply automatically on overload');
console.log('🤖 AI simplification triggers at score > 0.85');
console.log('\nPhase 4 - Visual Attention Tracking:');
console.log('  • Webcam-based eye tracking (manual enable)');
console.log('  • Saccade detection (reading difficulty)');
console.log('  • Pupil dilation monitoring');
console.log('  • Face presence detection');
console.log('  • Copying detection');
console.log('  • Distraction detection');
console.log('  • Privacy mode enabled');
console.log('  • Continuous tracking until disabled');
console.log('\nPhase 5 - Paragraph-Level Intelligence:');
console.log('  • Per-paragraph cursor movement tracking');
console.log('  • Per-paragraph dwell time monitoring');
console.log('  • Inactivity detection (5 seconds)');
console.log('  • Level 1: Simplify at 50 movements OR 10s dwell');
console.log('  • Level 2: Hyper-focus at 30 movements OR 8s dwell (after simplification)');
console.log('  • Level 3: Auto-simplify ALL paragraphs after 5s inactivity');
console.log('  • Progressive intervention based on struggle');
console.log('\n💡 Configure AI: window.configureAISimplifier({ provider: "openai", apiKey: "..." })');
console.log('👁️ Enable vision: Click "Enable Webcam Tracking" button (manual control only)');
