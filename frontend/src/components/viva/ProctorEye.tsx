import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult, ObjectDetector, Detection } from '@mediapipe/tasks-vision';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface ProctorEyeProps {
  onViolation: (type: string, message: string) => void;
  isActive?: boolean;
}

export const ProctorEye = ({ onViolation, isActive = true }: ProctorEyeProps) => {
  const webcamRef = useRef<Webcam>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(Date.now());
  
  // Violation tracking state
  const [noFaceStartTime, setNoFaceStartTime] = useState<number | null>(null);
  const [lookingAwayStartTime, setLookingAwayStartTime] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'active' | 'no-face' | 'multiple-faces' | 'looking-away' | 'phone-detected'>('active');
  
  // Phone detection accumulator (not consecutive frames)
  const phoneDetectionCountRef = useRef<number>(0);

  // Constants
  const NO_FACE_THRESHOLD_MS = 2000; // 2 seconds
  const LOOKING_AWAY_THRESHOLD_MS = 2000; // 2 seconds
  const DETECTION_INTERVAL_MS = 100; // Check every 100ms
  const HEAD_POSE_THRESHOLD = 0.15; // 15% from center is considered "looking away"
  const PHONE_DETECTION_THRESHOLD = 15; // Accumulator threshold for phone detection

  /**
   * Initialize MediaPipe FaceLandmarker and ObjectDetector
   */
  const initializeFaceLandmarker = useCallback(async () => {
    try {
      console.log('[ProctorEye] Initializing MediaPipe FaceLandmarker and ObjectDetector...');
      
      // Load WASM files from CDN
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Create FaceLandmarker with configuration
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 2, // Detect up to 2 faces to catch multiple people
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      });

      // Create ObjectDetector for phone detection with AGGRESSIVE settings
      const objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        scoreThreshold: 0.3, // LOWERED from 0.5 to catch partial/dimly lit phones
        maxResults: 10, // Check more objects
        categoryAllowlist: ['cell phone', 'remote control', 'book', 'laptop'] // Include common misclassifications
      });

      faceLandmarkerRef.current = faceLandmarker;
      objectDetectorRef.current = objectDetector;
      setIsInitialized(true);
      setInitError(null);
      console.log('[ProctorEye] ✓ FaceLandmarker and ObjectDetector initialized successfully');
    } catch (error) {
      console.error('[ProctorEye] Failed to initialize:', error);
      setInitError('Failed to initialize detection. Please refresh the page.');
      setIsInitialized(false);
    }
  }, []);

  /**
   * Calculate if user is looking away based on nose position
   */
  const isLookingAway = useCallback((result: FaceLandmarkerResult): boolean => {
    if (result.faceLandmarks.length === 0) return false;

    const landmarks = result.faceLandmarks[0];
    
    // Key landmarks for head pose estimation
    const noseTip = landmarks[1]; // Nose tip
    const leftFaceEdge = landmarks[234]; // Left side of face
    const rightFaceEdge = landmarks[454]; // Right side of face

    // Calculate face width and nose position relative to center
    const faceWidth = Math.abs(rightFaceEdge.x - leftFaceEdge.x);
    const faceCenter = (leftFaceEdge.x + rightFaceEdge.x) / 2;
    const noseOffset = Math.abs(noseTip.x - faceCenter);
    
    // If nose is more than threshold away from center, user is looking away
    const lookingAwayRatio = noseOffset / faceWidth;
    
    return lookingAwayRatio > HEAD_POSE_THRESHOLD;
  }, []);

  /**
   * Process video frame and detect violations
   */
  const detectViolations = useCallback(() => {
    if (!isActive || !isInitialized || !faceLandmarkerRef.current || !objectDetectorRef.current || !webcamRef.current) {
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      return;
    }

    const now = Date.now();
    
    // Throttle detection to DETECTION_INTERVAL_MS
    if (now - lastDetectionTimeRef.current < DETECTION_INTERVAL_MS) {
      animationFrameRef.current = requestAnimationFrame(detectViolations);
      return;
    }
    
    lastDetectionTimeRef.current = now;

    try {
      // Detect faces in current frame
      const faceResult = faceLandmarkerRef.current.detectForVideo(video, now);
      const numFaces = faceResult.faceLandmarks.length;
      
      // Detect objects (phones) in current frame
      const objectResult = objectDetectorRef.current.detectForVideo(video, now);
      const detections = objectResult.detections || [];
      
      // DEBUG: Log all detections if any found
      if (detections.length > 0) {
        console.log('[ProctorEye] Detected objects:', detections.map((d: Detection) => ({
          name: d.categories[0]?.categoryName,
          score: d.categories[0]?.score?.toFixed(2)
        })));
      }
      
      // RULE 0: Phone Detection (Accumulator-based, not consecutive)
      let phoneDetectedThisFrame = false;
      
      for (const detection of detections) {
        const category = detection.categories[0];
        if (!category) continue;
        
        const categoryName = category.categoryName.toLowerCase();
        const score = category.score || 0;
        
        // Broadened check: cell phone, remote (common misclassification), or phone-like objects
        const isPhone = categoryName.includes('cell') || 
                       categoryName.includes('phone') || 
                       categoryName.includes('remote');
        
        if (isPhone && score >= 0.3) {
          console.log(`[ProctorEye] 📱 Phone-like object detected: ${category.categoryName} (${(score * 100).toFixed(1)}%)`);
          phoneDetectedThisFrame = true;
          break;
        }
      }
      
      // Update phone detection accumulator
      if (phoneDetectedThisFrame) {
        phoneDetectionCountRef.current++;
        console.log(`[ProctorEye] Phone accumulator: ${phoneDetectionCountRef.current}/${PHONE_DETECTION_THRESHOLD}`);
      } else {
        // Decrement but don't go below 0
        phoneDetectionCountRef.current = Math.max(0, phoneDetectionCountRef.current - 1);
      }
      
      // Trigger violation if accumulator exceeds threshold
      if (phoneDetectionCountRef.current > PHONE_DETECTION_THRESHOLD) {
        setCurrentStatus('phone-detected');
        onViolation('UNAUTHORIZED_DEVICE', 'Unauthorized electronic device (cell phone) detected in frame');
        phoneDetectionCountRef.current = 0; // Reset accumulator after triggering
        console.log('[ProctorEye] 🚨 PHONE VIOLATION TRIGGERED');
      }

      // RULE 1: No Face Detection
      if (numFaces === 0) {
        setCurrentStatus('no-face');
        
        if (noFaceStartTime === null) {
          setNoFaceStartTime(now);
        } else if (now - noFaceStartTime >= NO_FACE_THRESHOLD_MS) {
          onViolation('NO_FACE', 'No face detected in frame');
          setNoFaceStartTime(now); // Reset to avoid spam
        }
        
        // Reset looking away timer
        setLookingAwayStartTime(null);
      }
      // RULE 2: Multiple Faces Detection
      else if (numFaces > 1) {
        setCurrentStatus('multiple-faces');
        onViolation('MULTIPLE_FACES', 'Multiple faces detected in frame');
        
        // Reset timers
        setNoFaceStartTime(null);
        setLookingAwayStartTime(null);
      }
      // RULE 3: Looking Away Detection
      else if (isLookingAway(faceResult)) {
        setCurrentStatus('looking-away');
        
        if (lookingAwayStartTime === null) {
          setLookingAwayStartTime(now);
        } else if (now - lookingAwayStartTime >= LOOKING_AWAY_THRESHOLD_MS) {
          onViolation('LOOKING_AWAY', 'User is looking away from the screen');
          setLookingAwayStartTime(now); // Reset to avoid spam
        }
        
        // Reset no face timer
        setNoFaceStartTime(null);
      }
      // All good - reset timers (but keep phone accumulator)
      else {
        if (phoneDetectionCountRef.current === 0) {
          setCurrentStatus('active');
        }
        setNoFaceStartTime(null);
        setLookingAwayStartTime(null);
      }
    } catch (error) {
      console.error('[ProctorEye] Detection error:', error);
    }

    // Continue detection loop
    animationFrameRef.current = requestAnimationFrame(detectViolations);
  }, [isActive, isInitialized, noFaceStartTime, lookingAwayStartTime, onViolation, isLookingAway]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeFaceLandmarker();

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
      if (objectDetectorRef.current) {
        objectDetectorRef.current.close();
      }
    };
  }, [initializeFaceLandmarker]);

  /**
   * Start/stop detection loop based on active state
   */
  useEffect(() => {
    if (isActive && isInitialized) {
      console.log('[ProctorEye] Starting detection loop');
      detectViolations();
    } else {
      console.log('[ProctorEye] Stopping detection loop');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isInitialized, detectViolations]);

  /**
   * Get status indicator color
   */
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'active':
        return 'border-green-500';
      case 'no-face':
        return 'border-yellow-500';
      case 'multiple-faces':
        return 'border-red-500';
      case 'looking-away':
        return 'border-orange-500';
      case 'phone-detected':
        return 'border-red-600 animate-pulse';
      default:
        return 'border-gray-500';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    if (!isActive) {
      return <EyeOff className="h-4 w-4 text-gray-500" />;
    }
    
    switch (currentStatus) {
      case 'active':
        return <Eye className="h-4 w-4 text-green-500" />;
      case 'no-face':
      case 'multiple-faces':
      case 'looking-away':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'phone-detected':
        return <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    if (!isActive) return 'Proctor Inactive';
    if (!isInitialized) return 'Initializing...';
    
    switch (currentStatus) {
      case 'active':
        return 'Monitoring Active';
      case 'no-face':
        return 'No Face Detected';
      case 'multiple-faces':
        return 'Multiple Faces';
      case 'looking-away':
        return 'Looking Away';
      case 'phone-detected':
        return '📱 Phone Detected!';
      default:
        return 'Proctor Active';
    }
  };

  // Show error state
  if (initError) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 shadow-lg max-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700">Proctor Error</span>
          </div>
          <p className="text-xs text-red-600">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`relative rounded-lg overflow-hidden shadow-lg border-4 transition-colors duration-300 ${getStatusColor()}`}>
        {/* Webcam Feed */}
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user'
          }}
          className="w-[150px] h-[150px] object-cover"
          mirrored={true}
        />
        
        {/* Status Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-2 py-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-[10px] font-medium text-white">
                {getStatusText()}
              </span>
            </div>
            
            {/* Pulse indicator when active */}
            {isActive && isInitialized && currentStatus === 'active' && (
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {!isInitialized && !initError && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-white font-medium">Loading...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Status description (only show warnings) */}
      {isActive && isInitialized && currentStatus !== 'active' && (
        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-md p-2 max-w-[150px]">
          <p className="text-[10px] text-orange-700 text-center">
            {currentStatus === 'no-face' && 'Please stay in frame'}
            {currentStatus === 'multiple-faces' && 'Only one person allowed'}
            {currentStatus === 'looking-away' && 'Please look at screen'}
            {currentStatus === 'phone-detected' && '📱 Remove phone immediately!'}
          </p>
        </div>
      )}
    </div>
  );
};
