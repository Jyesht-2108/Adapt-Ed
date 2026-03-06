# AdaptEd - Adaptive Cognitive Load Engine

## Phase 1: TelemetryObserver ✅
## Phase 2: Cognitive Engine Web Worker ✅
## Phase 3: DOM Mutator ✅
## Final Phase: AI Text Simplification ✅
## Phase 4: Visual Attention Tracking ✅

A complete, production-ready system that tracks user interactions, analyzes cognitive load in real-time, automatically adapts the UI, uses AI to simplify complex content, and monitors visual attention through webcam-based eye tracking for comprehensive behavioral analysis.

## Features

### 🎯 Phase 1: Core Metrics

1. **Velocity** (px/ms)
   - Tracks mouse movement speed
   - Calculated as distance traveled per millisecond
   - Higher velocity may indicate rushed or stressed behavior

2. **Direction Changes**
   - Counts sharp directional changes in mouse movement
   - Detects angle changes > 120 degrees
   - Frequent changes may indicate confusion or uncertainty

3. **Backspace Rate** (per 10 seconds)
   - Tracks backspace key presses in the last 10 seconds
   - High rate may indicate typing errors or cognitive overload

4. **Dwell Time** (milliseconds)
   - Measures how long the mouse stays in one area
   - Tracks hovering behavior over content
   - Long dwell times may indicate difficulty comprehending content

### 🎨 Phase 3: Adaptive UI Mutations

1. **Focus Mode Activation**
   - Automatically triggered when cognitive load > 70%
   - Adds `.adapted-overload` class to body
   - Smooth transitions and animations

2. **Distraction Reduction**
   - Hides sidebar, ads, and other distractions
   - Fades to 10% opacity
   - Disables pointer events
   - Targets: aside, .sidebar, .ad-container, nav, etc.

3. **Content Enhancement**
   - Increases font size by 15%
   - Increases line height by 25%
   - Improves readability automatically
   - Targets: article, main, .content, etc.

4. **Semantic Restructuring**
   - Detects "stuck" paragraph based on dwell time
   - Applies glowing purple border
   - Smooth scroll to center view
   - Pulsing animation for focus

5. **Manual Control**
   - Reset button appears bottom-right
   - "🔄 Exit Focus Mode"
   - Restores all original styles
   - Smooth slide animations

### 🤖 Final Phase: AI Text Simplification

1. **Intelligent Content Simplification**
   - Automatically triggered when cognitive load > 85% (CRITICAL)
   - Converts complex text into 3 clear bullet points
   - Mock API for development (2s delay)
   - Real API integration ready (OpenAI, Gemini)

2. **Mock API Implementation**
   - Promise-based with setTimeout
   - Extracts key sentences
   - Creates 3-point summaries
   - Format: "AI SIMPLIFIED: [3 Bullet Points]"

3. **Smooth Animations**
   - Fade-out before simplification (0.5s)
   - Loading indicator during processing
   - Fade-in after simplification (0.5s)
   - Total animation time: ~1 second

4. **Restore Functionality**
   - "📄 Show Original Content" button
   - Restores original text with animation
   - Preserves original HTML structure
   - Smooth 0.6s transition

5. **Configuration System**
   - Provider selection (mock/openai/gemini)
   - API key configuration
   - Model selection
   - Temperature and token limits
   - Configurable mock delay

6. **Caching System**
   - Instant results for repeated content
   - Reduces API calls and costs
   - Memory efficient
   - Cache statistics available

7. **API Integrations**
   - **OpenAI:** GPT-3.5/GPT-4 ready
   - **Gemini:** Gemini Pro ready
   - Easy configuration via `configureAISimplifier()`
   - Error handling for API failures

### 👁️ Phase 4: Visual Attention Tracking

1. **Webcam-based Eye Tracking**
   - Monitors eye saccades (rapid movements)
   - Tracks pupil dilation (cognitive load indicator)
   - Detects face presence (attention)
   - Calculates attention score (0-100%)

2. **Behavioral Detection**
   - **Copying Detection:** Identifies when user looks away frequently
   - **Distraction Detection:** Detects inattention or looking away
   - **Focus Detection:** Confirms active reading (2-5 saccades/s)
   - **Reading Difficulty:** High saccade rate (>6/s) indicates struggle

3. **Privacy-First Design**
   - All processing done locally in browser
   - No video frames stored or transmitted
   - User control (enable/disable anytime)
   - Privacy notice displayed
   - Compliant with privacy regulations

4. **Lightweight Implementation**
   - Skin tone detection for face presence
   - Brightness analysis for pupil dilation
   - Position tracking for saccades
   - TensorFlow.js integration ready for advanced tracking

5. **Real-time Metrics**
   - Eye Saccades: Per second
   - Pupil Dilation: 0-100%
   - Face Present: Yes/No
   - Attention Score: 0-100%

6. **Integration with Cognitive Load**
   - Combines with mouse/keyboard metrics
   - Enhanced overload detection
   - Multi-modal behavioral analysis
   - More accurate cognitive load assessment

### 🧠 Phase 2: Cognitive Load Analysis

1. **Cognitive Load Score** (0.0 to 1.0)
   - Weighted algorithm combining all metrics
   - Real-time analysis every 3 seconds
   - Runs in Web Worker (non-blocking)

2. **Load Level Classification**
   - LOW: Score < 0.4 (confident user)
   - MEDIUM: Score 0.4-0.7 (moderate difficulty)
   - HIGH: Score 0.7-0.85 (struggling)
   - CRITICAL: Score > 0.85 (severe overload)

3. **Overload Event System**
   - `ADAPTED_OVERLOAD_TRIGGERED` event fires when score > 0.7
   - Includes detailed factors and recommendations
   - Enables adaptive UI responses

