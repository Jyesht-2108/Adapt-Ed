/**
 * AdaptEd - Paragraph-Level Tracking System
 * Tracks cursor movement and dwell time on specific paragraphs
 * Triggers progressive interventions based on struggle indicators
 */

interface ParagraphMetrics {
  element: HTMLElement;
  cursorMovements: number;
  dwellTime: number;
  lastUpdate: number;
  isSimplified: boolean;
  isHyperFocused: boolean;
}

interface InterventionThresholds {
  cursorMovementLimit: number;  // Number of cursor movements
  dwellTimeLimit: number;        // Milliseconds of dwell time
  hyperFocusCursorLimit: number; // Cursor movements after simplification
  hyperFocusDwellLimit: number;  // Dwell time after simplification
}

export class ParagraphTracker {
  private paragraphMetrics: Map<HTMLElement, ParagraphMetrics> = new Map();
  private currentHoveredParagraph: HTMLElement | null = null;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private movementCount = 0;
  
  private thresholds: InterventionThresholds = {
    cursorMovementLimit: 50,      // 50 cursor movements
    dwellTimeLimit: 10000,         // 10 seconds dwell time
    hyperFocusCursorLimit: 30,     // 30 movements after simplification
    hyperFocusDwellLimit: 8000     // 8 seconds after simplification
  };

  // Inactivity detection
  private lastActivityTime: number = Date.now();
  private inactivityTimeout: number = 5000; // 5 seconds
  private hasTriggeredInactivitySimplification = false;

  constructor() {
    this.init();
  }

  private init(): void {
    // Track mouse movement over paragraphs
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
    
    // Track any user activity to reset inactivity timer
    document.addEventListener('mousemove', () => this.resetInactivityTimer(), { passive: true });
    document.addEventListener('mousedown', () => this.resetInactivityTimer(), { passive: true });
    document.addEventListener('keydown', () => this.resetInactivityTimer(), { passive: true });
    document.addEventListener('scroll', () => this.resetInactivityTimer(), { passive: true });
    document.addEventListener('touchstart', () => this.resetInactivityTimer(), { passive: true });
    
    // Check metrics every second
    setInterval(() => this.checkParagraphMetrics(), 1000);
    
    // Check for inactivity every second
    setInterval(() => this.checkInactivity(), 1000);
    
    console.log('📊 Paragraph Tracker initialized with inactivity detection (5s)');
  }

  private handleMouseMove(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const paragraph = target.closest('p, article p, main p') as HTMLElement;
    
    if (!paragraph) {
      this.currentHoveredParagraph = null;
      return;
    }

    // Track cursor movement within paragraph
    const deltaX = Math.abs(event.clientX - this.lastMouseX);
    const deltaY = Math.abs(event.clientY - this.lastMouseY);
    const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (movement > 5) { // Minimum movement threshold
      this.movementCount++;
    }
    
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    // Initialize or update paragraph metrics
    if (paragraph !== this.currentHoveredParagraph) {
      this.currentHoveredParagraph = paragraph;
      this.movementCount = 0;
      
      if (!this.paragraphMetrics.has(paragraph)) {
        this.paragraphMetrics.set(paragraph, {
          element: paragraph,
          cursorMovements: 0,
          dwellTime: 0,
          lastUpdate: Date.now(),
          isSimplified: false,
          isHyperFocused: false
        });
      }
    }

    // Update metrics for current paragraph
    const metrics = this.paragraphMetrics.get(paragraph);
    if (metrics) {
      metrics.cursorMovements = this.movementCount;
      metrics.lastUpdate = Date.now();
    }
  }

  private checkParagraphMetrics(): void {
    const now = Date.now();
    
    this.paragraphMetrics.forEach((metrics, paragraph) => {
      // Calculate dwell time
      const timeSinceUpdate = now - metrics.lastUpdate;
      
      if (this.currentHoveredParagraph === paragraph) {
        metrics.dwellTime += 1000; // Add 1 second
      } else if (timeSinceUpdate > 2000) {
        // Reset if not hovered for 2 seconds
        metrics.dwellTime = 0;
        metrics.cursorMovements = 0;
      }

      // Check for intervention triggers
      this.checkInterventionTriggers(metrics);
    });
  }

