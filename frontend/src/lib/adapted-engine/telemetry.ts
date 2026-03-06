/**
 * AdaptEd - Adaptive Cognitive Load Engine
 * Phase 1: TelemetryObserver
 * 
 * High-performance telemetry system that tracks user interactions
 * to measure cognitive load indicators.
 */

interface TelemetryDataPoint {
  timestamp: number;
  velocity: number;
  directionChange: boolean;
  backspace: boolean;
  dwellTime: number;
}

interface TelemetrySnapshot {
  velocity: number;
  directionChanges: number;
  backspaceRate: number;
  dwellTime: number;
}

export class TelemetryObserver {
  private dataWindow: TelemetryDataPoint[] = [];
  private readonly WINDOW_SIZE_MS = 30000; // 30 seconds
  private readonly THROTTLE_MS = 100;
  private readonly BACKSPACE_WINDOW_MS = 10000; // 10 seconds for backspace rate
  
  // Mouse tracking
  private lastMouseX = 0;
  private lastMouseY = 0;
  private lastMouseTime = 0;
  private lastVelocityX = 0;
  private lastVelocityY = 0;
  private currentDwellTime = 0;
  private dwellStartTime = 0;
  private isDwelling = false;
  private dwellThreshold = 50; // pixels - mouse must stay within this radius
  private dwellCheckX = 0;
  private dwellCheckY = 0;
  
  // Throttling
  private throttleTimer: number | null = null;
  
  // Event listeners
  private boundHandlers: Map<string, EventListener> = new Map();

  constructor() {
    this.init();
  }

  private init(): void {
    // Create throttled handlers
    const mouseMoveHandler = this.throttle((e: Event) => this.handleMouseMove(e as MouseEvent), this.THROTTLE_MS);
    const mouseDownHandler = this.throttle((e: Event) => this.handleMouseDown(e as MouseEvent), this.THROTTLE_MS);
    const scrollHandler = this.throttle((e: Event) => this.handleScroll(e), this.THROTTLE_MS);
    const keyDownHandler = this.throttle((e: Event) => this.handleKeyDown(e as KeyboardEvent), this.THROTTLE_MS);

    // Store bound handlers for cleanup
    this.boundHandlers.set('mousemove', mouseMoveHandler);
    this.boundHandlers.set('mousedown', mouseDownHandler);
    this.boundHandlers.set('scroll', scrollHandler);
    this.boundHandlers.set('keydown', keyDownHandler);

    // Attach event listeners
    document.addEventListener('mousemove', mouseMoveHandler, { passive: true });
    document.addEventListener('mousedown', mouseDownHandler, { passive: true });
    document.addEventListener('scroll', scrollHandler, { passive: true });
    document.addEventListener('keydown', keyDownHandler);
  }

