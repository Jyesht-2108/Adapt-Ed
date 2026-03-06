/**
 * AdaptEd - Adaptive Cognitive Load Engine
 * Phase 2: Cognitive Engine Web Worker
 * 
 * Analyzes telemetry data and calculates cognitive load scores
 * Runs in a separate thread to avoid blocking the main UI
 */

interface TelemetrySnapshot {
  velocity: number;
  directionChanges: number;
  backspaceRate: number;
  dwellTime: number;
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

interface WorkerMessage {
  type: 'CALCULATE_LOAD' | 'RESET';
  snapshot?: TelemetrySnapshot;
}

interface WorkerResponse {
  type: 'LOAD_CALCULATED';
  result: CognitiveLoadResult;
}

class CognitiveEngine {
  private velocityHistory: number[] = [];
  private backspaceHistory: number[] = [];
  private dwellHistory: number[] = [];
  private directionHistory: number[] = [];
  private scrollDetected = false;
  private lastDwellTime = 0;
  
  private readonly MAX_HISTORY = 10; // Keep last 10 snapshots (30 seconds at 3s intervals)
  private readonly CRITICAL_DWELL_TIME = 15000; // 15 seconds
  private readonly HIGH_BACKSPACE_THRESHOLD = 5;
  private readonly HIGH_DIRECTION_THRESHOLD = 15;

  /**
   * Main calculation method - computes cognitive load score
   */
  public calculateCognitiveLoad(snapshot: TelemetrySnapshot): CognitiveLoadResult {
    // Update history
    this.updateHistory(snapshot);
    
    // Calculate individual factors
    const velocityVariance = this.calculateVelocityVariance();
    const backspaceImpact = this.calculateBackspaceImpact(snapshot.backspaceRate);
    const dwellImpact = this.calculateDwellImpact(snapshot.dwellTime);
    const directionImpact = this.calculateDirectionImpact(snapshot.directionChanges);
    const smoothnessBonus = this.calculateSmoothnessBonus();
    
    // Weighted scoring algorithm
    let score = 0;
    
    // Velocity variance (0-0.25): Erratic movement indicates confusion
    score += velocityVariance * 0.25;
    
    // Backspace impact (0-0.25): High error rate indicates cognitive overload
    score += backspaceImpact * 0.25;
    
    // Dwell impact (0-0.30): Excessive dwelling indicates comprehension difficulty
    score += dwellImpact * 0.30;
    
    // Direction changes (0-0.20): Erratic searching behavior
    score += directionImpact * 0.20;
    
    // Apply smoothness bonus (reduces score by up to 0.15)
    score = Math.max(0, score - smoothnessBonus);
    
    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));
    
    // Determine load level
    const level = this.determineLoadLevel(score);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(score, {
      velocityVariance,
      backspaceImpact,
      dwellImpact,
      directionImpact,
      smoothnessBonus
    });
    
