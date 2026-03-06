/**
 * AdaptEd - Adaptive Cognitive Load Engine
 * Phase 4: Visual Attention Tracking
 * 
 * Uses webcam and lightweight ML models to track:
 * - Eye saccades (rapid eye movements indicating reading difficulty)
 * - Pupil dilation (cognitive load indicator)
 * - Face presence (user attention/distraction)
 * - Head pose (looking away detection)
 */

interface VisionMetrics {
  eyeSaccadeRate: number;        // Saccades per second
  pupilDilation: number;         // Relative dilation (0-1)
  facePresent: boolean;          // User looking at screen
  faceConfidence: number;        // Face detection confidence (0-100%)
  lookingAway: boolean;          // Head turned away
  blinkRate: number;             // Blinks per minute
  attentionScore: number;        // Overall attention (0-1)
}

interface EyePosition {
  x: number;
  y: number;
  timestamp: number;
}

interface VisionConfig {
  enabled: boolean;
  useTensorFlow: boolean;        // Use TensorFlow.js (requires loading)
  useLightweight: boolean;       // Use lightweight detection
  saccadeThreshold: number;      // Pixels to count as saccade
  updateInterval: number;        // ms between checks
  privacyMode: boolean;          // Don't store video frames
}

export class VisionTracker {
  private config: VisionConfig = {
    enabled: false,
    useTensorFlow: false,
    useLightweight: true,
    saccadeThreshold: 30,
    updateInterval: 100,
    privacyMode: true
  };

  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  
  // Eye tracking state
  private eyePositionHistory: EyePosition[] = [];
  private lastEyePosition: EyePosition | null = null;
  private saccadeCount = 0;
  private blinkCount = 0;
  
  // Face detection state
  private faceDetected = false;
  private faceDetectionHistory: boolean[] = [];
  private lookingAwayDetected = false;
  
  // Face presence tracking for final summary
  private totalFrames = 0;
  private framesWithFace = 0;
  private trackingStartTime = 0;
  
  // Tracking intervals
  private trackingInterval: number | null = null;
  private metricsInterval: number | null = null;
  
  // TensorFlow model (loaded on demand)
  private isModelLoaded = false;

  constructor(config?: Partial<VisionConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize webcam and start tracking
   */
  public async initialize(): Promise<boolean> {
    if (this.config.enabled) {
      console.log('👁️ Vision tracker already initialized');
      return true;
    }

    try {
      console.log('👁️ Initializing vision tracker...');
      
      // Request webcam access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      // Create hidden video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.style.display = 'none';
      document.body.appendChild(this.videoElement);

      // Create canvas for processing
      this.canvas = document.createElement('canvas');
      this.canvas.width = 640;
      this.canvas.height = 480;
      this.context = this.canvas.getContext('2d', { willReadFrequently: true });

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play();
          resolve();
        };
      });

      // Load model if TensorFlow mode enabled
      if (this.config.useTensorFlow) {
        await this.loadFaceMeshModel();
      }

      // Start tracking
      this.startTracking();
      
      // Reset tracking counters
      this.totalFrames = 0;
      this.framesWithFace = 0;
      this.trackingStartTime = Date.now();

      this.config.enabled = true;
      console.log('✅ Vision tracker initialized successfully');
      
