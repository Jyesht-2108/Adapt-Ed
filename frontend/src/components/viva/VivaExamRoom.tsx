import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Cpu, Activity, Wifi, Zap, Mic, MicOff, Volume2, VolumeX, CheckCircle2, XCircle, RotateCcw, Trophy, AlertCircle, Eye, ShieldAlert } from "lucide-react";
import { ParticleField, OrbitalRing, EnergyWave } from "./SceneElements";
import AvatarHead from "./AvatarHead";
import WebcamFeed from "./WebcamFeed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Confetti from "react-confetti";
import { ProctorEye } from "./ProctorEye";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Message {
  role: 'user' | 'interviewer';
  content: string;
  timestamp: string;
}

interface VivaExamRoomProps {
  sessionId: string;
  moduleTitle: string;
  userGoal?: string | null;
  onComplete: (passed: boolean, score: number) => void;
  onRetake: () => void;
}

/* ─── Staggered typing text ─── */
const TypedText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  return (
    <p className="text-lg leading-relaxed sm:text-xl">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="inline-block mr-[0.3em]"
          style={{
            color: "hsl(0 0% 88%)",
            textShadow: "0 0 10px hsl(185 80% 55% / 0.4), 0 0 30px hsl(185 80% 55% / 0.1)",
          }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
};

/* ─── Crosshair corner ─── */
const Crosshair = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
  const pos = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[position];
  const border = { tl: "border-t border-l", tr: "border-t border-r", bl: "border-b border-l", br: "border-b border-r" }[position];
  return <div className={`absolute ${pos} w-4 h-4 ${border}`} style={{ borderColor: "hsl(140 70% 50% / 0.8)" }} />;
};