  /**
   * High-performance throttle implementation
   * Only processes events every THROTTLE_MS milliseconds
   */
  private throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Handle mouse movement - calculate velocity and direction changes
   */
  private handleMouseMove(event: MouseEvent): void {
    const now = performance.now();
    const x = event.clientX;
    const y = event.clientY;

    if (this.lastMouseTime > 0) {
      const deltaTime = now - this.lastMouseTime;
      const deltaX = x - this.lastMouseX;
      const deltaY = y - this.lastMouseY;
      
      // Calculate velocity (pixels per millisecond)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = deltaTime > 0 ? distance / deltaTime : 0;
      
      // Calculate velocity components for direction change detection
      const velocityX = deltaTime > 0 ? deltaX / deltaTime : 0;
      const velocityY = deltaTime > 0 ? deltaY / deltaTime : 0;
      
      // Detect direction change (sharp angle change in velocity vector)
      let directionChange = false;
      if (this.lastVelocityX !== 0 || this.lastVelocityY !== 0) {
        // Calculate dot product to detect direction reversal
        const dotProduct = velocityX * this.lastVelocityX + velocityY * this.lastVelocityY;
        const magnitudeProduct = Math.sqrt(
          (velocityX * velocityX + velocityY * velocityY) *
          (this.lastVelocityX * this.lastVelocityX + this.lastVelocityY * this.lastVelocityY)
        );
        
        // If angle is > 90 degrees (dot product < 0), it's a sharp direction change
        if (magnitudeProduct > 0) {
          const cosAngle = dotProduct / magnitudeProduct;
          directionChange = cosAngle < -0.5; // ~120 degrees or more
        }
      }
      
      this.lastVelocityX = velocityX;
      this.lastVelocityY = velocityY;
      
      // Check for dwell (mouse staying still)
      this.updateDwellTime(x, y, now);
      
      // Add data point
      this.addDataPoint({
        timestamp: now,
        velocity,
        directionChange,
        backspace: false,
        dwellTime: this.currentDwellTime
      });
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
    this.lastMouseTime = now;
  }

  /**
   * Track dwell time - how long mouse stays in one area
   */
  private updateDwellTime(x: number, y: number, now: number): void {
    const distance = Math.sqrt(
      Math.pow(x - this.dwellCheckX, 2) + Math.pow(y - this.dwellCheckY, 2)
    );

    if (distance < this.dwellThreshold) {
      // Mouse is dwelling
      if (!this.isDwelling) {
        this.isDwelling = true;
        this.dwellStartTime = now;
      }
      this.currentDwellTime = now - this.dwellStartTime;
    } else {
      // Mouse moved significantly
      this.isDwelling = false;
      this.currentDwellTime = 0;
      this.dwellCheckX = x;
      this.dwellCheckY = y;
    }
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(_event: MouseEvent): void {
    const now = performance.now();
    
    this.addDataPoint({
      timestamp: now,
      velocity: 0,
      directionChange: false,
      backspace: false,
      dwellTime: this.currentDwellTime
    });
  }

  /**
   * Handle scroll events
   */
  private handleScroll(_event: Event): void {
    const now = performance.now();
    
    this.addDataPoint({
      timestamp: now,
      velocity: 0,
      directionChange: false,
      backspace: false,
      dwellTime: 0
    });
  }

  /**
   * Handle keyboard events - track backspace rate
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const now = performance.now();
    const isBackspace = event.key === 'Backspace';
    
    this.addDataPoint({
      timestamp: now,
      velocity: 0,
      directionChange: false,
      backspace: isBackspace,
      dwellTime: this.currentDwellTime
    });
  }

  /**
   * Add a data point to the sliding window
   */
  private addDataPoint(dataPoint: TelemetryDataPoint): void {
    this.dataWindow.push(dataPoint);
    this.cleanOldData();
  }

  /**
   * Remove data points older than WINDOW_SIZE_MS
   */
  private cleanOldData(): void {
    const now = performance.now();
    const cutoffTime = now - this.WINDOW_SIZE_MS;
    
    // Remove old data points
    this.dataWindow = this.dataWindow.filter(
      point => point.timestamp > cutoffTime
    );
  }

  /**
   * Get current snapshot of averaged metrics
   */
  public getSnapshot(): TelemetrySnapshot {
    this.cleanOldData();
    
    if (this.dataWindow.length === 0) {
      return {
        velocity: 0,
        directionChanges: 0,
        backspaceRate: 0,
        dwellTime: 0
      };
    }

    const now = performance.now();
    const backspaceCutoff = now - this.BACKSPACE_WINDOW_MS;
    
    // Calculate metrics
    let totalVelocity = 0;
    let directionChangeCount = 0;
    let backspaceCount = 0;
    let maxDwellTime = 0;
    
    for (const point of this.dataWindow) {
      totalVelocity += point.velocity;
      if (point.directionChange) directionChangeCount++;
      if (point.backspace && point.timestamp > backspaceCutoff) backspaceCount++;
      if (point.dwellTime > maxDwellTime) maxDwellTime = point.dwellTime;
    }
    
    const avgVelocity = totalVelocity / this.dataWindow.length;
    
    return {
      velocity: Math.round(avgVelocity * 1000) / 1000, // Round to 3 decimals
      directionChanges: directionChangeCount,
      backspaceRate: backspaceCount,
      dwellTime: Math.round(maxDwellTime)
    };
  }

  /**
   * Get raw data window for debugging
   */
  public getDataWindow(): TelemetryDataPoint[] {
    return [...this.dataWindow];
  }

  /**
   * Get window statistics
   */
  public getWindowStats(): { size: number; timeSpan: number } {
    if (this.dataWindow.length === 0) {
      return { size: 0, timeSpan: 0 };
    }
    
    const oldest = this.dataWindow[0].timestamp;
    const newest = this.dataWindow[this.dataWindow.length - 1].timestamp;
    
    return {
      size: this.dataWindow.length,
      timeSpan: newest - oldest
    };
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    for (const [event, handler] of this.boundHandlers) {
      document.removeEventListener(event, handler as EventListener);
    }
    this.boundHandlers.clear();
    this.dataWindow = [];
    
    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer);
    }
  }
}