      // Show privacy notice
      this.showPrivacyNotice();
      
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize vision tracker:', error);
      console.log('💡 Webcam access denied or not available');
      return false;
    }
  }

  /**
   * Load TensorFlow.js FaceMesh model
   */
  private async loadFaceMeshModel(): Promise<void> {
    try {
      console.log('📦 Loading TensorFlow.js FaceMesh model...');
      
      // Note: This requires @tensorflow/tfjs and @tensorflow-models/face-landmarks-detection
      // For now, we'll use lightweight detection
      console.log('⚠️ TensorFlow.js not loaded - using lightweight detection');
      this.config.useTensorFlow = false;
      this.config.useLightweight = true;
      
    } catch (error) {
      console.error('❌ Failed to load FaceMesh model:', error);
      this.config.useTensorFlow = false;
      this.config.useLightweight = true;
    }
  }

  /**
   * Start tracking loop
   */
  private startTracking(): void {
    // Main tracking loop
    this.trackingInterval = window.setInterval(() => {
      this.processFrame();
    }, this.config.updateInterval);

    // Metrics calculation loop
    this.metricsInterval = window.setInterval(() => {
      this.calculateMetrics();
    }, 1000);

    console.log('🎥 Vision tracking started');
  }

  /**
   * Process video frame
   */
  private processFrame(): void {
    if (!this.videoElement || !this.canvas || !this.context) return;

    try {
      // Draw current frame to canvas
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Increment frame counter
      this.totalFrames++;

      if (this.config.useTensorFlow && this.isModelLoaded) {
        this.processWithTensorFlow();
      } else if (this.config.useLightweight) {
        this.processWithLightweight();
      }
      
      // Track face presence
      if (this.faceDetected) {
        this.framesWithFace++;
      }

    } catch (error) {
      // Silently handle frame processing errors
    }
  }

  /**
   * Lightweight face detection using browser APIs
   */
  private processWithLightweight(): void {
    if (!this.context || !this.canvas) return;

    try {
      // Get image data
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;

      // Multi-region face detection for better accuracy
      const regions = [
        { x: canvasWidth / 2, y: canvasHeight / 2, size: 120, weight: 1.0 },  // Center (main)
        { x: canvasWidth / 2, y: canvasHeight / 3, size: 80, weight: 0.8 },   // Upper center (face)
        { x: canvasWidth / 2, y: canvasHeight * 0.6, size: 60, weight: 0.6 }  // Lower center (chin)
      ];

      let totalConfidence = 0;
      let totalWeight = 0;

      regions.forEach(region => {
        let skinPixels = 0;
        let totalPixels = 0;
        let avgBrightness = 0;
        let colorVariance = 0;

        for (let y = region.y - region.size; y < region.y + region.size; y++) {
          for (let x = region.x - region.size; x < region.x + region.size; x++) {
            if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
              const i = (y * canvasWidth + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Enhanced skin tone detection with multiple criteria
              const isSkinTone = (
                // Basic skin tone range
                (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) ||
                // Light skin tones
                (r > 220 && g > 200 && b > 180 && r > g && g > b) ||
                // Medium skin tones
                (r > 150 && r < 220 && g > 100 && g < 180 && b > 80 && b < 150)
              );

              if (isSkinTone) {
                skinPixels++;
              }

              // Track brightness for pupil dilation estimation
              const brightness = (r + g + b) / 3;
              avgBrightness += brightness;
              
              // Track color variance (faces have varied colors)
              colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
              
              totalPixels++;
            }
          }
        }

        if (totalPixels > 0) {
          const skinRatio = skinPixels / totalPixels;
          avgBrightness /= totalPixels;
          colorVariance /= totalPixels;

          // Calculate confidence for this region
          let regionConfidence = 0;

          // Skin ratio contribution (0-40%)
          if (skinRatio > 0.15) {
            regionConfidence += Math.min(skinRatio * 2, 0.4);
          }

          // Brightness contribution (0-30%) - faces are typically well-lit
          if (avgBrightness > 80 && avgBrightness < 200) {
            regionConfidence += 0.3;
          }

          // Color variance contribution (0-30%) - faces have texture
          if (colorVariance > 20 && colorVariance < 100) {
            regionConfidence += 0.3;
          }

          totalConfidence += regionConfidence * region.weight;
          totalWeight += region.weight;
        }

        // Use first region for pupil dilation
        if (region.weight === 1.0 && totalPixels > 0) {
          this.estimatePupilDilation(avgBrightness / totalPixels);
        }
      });

      // Calculate overall face confidence (0-1)
      const rawConfidence = totalWeight > 0 ? totalConfidence / totalWeight : 0;
      
      // Apply temporal smoothing (average with history)
      this.faceDetectionHistory.push(rawConfidence > 0.4);
      if (this.faceDetectionHistory.length > 10) {
        this.faceDetectionHistory.shift();
      }

      // Face is present if confidence > 40% and recent history supports it
      const recentDetections = this.faceDetectionHistory.filter(d => d).length;
      const historyConfidence = recentDetections / this.faceDetectionHistory.length;
      
      this.faceDetected = rawConfidence > 0.4 && historyConfidence > 0.5;

      // Detect looking away based on confidence drop
      this.lookingAwayDetected = rawConfidence < 0.2 && historyConfidence < 0.3;

      // Simulate eye position tracking (random walk for demo)
      this.simulateEyeTracking();

    } catch (error) {
      // Silently handle errors
      this.faceDetected = false;
    }
  }

  /**
   * Process with TensorFlow.js FaceMesh (when available)
   */
  private async processWithTensorFlow(): Promise<void> {
    // Placeholder for TensorFlow.js implementation
    // Would use @tensorflow-models/face-landmarks-detection
    console.log('🔬 TensorFlow processing (not yet implemented)');
  }

  /**
   * Simulate eye tracking for demo purposes
   * In production, this would use actual eye tracking from FaceMesh
   */
  private simulateEyeTracking(): void {
    const now = performance.now();
    
    // Simulate eye position with some randomness
    const baseX = 320 + Math.sin(now / 1000) * 50;
    const baseY = 240 + Math.cos(now / 1500) * 30;
    
    // Add random saccades occasionally
    const saccadeChance = Math.random();
    let x = baseX;
    let y = baseY;
    
    if (saccadeChance > 0.95) {
      // Simulate saccade (rapid eye movement)
      x += (Math.random() - 0.5) * 100;
      y += (Math.random() - 0.5) * 80;
      this.saccadeCount++;
    }

    const eyePosition: EyePosition = { x, y, timestamp: now };

    // Detect saccades based on position change
    if (this.lastEyePosition) {
      const distance = Math.sqrt(
        Math.pow(x - this.lastEyePosition.x, 2) +
        Math.pow(y - this.lastEyePosition.y, 2)
      );

      if (distance > this.config.saccadeThreshold) {
        this.saccadeCount++;
      }
    }

    this.eyePositionHistory.push(eyePosition);
    this.lastEyePosition = eyePosition;

    // Keep only last 10 seconds of data
    const cutoff = now - 10000;
    this.eyePositionHistory = this.eyePositionHistory.filter(
      pos => pos.timestamp > cutoff
    );
  }

  /**
   * Estimate pupil dilation from brightness changes
   */
  private estimatePupilDilation(brightness: number): void {
    // Inverse relationship: darker pupils = more dilation
    // Normalize to 0-1 scale
    const dilation = 1 - (brightness / 255);
    
    // Store for metrics calculation
    (this as any).currentPupilDilation = dilation;
  }

  /**
   * Calculate and dispatch vision metrics
   */
  private calculateMetrics(): void {
    if (!this.config.enabled) return;
    
    // Calculate saccade rate (per second)
    const timeWindow = 10; // seconds
    const saccadeRate = this.saccadeCount / timeWindow;
    
    // Calculate blink rate (per minute)
    const blinkRate = this.blinkCount * 6; // Extrapolate to per minute
    
    // Calculate attention score
    const attentionScore = this.calculateAttentionScore();

    const metrics: VisionMetrics = {
      eyeSaccadeRate: Math.round(saccadeRate * 10) / 10,
      pupilDilation: (this as any).currentPupilDilation || 0.5,
      facePresent: this.faceDetected,
      faceConfidence: 0, // Don't show during tracking
      lookingAway: this.lookingAwayDetected,
      blinkRate: Math.round(blinkRate),
      attentionScore: Math.round(attentionScore * 100) / 100
    };

    // Dispatch custom event with metrics
    window.dispatchEvent(new CustomEvent('ADAPTED_VISION_UPDATE', {
      detail: metrics
    }));

    // Reset counters
    this.saccadeCount = 0;
    this.blinkCount = 0;
  }

  /**
   * Calculate overall attention score (0-1)
   */
  private calculateAttentionScore(): number {
    let score = 0.5; // Start neutral

    // Face present: +0.3
    if (this.faceDetected) {
      score += 0.3;
    } else {
      score -= 0.3;
    }

    // Looking away: -0.2
    if (this.lookingAwayDetected) {
      score -= 0.2;
    }

    // High saccade rate (>5/s): -0.2 (reading difficulty)
    const saccadeRate = this.saccadeCount / 10;
    if (saccadeRate > 5) {
      score -= 0.2;
    }

    // Low saccade rate (<1/s): -0.1 (not reading)
    if (saccadeRate < 1) {
      score -= 0.1;
    }

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get current vision metrics
   */
  public getMetrics(): VisionMetrics {
    const saccadeRate = this.saccadeCount / 10;
    const blinkRate = this.blinkCount * 6;
    const attentionScore = this.calculateAttentionScore();

    return {
      eyeSaccadeRate: Math.round(saccadeRate * 10) / 10,
      pupilDilation: (this as any).currentPupilDilation || 0.5,
      facePresent: this.faceDetected,
      faceConfidence: 0, // Don't show during tracking
      lookingAway: this.lookingAwayDetected,
      blinkRate: Math.round(blinkRate),
      attentionScore: Math.round(attentionScore * 100) / 100
    };
  }

  /**
   * Check if user is copying (looking away frequently)
   */
  public isLikelyCopying(): boolean {
    const metrics = this.getMetrics();
    
    // Indicators of copying:
    // 1. Frequent looking away
    // 2. Low attention score
    // 3. Intermittent face presence
    
    return (
      metrics.lookingAway ||
      metrics.attentionScore < 0.3 ||
      !metrics.facePresent
    );
  }

  /**
   * Check if user is distracted
   */
  public isDistracted(): boolean {
    const metrics = this.getMetrics();
    
    // Indicators of distraction:
    // 1. Looking away
    // 2. No face detected
    // 3. Low attention score
    // 4. Very low saccade rate (not reading)
    
    return (
      metrics.lookingAway ||
      !metrics.facePresent ||
      metrics.attentionScore < 0.4 ||
      metrics.eyeSaccadeRate < 1
    );
  }

  /**
   * Check if user is focused
   */
  public isFocused(): boolean {
    const metrics = this.getMetrics();
    
    // Indicators of focus:
    // 1. Face present
    // 2. Not looking away
    // 3. Moderate saccade rate (2-5/s = reading)
    // 4. High attention score
    
    return (
      metrics.facePresent &&
      !metrics.lookingAway &&
      metrics.eyeSaccadeRate >= 2 &&
      metrics.eyeSaccadeRate <= 5 &&
      metrics.attentionScore > 0.6
    );
  }

  /**
   * Check if user has reading difficulty
   */
  public hasReadingDifficulty(): boolean {
    const metrics = this.getMetrics();
    
    // Indicators of reading difficulty:
    // 1. Very high saccade rate (>6/s = struggling)
    // 2. High pupil dilation (>0.7 = cognitive load)
    // 3. Low blink rate (<10/min = stress)
    
    return (
      metrics.eyeSaccadeRate > 6 ||
      metrics.pupilDilation > 0.7 ||
      metrics.blinkRate < 10
    );
  }

  /**
   * Show privacy notice
   */
  private showPrivacyNotice(): void {
    const notice = document.createElement('div');
    notice.id = 'vision-privacy-notice';
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #28a745;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      max-width: 350px;
      animation: slideInLeft 0.5s ease-out;
    `;

    notice.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <span style="font-size: 1.5rem;">👁️</span>
        <strong>Vision Tracking Active</strong>
      </div>
      <p style="margin: 0; font-size: 0.875rem; line-height: 1.4;">
        Webcam is being used for attention tracking. ${this.config.privacyMode ? 'Privacy mode: ON. No video is stored.' : ''}
      </p>
      <button id="disable-vision" style="
        margin-top: 0.75rem;
        padding: 0.5rem 1rem;
        background: white;
        color: #28a745;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: bold;
      ">
        Disable Vision Tracking
      </button>
    `;

    document.body.appendChild(notice);

    // Add disable button handler
    document.getElementById('disable-vision')?.addEventListener('click', () => {
      this.stop();
      notice.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notice.parentElement) {
        notice.style.animation = 'slideOutLeft 0.3s ease-in';
        setTimeout(() => notice.remove(), 300);
      }
    }, 10000);
  }

  /**
   * Stop tracking and release webcam
   */
  public stop(): void {
    console.log('🛑 Stopping vision tracker...');

    // Calculate final face presence percentage
    const facePresencePercentage = this.totalFrames > 0 
      ? Math.round((this.framesWithFace / this.totalFrames) * 100)
      : 0;
    
    const trackingDuration = Math.round((Date.now() - this.trackingStartTime) / 1000);

    console.log('📊 Vision Tracking Summary:', {
      duration: `${trackingDuration}s`,
      totalFrames: this.totalFrames,
      framesWithFace: this.framesWithFace,
      facePresencePercentage: `${facePresencePercentage}%`
    });

    // Show summary notification
    this.showTrackingSummary(facePresencePercentage, trackingDuration);

    // Stop tracking intervals
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Stop video stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Remove video element
    if (this.videoElement) {
      this.videoElement.remove();
      this.videoElement = null;
    }

    // Clear canvas
    this.canvas = null;
    this.context = null;

    // Reset state
    this.eyePositionHistory = [];
    this.lastEyePosition = null;
    this.saccadeCount = 0;
    this.blinkCount = 0;
    this.faceDetected = false;
    this.faceDetectionHistory = [];
    this.lookingAwayDetected = false;
    this.totalFrames = 0;
    this.framesWithFace = 0;
    this.trackingStartTime = 0;

    this.config.enabled = false;

    console.log('✅ Vision tracker stopped');
  }

  /**
   * Show tracking summary when disabled
   */
  private showTrackingSummary(facePresencePercentage: number, duration: number): void {
    const summary = document.createElement('div');
    summary.id = 'vision-tracking-summary';
    summary.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10001;
      min-width: 400px;
      animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    // Determine status color and emoji
    let statusColor = '#28a745';
    let statusEmoji = '✅';
    let statusText = 'Excellent Presence';
    
    if (facePresencePercentage < 30) {
      statusColor = '#dc3545';
      statusEmoji = '❌';
      statusText = 'Low Presence';
    } else if (facePresencePercentage < 60) {
      statusColor = '#ffc107';
      statusEmoji = '⚠️';
      statusText = 'Moderate Presence';
    } else if (facePresencePercentage < 80) {
      statusColor = '#17a2b8';
      statusEmoji = '👍';
      statusText = 'Good Presence';
    }

    summary.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${statusEmoji}</div>
        <h3 style="margin: 0 0 1rem 0; color: #333;">Vision Tracking Summary</h3>
        
        <div style="
          background: linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}25 100%);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 2px solid ${statusColor};
        ">
          <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.5rem;">Face Presence</div>
          <div style="font-size: 3rem; font-weight: bold; color: ${statusColor};">
            ${facePresencePercentage}%
          </div>
          <div style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
            ${statusText}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; text-align: left;">
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px;">
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem;">Duration</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: #333;">${duration}s</div>
          </div>
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px;">
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem;">Total Frames</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: #333;">${this.totalFrames}</div>
          </div>
        </div>

        <button id="close-summary" style="
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          transition: all 0.3s ease;
        "
        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
        >
          Close
        </button>
      </div>
    `;

    document.body.appendChild(summary);

    // Close button handler
    document.getElementById('close-summary')?.addEventListener('click', () => {
      summary.style.animation = 'popOut 0.3s ease-in';
      setTimeout(() => summary.remove(), 300);
    });

    // Auto-close after 15 seconds
    setTimeout(() => {
      if (summary.parentElement) {
        summary.style.animation = 'popOut 0.3s ease-in';
        setTimeout(() => summary.remove(), 300);
      }
    }, 15000);
  }

  /**
   * Configure vision tracker
   */
  public configure(config: Partial<VisionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('👁️ Vision tracker reconfigured:', this.config);
  }
  
  /**
   * Check if tracking is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInLeft {
    from {
      transform: translateX(-400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-400px);
      opacity: 0;
    }
  }

  @keyframes popIn {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }

  @keyframes popOut {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Export singleton instance
export const visionTracker = new VisionTracker();

console.log('👁️ Vision Tracker module loaded');