  private checkInterventionTriggers(metrics: ParagraphMetrics): void {
    const { element, cursorMovements, dwellTime, isSimplified, isHyperFocused } = metrics;
    
    // Level 1: Initial simplification
    if (!isSimplified && 
        (cursorMovements >= this.thresholds.cursorMovementLimit || 
         dwellTime >= this.thresholds.dwellTimeLimit)) {
      
      console.log(`🎯 Paragraph struggle detected:`, {
        cursorMovements,
        dwellTime,
        threshold: `${this.thresholds.cursorMovementLimit} movements or ${this.thresholds.dwellTimeLimit}ms dwell`
      });
      
      this.triggerSimplification(element);
      metrics.isSimplified = true;
      metrics.cursorMovements = 0;
      metrics.dwellTime = 0;
    }
    
    // Level 2: Hyper-focus mode (still struggling after simplification)
    else if (isSimplified && !isHyperFocused &&
             (cursorMovements >= this.thresholds.hyperFocusCursorLimit || 
              dwellTime >= this.thresholds.hyperFocusDwellLimit)) {
      
      console.log(`🚨 Still struggling after simplification:`, {
        cursorMovements,
        dwellTime,
        threshold: `${this.thresholds.hyperFocusCursorLimit} movements or ${this.thresholds.hyperFocusDwellLimit}ms dwell`
      });
      
      this.triggerHyperFocus(element);
      metrics.isHyperFocused = true;
    }
  }

  private triggerSimplification(element: HTMLElement): void {
    console.log('🤖 Triggering semantic restructuring for paragraph...');
    
    // Dispatch event for simplification
    window.dispatchEvent(new CustomEvent('ADAPTED_PARAGRAPH_SIMPLIFY', {
      detail: { element }
    }));
  }

  private triggerHyperFocus(element: HTMLElement): void {
    console.log('🎨 Triggering hyper-focus mode for paragraph...');
    
    // Dispatch event for aggressive layout muting
    window.dispatchEvent(new CustomEvent('ADAPTED_HYPER_FOCUS', {
      detail: { element }
    }));
  }

  public getMetrics(element: HTMLElement): ParagraphMetrics | null {
    return this.paragraphMetrics.get(element) || null;
  }

  public getAllMetrics(): ParagraphMetrics[] {
    return Array.from(this.paragraphMetrics.values());
  }

  public reset(): void {
    this.paragraphMetrics.clear();
    this.currentHoveredParagraph = null;
    this.movementCount = 0;
    this.hasTriggeredInactivitySimplification = false;
    this.lastActivityTime = Date.now();
    console.log('🔄 Paragraph tracker reset');
  }

  private resetInactivityTimer(): void {
    this.lastActivityTime = Date.now();
    this.hasTriggeredInactivitySimplification = false;
  }

  private checkInactivity(): void {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivityTime;
    
    // If inactive for 5 seconds and haven't triggered yet
    if (timeSinceActivity >= this.inactivityTimeout && !this.hasTriggeredInactivitySimplification) {
      console.log('⏱️ Screen inactive for 5 seconds - triggering automatic simplification');
      this.triggerInactivitySimplification();
      this.hasTriggeredInactivitySimplification = true;
    }
  }

  private triggerInactivitySimplification(): void {
    console.log('🤖 Simplifying ALL paragraphs due to inactivity...');
    
    // Dispatch event to simplify all paragraphs
    window.dispatchEvent(new CustomEvent('ADAPTED_INACTIVITY_SIMPLIFY'));
  }
}

export const paragraphTracker = new ParagraphTracker();

console.log('📊 Paragraph Tracker module loaded');