/* ─── HUD stat ─── */
const HudStat = ({ icon: Icon, label, value, delay }: { icon: React.ElementType; label: string; value: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-3 rounded-lg border border-foreground/5 bg-foreground/[0.03] px-3 py-2 backdrop-blur-sm"
  >
    <Icon className="h-3.5 w-3.5 text-accent" />
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  </motion.div>
);

/* ─── Waveform bar ─── */
const WaveformBar = ({ index, speaking }: { index: number; speaking: boolean }) => (
  <motion.div
    className="w-[3px] rounded-full"
    style={{ backgroundColor: "hsl(185 80% 55%)" }}
    animate={{
      height: speaking ? [4, 12 + Math.random() * 20, 6, 16 + Math.random() * 16, 4] : [4, 6, 4],
      opacity: speaking ? [0.4, 1, 0.4] : [0.15, 0.25, 0.15],
    }}
    transition={{ duration: speaking ? 0.4 : 2, repeat: Infinity, delay: index * 0.05, ease: "easeInOut" }}
  />
);

/* ─── Main Component ─── */
export function VivaExamRoom({ sessionId, moduleTitle, userGoal, onComplete, onRetake }: VivaExamRoomProps) {
  const { toast } = useToast();
  
  const getTargetRole = () => {
    if (!userGoal) return "Senior Technical Interviewer";
    const goalLower = userGoal.toLowerCase();
    if (goalLower.includes("backend")) return "Senior Backend Engineer";
    else if (goalLower.includes("frontend")) return "Senior Frontend Engineer";
    else if (goalLower.includes("full stack")) return "Full Stack Architect";
    return "Senior Technical Interviewer";
  };
  
  const targetRole = getTargetRole();
  
  // State
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [currentText, setCurrentText] = useState("");
  const [textKey, setTextKey] = useState(0);
  
  // Proctor state
  const [strikes, setStrikes] = useState(0);
  const [integrityLog, setIntegrityLog] = useState<string[]>([]);
  const [currentWarning, setCurrentWarning] = useState<string | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check speech support on mount
  useEffect(() => {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSynthesis = 'speechSynthesis' in window;
    if (!hasRecognition || !hasSynthesis) {
      setSpeechSupported(false);
      toast({ title: 'Speech Not Supported', description: 'Your browser does not support speech features. Please use Chrome or Edge.', variant: 'destructive' });
    }
    synthRef.current = window.speechSynthesis;
  }, [toast]);
  
  // Load initial question on mount
  useEffect(() => {
    const initialData = sessionStorage.getItem('viva_initial_data');
    if (initialData) {
      try {
        const data = JSON.parse(initialData);
        const initialMessage: Message = { role: 'interviewer', content: data.first_question, timestamp: new Date().toISOString() };
        setConversation([initialMessage]);
        setCurrentText(data.first_question);
        setTextKey(k => k + 1);
        setTimeout(() => speak(data.first_question), 500);
        sessionStorage.removeItem('viva_initial_data');
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }
  }, []);
  
  // Show confetti on pass
  useEffect(() => {
    if (isComplete && cumulativeScore >= 60) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isComplete, cumulativeScore]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Violation Handler
  const handleViolation = (type: string, message: string) => {
    if (isTerminated || isComplete) return;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logEntry = `${message} at ${timestamp}`;
    console.warn('[VIVA VIOLATION]', type, logEntry);
    setCurrentWarning(message);
    toast({ title: '⚠️ Integrity Warning', description: message, variant: 'destructive', duration: 3000 });
    setTimeout(() => setCurrentWarning(null), 3000);
    setIntegrityLog(prev => [...prev, logEntry]);
    setStrikes(prev => prev + 1);
  };
  
  // Game Over Logic
  useEffect(() => {
    if (strikes >= 3 && !isTerminated && !isComplete) {
      console.error('[VIVA] GAME OVER - 3 strikes reached');
      setIsTerminated(true);
      stopListening();
      stopSpeaking();
      setShowTerminationModal(true);
      terminateExam();
    }
  }, [strikes, isTerminated, isComplete]);
  
  const terminateExam = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const userId = sessionStorage.getItem('user_id') || 'unknown';
      const response = await fetch(`${API_URL}/viva/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, module_id: moduleTitle, final_score: 0, academic_dishonesty_flag: true, integrity_log: integrityLog }),
      });
      if (!response.ok) throw new Error('Failed to terminate exam');
      const result = await response.json();
      console.log('[VIVA] Exam terminated:', result);
      setTimeout(() => onComplete(false, 0), 5000);
    } catch (error) {
      console.error('Error terminating exam:', error);
      toast({ title: 'Error', description: 'Failed to submit exam termination. Please contact support.', variant: 'destructive' });
    }
  };

  // Speech Synthesis
  const speak = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => voice.lang === 'en-US' && (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Natural'))) || voices.find(voice => voice.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;
    utteranceRef.current = utterance;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
    utterance.onerror = (error) => { console.error('Speech synthesis error:', error); setIsSpeaking(false); utteranceRef.current = null; };
    synthRef.current.speak(utterance);
  };
  
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  // Speech Recognition
  const startListening = () => {
    if (!speechSupported) {
      toast({ title: 'Speech Not Supported', description: 'Please use Chrome or Edge browser.', variant: 'destructive' });
      return;
    }
    stopSpeaking();
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { setIsListening(true); console.log('[VIVA] Started listening...'); };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('[VIVA] Heard:', transcript);
        const userMessage: Message = { role: 'user', content: transcript, timestamp: new Date().toISOString() };
        setConversation(prev => [...prev, userMessage]);
        handleUserAnswer(transcript);
      };
      recognition.onerror = (event: any) => {
        console.error('[VIVA] Recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') toast({ title: 'No Speech Detected', description: 'Please try again and speak clearly.', variant: 'destructive' });
        else if (event.error === 'not-allowed') toast({ title: 'Microphone Access Denied', description: 'Please allow microphone access to use voice features.', variant: 'destructive' });
      };
      recognition.onend = () => { setIsListening(false); console.log('[VIVA] Stopped listening'); };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('[VIVA] Error starting recognition:', error);
      setIsListening(false);
      toast({ title: 'Error', description: 'Failed to start voice recognition.', variant: 'destructive' });
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Handle user answer
  const handleUserAnswer = async (text: string) => {
    setIsProcessing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${API_URL}/viva/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user_text: text, module_topic: moduleTitle, target_role: targetRole }),
      });
      if (!response.ok) throw new Error('Failed to process answer');
      const data = await response.json();
      console.log('[VIVA] Response:', data);
      const interviewerContent = data.is_complete ? `${data.reply}\n\n${data.next_question}\n\n${data.final_feedback}` : `${data.reply}\n\n${data.next_question}`;
      const interviewerMessage: Message = { role: 'interviewer', content: interviewerContent, timestamp: new Date().toISOString() };
      setConversation(prev => [...prev, interviewerMessage]);
      setCurrentText(interviewerContent);
      setTextKey(k => k + 1);
      setCurrentScore(data.score);
      setCumulativeScore(data.cumulative_score);
      setQuestionCount(data.question_count);
      setIsComplete(data.is_complete);
      if (data.is_complete) {
        setFinalFeedback(data.final_feedback);
        const passed = data.cumulative_score >= 60;
        toast({ title: passed ? "Congratulations!" : "Keep Learning", description: passed ? `You passed with ${data.cumulative_score}/100!` : `You scored ${data.cumulative_score}/100. Review and try again.`, variant: passed ? "default" : "destructive" });
      }
      setTimeout(() => speak(interviewerContent), 300);
    } catch (error) {
      console.error('Error sending answer:', error);
      toast({ title: 'Error', description: 'Failed to process your answer. Please try again.', variant: 'destructive' });
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getStrikeBadgeColor = () => {
    if (strikes === 0) return 'bg-green-500 hover:bg-green-600';
    if (strikes === 1) return 'bg-yellow-500 hover:bg-yellow-600';
    if (strikes === 2) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  // Render active exam
  if (!isComplete) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
        <ProctorEye onViolation={handleViolation} isActive={!isTerminated && !isComplete} />
        
        {/* Termination Modal */}
        <Dialog open={showTerminationModal} onOpenChange={() => {}}>
          <DialogContent className="max-w-md border-4 border-red-500">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
                <ShieldAlert className="h-8 w-8" />
                Exam Terminated
              </DialogTitle>
              <DialogDescription className="space-y-4 pt-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-900 font-semibold text-lg mb-2">Academic Dishonesty Detected</p>
                  <p className="text-red-800 text-sm">Your examination has been terminated due to multiple integrity violations.</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">Violations Detected:</p>
                  <ul className="text-sm text-gray-700 space-y-1 max-h-32 overflow-y-auto">
                    {integrityLog.map((log, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{log}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-900 text-sm">
                    <strong>Your score has been set to 0.</strong> This incident has been logged.
                  </p>
                </div>
                <p className="text-center text-sm text-gray-600">Redirecting to dashboard in 5 seconds...</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        
        {/* Current Warning Banner */}
        <AnimatePresence>
          {currentWarning && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
              <Alert variant="destructive" className="border-2 border-red-500">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg">Integrity Warning!</AlertTitle>
                <AlertDescription className="text-base">{currentWarning}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Canvas (background) */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} dpr={[1, 2]}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.03} />
              <pointLight position={[3, 3, 4]} intensity={0.25} color="hsl(185, 80%, 55%)" />
              <pointLight position={[-3, -2, 3]} intensity={0.15} color="hsl(270, 80%, 65%)" />
              <AvatarHead speaking={isSpeaking} />
              <ParticleField count={500} />
              <EnergyWave speaking={isSpeaking} />
              <OrbitalRing radius={2} speed={0.3} color="hsl(270, 80%, 65%)" opacity={0.06} tilt={Math.PI / 4} />
              <OrbitalRing radius={2.5} speed={-0.2} color="hsl(185, 80%, 55%)" opacity={0.04} tilt={-Math.PI / 6} />
              <OrbitalRing radius={3} speed={0.15} color="hsl(270, 80%, 65%)" opacity={0.03} tilt={Math.PI / 3} />
              <EffectComposer>
                <Bloom intensity={0.6} luminanceThreshold={0.3} luminanceSmoothing={0.95} mipmapBlur />
                <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0005, 0.0005)} radialModulation={true} modulationOffset={0.15} />
                <Vignette eskil={false} offset={0.15} darkness={1.1} />
              </EffectComposer>
              <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.5} minAzimuthAngle={-Math.PI / 6} maxAzimuthAngle={Math.PI / 6} />
            </Suspense>
          </Canvas>
        </div>
        
        {/* Scanline overlay */}
        <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(185 80% 55% / 0.1) 2px, hsl(185 80% 55% / 0.1) 4px)" }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ textShadow: "0 0 20px hsl(185 80% 55% / 0.4)" }}>
              {moduleTitle}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Neural Examination Interface v2.4</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center gap-4">
            <div className="text-right">
              <div className={cn('text-3xl font-bold', getScoreColor(cumulativeScore))}>{cumulativeScore}</div>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={cn('flex items-center gap-1.5 px-3 py-1.5', getStrikeBadgeColor())}>
                <Eye className="h-4 w-4" />
                <span className="font-semibold">
                  {strikes === 0 && 'Proctor Active'}
                  {strikes === 1 && 'Warning (1/3)'}
                  {strikes === 2 && 'Final Warning (2/3)'}
                  {strikes >= 3 && 'TERMINATED'}
                </span>
              </Badge>
              {strikes > 0 && strikes < 3 && (
                <p className="text-xs text-orange-600 font-medium">{3 - strikes} strike{3 - strikes !== 1 ? 's' : ''} remaining</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="h-2 w-2 rounded-full" style={{ backgroundColor: isSpeaking ? "hsl(185 80% 55%)" : "hsl(270 80% 65%)", boxShadow: isSpeaking ? "0 0 8px hsl(185 80% 55%)" : "0 0 8px hsl(270 80% 65% / 0.5)" }} />
              <span className="text-xs uppercase tracking-widest font-medium" style={{ color: isSpeaking ? "hsl(185 80% 55%)" : "hsl(270 80% 65%)" }}>
                {isSpeaking ? "Transmitting" : isListening ? "Listening" : "Standby"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Left HUD stats */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 max-sm:hidden">
          <HudStat icon={Cpu} label="Question" value={`${questionCount}/5`} delay={0.6} />
          <HudStat icon={Activity} label="Last Score" value={`${currentScore}/100`} delay={0.8} />
          <HudStat icon={Wifi} label="Status" value={isProcessing ? "Processing" : "Ready"} delay={1.0} />
          <HudStat icon={Zap} label="Strikes" value={`${strikes}/3`} delay={1.2} />
        </div>
        
        {/* Waveform visualizer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute top-1/2 -translate-y-1/2 right-6 z-10 flex items-end gap-[2px] max-sm:hidden" style={{ height: 40 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <WaveformBar key={i} index={i} speaking={isSpeaking} />
          ))}
        </motion.div>
        
        {/* Transcript Area */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={textKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <TypedText text={currentText} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Proctor Window */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 0.6 }} className="absolute bottom-6 right-6 z-10">
          <div className="relative overflow-hidden" style={{ width: 200, height: 200, border: "1px solid hsl(140 70% 50% / 0.4)", boxShadow: "0 0 20px hsl(140 70% 50% / 0.1), inset 0 0 40px hsl(0 0% 0% / 0.6)" }}>
            <Crosshair position="tl" />
            <Crosshair position="tr" />
            <Crosshair position="bl" />
            <Crosshair position="br" />
            <WebcamFeed />
            <motion.div className="absolute left-0 right-0 h-px" style={{ backgroundColor: "hsl(140 70% 50% / 0.25)" }} animate={{ top: ["0%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ backgroundColor: "hsl(0 70% 50% / 0.15)", border: "1px solid hsl(0 70% 50% / 0.3)" }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "hsl(0 70% 50%)" }} />
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "hsl(0 70% 60%)" }}>
                <Radio className="inline h-2.5 w-2.5 mr-0.5" />
                Live
              </span>
            </div>
          </div>
        </motion.div>

        {/* Bottom Control Panel */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4">
          {/* Status Text */}
          <AnimatePresence mode="wait">
            {isSpeaking && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 text-accent">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Interviewer is speaking...</span>
              </motion.div>
            )}
            {isProcessing && !isSpeaking && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 text-primary">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Processing your answer...</span>
              </motion.div>
            )}
            {isListening && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Listening... Speak now!</span>
              </motion.div>
            )}
            {!isSpeaking && !isProcessing && !isListening && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-sm text-muted-foreground">
                Click the microphone to answer
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {isSpeaking && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Button size="lg" variant="outline" onClick={stopSpeaking} className="w-20 h-20 rounded-full border-2 border-accent/50 hover:border-accent">
                  <VolumeX className="w-8 h-8" />
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" disabled={isProcessing || isSpeaking || !speechSupported || isTerminated} onClick={isListening ? stopListening : startListening} className={cn('w-24 h-24 rounded-full border-4', isListening && 'bg-red-500 hover:bg-red-600 animate-pulse border-red-400', !isListening && 'border-primary/50 hover:border-primary', isTerminated && 'opacity-50 cursor-not-allowed')}>
                {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render result screen
  const passed = cumulativeScore >= 60;
  
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      {/* Background with reduced opacity */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.03} />
            <pointLight position={[3, 3, 4]} intensity={0.25} color="hsl(185, 80%, 55%)" />
            <AvatarHead speaking={false} />
            <ParticleField count={300} />
            <OrbitalRing radius={2} speed={0.3} color="hsl(270, 80%, 65%)" opacity={0.06} tilt={Math.PI / 4} />
          </Suspense>
        </Canvas>
      </div>
      
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-2xl">
        <div className={cn('rounded-2xl border-4 p-8 backdrop-blur-xl bg-card/90', passed ? 'border-green-500' : 'border-red-500')}>
          <div className="text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="flex justify-center">
              {passed ? (
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-red-500" />
                </div>
              )}
            </motion.div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2">{passed ? 'Congratulations!' : 'Not Quite There'}</h2>
              <p className="text-muted-foreground">{passed ? 'You have successfully passed the viva examination!' : 'Keep studying and try again. You can do it!'}</p>
            </div>
            
            <div>
              <div className={cn('text-6xl font-bold mb-2', passed ? 'text-green-500' : 'text-red-500')}>{cumulativeScore}</div>
              <p className="text-sm text-muted-foreground">Final Score</p>
              <Badge variant={passed ? 'default' : 'destructive'} className="mt-2">{passed ? 'PASSED' : 'FAILED'}</Badge>
            </div>
            
            {finalFeedback && (
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Feedback</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{finalFeedback}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              {passed ? (
                <Button onClick={() => onComplete(true, cumulativeScore)} className="flex-1 h-12" size="lg">
                  <Trophy className="w-5 h-5 mr-2" />
                  Continue Learning
                </Button>
              ) : (
                <>
                  <Button onClick={onRetake} variant="outline" className="flex-1 h-12" size="lg">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Retake Exam
                  </Button>
                  <Button onClick={() => onComplete(false, cumulativeScore)} className="flex-1 h-12" size="lg">
                    Review Material
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