4. **Smart Recommendations**
   - Context-aware suggestions based on behavior patterns
   - Identifies specific issues (comprehension, navigation, input)
   - Actionable guidance for content adaptation

### ⚡ Performance Optimizations

- **Throttling**: Events processed every 100ms to prevent performance degradation
- **Sliding Window**: Only keeps last 30 seconds of data in memory
- **Passive Listeners**: Uses passive event listeners where possible
- **Efficient Cleanup**: Automatically removes old data points

### 🏗️ Architecture

```
Browser Environment
├── Main Thread
│   ├── TelemetryObserver (Phase 1)
│   │   ├── Event Listeners (throttled 100ms)
│   │   ├── Metric Calculation
│   │   └── Sliding Window (30s)
│   │
│   └── Main Controller
│       ├── UI Updates (200ms)
│       ├── Worker Communication (3s)
│       └── Event Dispatch
│
└── Web Worker Thread (Phase 2)
    └── CognitiveEngine
        ├── Velocity Variance Analysis
        ├── Backspace Impact Scoring
        ├── Dwell Time Evaluation
        ├── Direction Pattern Analysis
        ├── Smoothness Bonus Calculation
        └── Recommendation Generation
```

## Installation

```bash
cd adapted-engine
npm install
```

## Usage

### Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```

### Phase 1: Basic Telemetry

```typescript
import { TelemetryObserver } from './telemetry';

// Initialize observer
const observer = new TelemetryObserver();

// Get current metrics
const snapshot = observer.getSnapshot();
console.log(snapshot);
// {
//   velocity: 0.234,
//   directionChanges: 5,
//   backspaceRate: 2,
//   dwellTime: 1500
// }

// Cleanup when done
observer.destroy();
```

### Phase 2: Cognitive Load Analysis

```typescript
// Listen for cognitive overload events
window.addEventListener('ADAPTED_OVERLOAD_TRIGGERED', (event) => {
  const { score, level, factors, recommendations } = event.detail;
  
  console.log(`Cognitive Load: ${(score * 100).toFixed(0)}%`);
  console.log(`Level: ${level}`);
  console.log('Recommendations:', recommendations);
  
  // Trigger adaptive UI changes
  if (level === 'high' || level === 'critical') {
    simplifyInterface();
    showHelpTooltips();
  }
});
```

### Complete Integration Example

```typescript
import { TelemetryObserver } from './telemetry';

// Initialize telemetry
const observer = new TelemetryObserver();

// Initialize cognitive engine worker
const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
  type: 'module'
});

// Send snapshots to worker every 3 seconds
setInterval(() => {
  const snapshot = observer.getSnapshot();
  worker.postMessage({
    type: 'CALCULATE_LOAD',
    snapshot
  });
}, 3000);

// Handle worker responses
worker.onmessage = (event) => {
  if (event.data.type === 'LOAD_CALCULATED') {
    const result = event.data.result;
    
    // Update UI
    updateCognitiveLoadDisplay(result);
    
    // Trigger overload event if needed
    if (result.score > 0.7) {
      window.dispatchEvent(new CustomEvent('ADAPTED_OVERLOAD_TRIGGERED', {
        detail: result
      }));
    }
  }
};
```

## API Reference

### `TelemetryObserver`

#### Constructor
```typescript
new TelemetryObserver()
```
Initializes the observer and attaches event listeners.

#### Methods

##### `getSnapshot(): TelemetrySnapshot`
Returns current averaged metrics from the sliding window.

**Returns:**
```typescript
{
  velocity: number;        // Average velocity in px/ms
  directionChanges: number; // Total direction changes in window
  backspaceRate: number;   // Backspaces in last 10 seconds
  dwellTime: number;       // Maximum dwell time in ms
}
```

##### `getWindowStats(): { size: number; timeSpan: number }`
Returns statistics about the data window.

##### `getDataWindow(): TelemetryDataPoint[]`
Returns raw data points (for debugging).

##### `destroy(): void`
Removes event listeners and cleans up resources.

## Configuration

You can modify these constants in `telemetry.ts`:

```typescript
private readonly WINDOW_SIZE_MS = 30000;      // 30 seconds
private readonly THROTTLE_MS = 100;           // 100ms throttle
private readonly BACKSPACE_WINDOW_MS = 10000; // 10 seconds
private dwellThreshold = 50;                  // 50 pixels
```

## Testing the System

1. **Velocity**: Move your mouse quickly across the screen
2. **Direction Changes**: Make sharp turns with your mouse
3. **Backspace Rate**: Type in the editable area and press backspace
4. **Dwell Time**: Hover your mouse over text without moving

Watch the metrics update in real-time on the dashboard.

## Technical Details

### Throttling Implementation
Uses a high-performance throttle that only processes events at specified intervals, preventing excessive calculations.

### Direction Change Detection
Uses vector dot product to calculate angle between consecutive velocity vectors. Changes > 120° are counted as sharp direction changes.

### Sliding Window
Automatically removes data points older than 30 seconds using efficient array filtering.

### Dwell Time Tracking
Monitors mouse position and starts a timer when the mouse stays within a 50-pixel radius. Resets when significant movement is detected.

## Future Enhancements (Phase 4+)

- [ ] Machine learning model for personalized scoring
- [ ] User preference persistence
- [ ] Heat map visualization
- [ ] Session recording and playback
- [ ] A/B testing framework
- [ ] Real-time collaboration features
- [ ] Analytics dashboard
- [ ] Multi-user comparison
- [ ] Accessibility improvements (keyboard shortcuts, screen reader support)
- [ ] Mobile responsive adaptations

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses modern ES6+ features)

## License

MIT

## Contributing

This is Phase 1 of the AdaptEd project. Contributions welcome!