    return {
      score: Math.round(score * 1000) / 1000, // Round to 3 decimals
      factors: {
        velocityVariance: Math.round(velocityVariance * 1000) / 1000,
        backspaceImpact: Math.round(backspaceImpact * 1000) / 1000,
        dwellImpact: Math.round(dwellImpact * 1000) / 1000,
        directionImpact: Math.round(directionImpact * 1000) / 1000,
        smoothnessBonus: Math.round(smoothnessBonus * 1000) / 1000
      },
      level,
      recommendations
    };
  }

  /**
   * Update historical data
   */
  private updateHistory(snapshot: TelemetrySnapshot): void {
    this.velocityHistory.push(snapshot.velocity);
    this.backspaceHistory.push(snapshot.backspaceRate);
    this.dwellHistory.push(snapshot.dwellTime);
    this.directionHistory.push(snapshot.directionChanges);
    
    // Detect if scrolling occurred (dwell time reset)
    if (snapshot.dwellTime < this.lastDwellTime) {
      this.scrollDetected = true;
    }
    this.lastDwellTime = snapshot.dwellTime;
    
    // Maintain max history size
    if (this.velocityHistory.length > this.MAX_HISTORY) {
      this.velocityHistory.shift();
      this.backspaceHistory.shift();
      this.dwellHistory.shift();
      this.directionHistory.shift();
    }
  }

  /**
   * Calculate velocity variance (0-1)
   * High variance = erratic movement = higher cognitive load
   */
  private calculateVelocityVariance(): number {
    if (this.velocityHistory.length < 2) return 0;
    
    // Calculate mean
    const mean = this.velocityHistory.reduce((sum, v) => sum + v, 0) / this.velocityHistory.length;
    
    // Calculate variance
    const variance = this.velocityHistory.reduce((sum, v) => {
      return sum + Math.pow(v - mean, 2);
    }, 0) / this.velocityHistory.length;
    
    // Normalize variance to 0-1 scale
    // Typical variance ranges from 0 to ~0.5, so we scale accordingly
    const normalizedVariance = Math.min(variance / 0.5, 1);
    
    return normalizedVariance;
  }

  /**
   * Calculate backspace impact (0-1)
   * High backspace rate = typing errors = cognitive overload
   */
  private calculateBackspaceImpact(backspaceRate: number): number {
    if (backspaceRate === 0) return 0;
    
    // Exponential scaling for backspace rate
    // 0-2 backspaces: low impact
    // 3-5 backspaces: medium impact
    // 6+ backspaces: high impact
    const impact = Math.min(backspaceRate / this.HIGH_BACKSPACE_THRESHOLD, 1);
    
    // Apply exponential curve to emphasize high rates
    return Math.pow(impact, 0.8);
  }

  /**
   * Calculate dwell impact (0-1)
   * Excessive dwell time without scrolling = comprehension difficulty
   */
  private calculateDwellImpact(dwellTime: number): number {
    if (dwellTime === 0) return 0;
    
    // Check if dwelling for extended period without scrolling
    const recentDwells = this.dwellHistory.slice(-3); // Last 9 seconds
    const avgRecentDwell = recentDwells.reduce((sum, d) => sum + d, 0) / recentDwells.length;
    
    // Critical: Dwelling > 15 seconds without scroll
    if (avgRecentDwell > this.CRITICAL_DWELL_TIME && !this.scrollDetected) {
      return 1.0; // Maximum impact
    }
    
    // High: Dwelling > 5 seconds
    if (avgRecentDwell > 5000) {
      return Math.min(avgRecentDwell / this.CRITICAL_DWELL_TIME, 1);
    }
    
    // Moderate: Dwelling 2-5 seconds (normal reading)
    if (avgRecentDwell > 2000) {
      return 0.3;
    }
    
    return 0;
  }

  /**
   * Calculate direction change impact (0-1)
   * Erratic mouse movement = searching/confusion
   */
  private calculateDirectionImpact(directionChanges: number): number {
    if (directionChanges === 0) return 0;
    
    // Calculate average direction changes over history
    const avgDirectionChanges = this.directionHistory.length > 0
      ? this.directionHistory.reduce((sum, d) => sum + d, 0) / this.directionHistory.length
      : directionChanges;
    
    // Normalize to 0-1 scale
    const impact = Math.min(avgDirectionChanges / this.HIGH_DIRECTION_THRESHOLD, 1);
    
    return impact;
  }

  /**
   * Calculate smoothness bonus (0-0.15)
   * Smooth, steady behavior reduces cognitive load score
   */
  private calculateSmoothnessBonus(): number {
    if (this.velocityHistory.length < 3) return 0;
    
    let bonus = 0;
    
    // Bonus 1: Consistent velocity (smooth movement)
    const velocityVariance = this.calculateVelocityVariance();
    if (velocityVariance < 0.2) {
      bonus += 0.05;
    }
    
    // Bonus 2: Low backspace rate (steady typing)
    const avgBackspace = this.backspaceHistory.reduce((sum, b) => sum + b, 0) / this.backspaceHistory.length;
    if (avgBackspace < 2) {
      bonus += 0.05;
    }
    
    // Bonus 3: Scrolling detected (active engagement)
    if (this.scrollDetected) {
      bonus += 0.05;
      this.scrollDetected = false; // Reset flag
    }
    
    return bonus;
  }

  /**
   * Determine cognitive load level
   */
  private determineLoadLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.85) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(score: number, factors: any): string[] {
    const recommendations: string[] = [];
    
    if (score >= 0.7) {
      recommendations.push('High cognitive load detected - consider simplifying content');
    }
    
    if (factors.dwellImpact > 0.7) {
      recommendations.push('User struggling with comprehension - add visual aids or tooltips');
    }
    
    if (factors.backspaceImpact > 0.7) {
      recommendations.push('High error rate - enable autocomplete or suggestions');
    }
    
    if (factors.directionImpact > 0.7) {
      recommendations.push('Erratic navigation - improve content structure or add search');
    }
    
    if (factors.velocityVariance > 0.7) {
      recommendations.push('Uncertain behavior - provide clearer instructions or guidance');
    }
    
    if (score < 0.3 && factors.smoothnessBonus > 0.1) {
      recommendations.push('User is confident - content difficulty is appropriate');
    }
    
    return recommendations;
  }

  /**
   * Reset engine state
   */
  public reset(): void {
    this.velocityHistory = [];
    this.backspaceHistory = [];
    this.dwellHistory = [];
    this.directionHistory = [];
    this.scrollDetected = false;
    this.lastDwellTime = 0;
  }
}

// Initialize the cognitive engine
const engine = new CognitiveEngine();

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, snapshot } = event.data;
  
  switch (type) {
    case 'CALCULATE_LOAD':
      if (snapshot) {
        const result = engine.calculateCognitiveLoad(snapshot);
        const response: WorkerResponse = {
          type: 'LOAD_CALCULATED',
          result
        };
        self.postMessage(response);
      }
      break;
      
    case 'RESET':
      engine.reset();
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};

// Signal that worker is ready
self.postMessage({ type: 'WORKER_READY' });
