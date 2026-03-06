import { useEffect, useRef, useState } from 'react';

interface AudioProctorProps {
  isAiSpeaking: boolean;
  isUserAnswering: boolean;
  onViolation: (type: string, message: string) => void;
}

export function AudioProctor({ isAiSpeaking, isUserAnswering, onViolation }: AudioProctorProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Tracking state
  const aiFinishedTimestampRef = useRef<number | null>(null);
  const latencyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundNoiseCountRef = useRef<number>(0);
  const lastViolationTimeRef = useRef<number>(0);
  
  // Configuration
  const BACKGROUND_NOISE_THRESHOLD = 15; // Low threshold for whispering detection
  const BACKGROUND_NOISE_DURATION = 3; // Consecutive frames before triggering
  const VIOLATION_COOLDOWN = 10000; // 10 seconds between same violation type
  const COGNITIVE_DELAY_LIMIT = 10000; // 10 seconds max delay
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize audio monitoring
  useEffect(() => {
    let mounted = true;
    
    const initAudio = async () => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false, // We want to detect all audio
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        micStreamRef.current = stream;
        
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        
        // Connect microphone to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Create data array for frequency analysis
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;
        
        setIsInitialized(true);
        console.log('[AudioProctor] Initialized successfully');
        
        // Start monitoring
        monitorAudio();
        
      } catch (error) {
        console.error('[AudioProctor] Failed to initialize:', error);
      }
    };
    
    initAudio();
    
    return () => {
      mounted = false;
      cleanup();
    };
  }, []);
  
  // Monitor audio levels
  const monitorAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    const analyze = () => {
      if (!analyserRef.current) return;
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS (Root Mean Square) volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      
      // Rule 1: Background Whispering Detection
      // Only check when AI is speaking (user should be silent)
      if (isAiSpeaking && !isUserAnswering) {
        if (rms > BACKGROUND_NOISE_THRESHOLD) {
          backgroundNoiseCountRef.current++;
          
          // Trigger violation after consistent detection (debounce)
          if (backgroundNoiseCountRef.current >= BACKGROUND_NOISE_DURATION) {
            const now = Date.now();
            const timeSinceLastViolation = now - lastViolationTimeRef.current;
            
            if (timeSinceLastViolation > VIOLATION_COOLDOWN) {
              console.warn('[AudioProctor] Background noise detected, RMS:', rms);
              onViolation(
                'BACKGROUND_NOISE',
                'Background whispering or interference detected while interviewer is speaking.'
              );
              lastViolationTimeRef.current = now;
            }
            
            backgroundNoiseCountRef.current = 0; // Reset counter
          }
        } else {
          // Reset counter if volume drops
          backgroundNoiseCountRef.current = Math.max(0, backgroundNoiseCountRef.current - 1);
        }
      } else {
        // Reset counter when not monitoring
        backgroundNoiseCountRef.current = 0;
      }
      
      // Continue monitoring
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  };
  
  // Rule 2: Cognitive Delay Detection
  // Track when AI finishes speaking
  useEffect(() => {
    // AI just finished speaking
    if (!isAiSpeaking && aiFinishedTimestampRef.current === null) {
      const now = Date.now();
      aiFinishedTimestampRef.current = now;
      console.log('[AudioProctor] AI finished speaking at', now);
      
      // Start latency timer
      latencyTimerRef.current = setTimeout(() => {
        // Check if user has started answering
        if (!isUserAnswering) {
          console.warn('[AudioProctor] High latency detected - no response in 10 seconds');
          onViolation(
            'HIGH_LATENCY',
            'Unnatural delay in response. Potential external assistance detected.'
          );
        }
        latencyTimerRef.current = null;
      }, COGNITIVE_DELAY_LIMIT);
    }
    
    // AI started speaking again (new question)
    if (isAiSpeaking) {
      aiFinishedTimestampRef.current = null;
      if (latencyTimerRef.current) {
        clearTimeout(latencyTimerRef.current);
        latencyTimerRef.current = null;
      }
    }
  }, [isAiSpeaking]);
  
  // User started answering - clear latency timer
  useEffect(() => {
    if (isUserAnswering && latencyTimerRef.current) {
      const responseTime = Date.now() - (aiFinishedTimestampRef.current || 0);
      console.log('[AudioProctor] User responded in', responseTime, 'ms');
      
      clearTimeout(latencyTimerRef.current);
      latencyTimerRef.current = null;
      aiFinishedTimestampRef.current = null;
    }
  }, [isUserAnswering]);
  
  // Cleanup function
  const cleanup = () => {
    console.log('[AudioProctor] Cleaning up...');
    
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear latency timer
    if (latencyTimerRef.current) {
      clearTimeout(latencyTimerRef.current);
      latencyTimerRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop microphone tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    // Clear refs
    analyserRef.current = null;
    dataArrayRef.current = null;
  };
  
  // This component is purely logical - no UI
  return null;
}
