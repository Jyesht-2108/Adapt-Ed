import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, CheckCircle2, XCircle, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { processMockVivaAnswer } from '@/mocks/vivaData';

interface Message {
  role: 'user' | 'interviewer';
  content: string;
  timestamp: string;
}

interface VivaRoomProps {
  sessionId: string;
  moduleTitle: string;
  userGoal?: string | null;
  useMockData?: boolean;
  onComplete: (passed: boolean, score: number) => void;
  onRetake: () => void;
}

export function VivaRoom({ sessionId, moduleTitle, userGoal, useMockData = false, onComplete, onRetake }: VivaRoomProps) {
  const { toast } = useToast();
  
  // Determine target role based on user goal
  const getTargetRole = () => {
    if (!userGoal) return "Senior Technical Interviewer";
    
    const goalLower = userGoal.toLowerCase();
    if (goalLower.includes("backend")) {
      return "Senior Backend Engineer";
    } else if (goalLower.includes("frontend")) {
      return "Senior Frontend Engineer";
    } else if (goalLower.includes("full stack")) {
      return "Full Stack Architect";
    }
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
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Check speech support on mount
  useEffect(() => {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSynthesis = 'speechSynthesis' in window;
    
    if (!hasRecognition || !hasSynthesis) {
      setSpeechSupported(false);
      toast({
        title: 'Speech Not Supported',
        description: 'Your browser does not support speech features. Please use Chrome or Edge.',
        variant: 'destructive',
      });
    }
    
    synthRef.current = window.speechSynthesis;
  }, [toast]);
  
  // Load initial question on mount
  useEffect(() => {
    const initialData = sessionStorage.getItem('viva_initial_data');
    if (initialData) {
      try {
        const data = JSON.parse(initialData);
        const initialMessage: Message = {
          role: 'interviewer',
          content: data.first_question,
          timestamp: new Date().toISOString(),
        };
        setConversation([initialMessage]);
        
        // Speak the first question
        setTimeout(() => {
          speak(data.first_question);
        }, 500);
        
        // Clear from session storage
        sessionStorage.removeItem('viva_initial_data');
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }
  }, []);
  
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);
  
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);
  
  // Speech Synthesis (Speaking)
  const speak = (text: string) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    // Try to find a good English voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang === 'en-US' && (
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Natural')
      )
    ) || voices.find(voice => voice.lang === 'en-US');
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Store in ref to prevent garbage collection
    utteranceRef.current = utterance;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    
    synthRef.current.speak(utterance);
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  // Speech Recognition (Listening)
  const startListening = () => {
    if (!speechSupported) {
      toast({
        title: 'Speech Not Supported',
        description: 'Please use Chrome or Edge browser.',
        variant: 'destructive',
      });
      return;
    }
    
    // Stop any ongoing speech
    stopSpeaking();
    
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log('[VIVA] Started listening...');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('[VIVA] Heard:', transcript);
        
        // Add user message immediately
        const userMessage: Message = {
          role: 'user',
          content: transcript,
          timestamp: new Date().toISOString(),
        };
        setConversation(prev => [...prev, userMessage]);
        
        // Send to backend
        handleUserAnswer(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('[VIVA] Recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast({
            title: 'No Speech Detected',
            description: 'Please try again and speak clearly.',
            variant: 'destructive',
          });
        } else if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access to use voice features.',
            variant: 'destructive',
          });
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        console.log('[VIVA] Stopped listening');
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('[VIVA] Error starting recognition:', error);
      setIsListening(false);
      toast({
        title: 'Error',
        description: 'Failed to start voice recognition.',
        variant: 'destructive',
      });
    }
  };
  
  // Stop listening
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
      let data;
      
      if (useMockData) {
        // Use mock data
        data = processMockVivaAnswer(sessionId, text);
        console.log('[VIVA] Mock Response:', data);
      } else {
        // Use real backend
        const response = await fetch('http://localhost:8000/viva/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_text: text,
            module_topic: moduleTitle,
            target_role: targetRole,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to process answer');
        }
        
        data = await response.json();
        console.log('[VIVA] Response:', data);
      }
      
      // Build interviewer response
      const interviewerContent = data.is_complete 
        ? `${data.reply}\n\n${data.next_question}\n\n${data.final_feedback}`
        : `${data.reply}\n\n${data.next_question}`;
      
      const interviewerMessage: Message = {
        role: 'interviewer',
        content: interviewerContent,
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, interviewerMessage]);
      
      // Update state
      setCurrentScore(data.score);
      setCumulativeScore(data.cumulative_score);
      setQuestionCount(data.question_count);
      setIsComplete(data.is_complete);
      
      if (data.is_complete) {
        setFinalFeedback(data.final_feedback);
        
        // Show toast
        const passed = data.cumulative_score >= 60;
        toast({
          title: passed ? "Congratulations!" : "Keep Learning",
          description: passed 
            ? `You passed with ${data.cumulative_score}/100!`
            : `You scored ${data.cumulative_score}/100. Review and try again.`,
          variant: passed ? "default" : "destructive",
        });
      }
      
      // Speak the response
      setTimeout(() => {
        speak(interviewerContent);
      }, 300);
      
    } catch (error) {
      console.error('Error sending answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your answer. Please try again.',
        variant: 'destructive',
      });
      
      // Remove the user message on error
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Render active exam
  if (!isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{moduleTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Viva Voce Examination - Voice Mode</p>
                </div>
                <div className="text-right">
                  <div className={cn('text-3xl font-bold', getScoreColor(cumulativeScore))}>
                    {cumulativeScore}
                  </div>
                  <p className="text-xs text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">Question {questionCount}/5</span>
                </div>
                <Progress value={(questionCount / 5) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          {/* Chat Log */}
          <Card className="h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {conversation.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg p-4',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {/* Processing indicator */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </CardContent>
          </Card>
          
          {/* Voice Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-6">
                {/* Status */}
                <AnimatePresence mode="wait">
                  {isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="flex items-center gap-3 text-primary">
                        <Volume2 className="w-6 h-6 animate-pulse" />
                        <span className="text-base font-medium">Interviewer is speaking...</span>
                      </div>
                      {/* Voice wave animation */}
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-primary rounded-full"
                            animate={{
                              height: [8, 24, 8],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {isProcessing && !isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 text-primary"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Processing your answer...</span>
                    </motion.div>
                  )}
                  
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="flex items-center gap-3 text-red-500">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-base font-medium">Listening... Speak now!</span>
                      </div>
                      {/* Listening wave animation */}
                      <div className="flex items-center gap-1">
                        {[...Array(7)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-red-500 rounded-full"
                            animate={{
                              height: [12, 32, 12],
                            }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.08,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {!isSpeaking && !isProcessing && !isListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-sm text-muted-foreground"
                    >
                      Click the microphone to answer
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Control Buttons */}
                <div className="flex items-center gap-4">
                  {/* Stop Speaking Button */}
                  {isSpeaking && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={stopSpeaking}
                        className="w-20 h-20 rounded-full"
                      >
                        <VolumeX className="w-8 h-8" />
                      </Button>
                    </motion.div>
                  )}
                  
                  {/* Microphone Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      disabled={isProcessing || isSpeaking || !speechSupported}
                      onClick={isListening ? stopListening : startListening}
                      className={cn(
                        'w-24 h-24 rounded-full',
                        isListening && 'bg-red-500 hover:bg-red-600 animate-pulse'
                      )}
                    >
                      {isListening ? (
                        <MicOff className="w-10 h-10" />
                      ) : (
                        <Mic className="w-10 h-10" />
                      )}
                    </Button>
                  </motion.div>
                </div>
                
                {/* Instructions */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground max-w-md">
                    {isListening 
                      ? "Speak your answer clearly. Click again to stop."
                      : "Click the microphone and speak your answer. The interviewer will respond verbally."}
                  </p>
                  {currentScore > 0 && (
                    <p className="text-xs">
                      Last answer: <span className={getScoreColor(currentScore)}>{currentScore}/100</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Render result screen
  const passed = cumulativeScore >= 60;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex items-center justify-center">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className={cn(
          'border-2',
          passed ? 'border-green-500' : 'border-red-500'
        )}>
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex justify-center"
            >
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
              <CardTitle className="text-3xl mb-2">
                {passed ? 'Congratulations!' : 'Not Quite There'}
              </CardTitle>
              <p className="text-muted-foreground">
                {passed 
                  ? 'You have successfully passed the viva examination!'
                  : 'Keep studying and try again. You can do it!'}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Score */}
            <div className="text-center">
              <div className={cn(
                'text-6xl font-bold mb-2',
                passed ? 'text-green-500' : 'text-red-500'
              )}>
                {cumulativeScore}
              </div>
              <p className="text-sm text-muted-foreground">Final Score</p>
              <Badge variant={passed ? 'default' : 'destructive'} className="mt-2">
                {passed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
            
            {/* Feedback */}
            {finalFeedback && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Feedback</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {finalFeedback}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              {passed ? (
                <Button
                  onClick={() => onComplete(true, cumulativeScore)}
                  className="flex-1 h-12"
                  size="lg"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Continue Learning
                </Button>
              ) : (
                <>
                  <Button
                    onClick={onRetake}
                    variant="outline"
                    className="flex-1 h-12"
                    size="lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Retake Exam
                  </Button>
                  <Button
                    onClick={() => onComplete(false, cumulativeScore)}
                    className="flex-1 h-12"
                    size="lg"
                  >
                    Review Material
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
