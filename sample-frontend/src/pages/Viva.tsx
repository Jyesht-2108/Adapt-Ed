import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { VivaRoom } from "@/components/viva/VivaRoom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { startMockVivaSession } from "@/mocks/vivaData";

const Viva = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { moduleId } = useParams<{ moduleId: string }>();
  const [searchParams] = useSearchParams();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  
  // Get module info from URL params
  const moduleTitleParam = searchParams.get('moduleTitle');
  const moduleDescription = searchParams.get('moduleDescription');
  
  useEffect(() => {
    if (!moduleId || !moduleTitleParam) {
      setError("Missing module information. Please start from the learning path.");
      setIsLoading(false);
      return;
    }
    
    startVivaSession();
  }, [moduleId, moduleTitleParam]);
  
  const startVivaSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user goal from localStorage
      const storedProfile = localStorage.getItem("userProfile");
      let userGoal = null;
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          userGoal = profile.goal;
        } catch (e) {
          console.warn('Could not parse user profile:', e);
        }
      }
      
      // Try backend first
      try {
        const params = new URLSearchParams({
          module_topic: moduleTitleParam || "",
          ...(userGoal && { user_goal: userGoal })
        });
        
        const response = await fetch(`http://localhost:8000/viva/start-simple?${params}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Backend not available');
        }
        
        const data = await response.json();
        
        setSessionId(data.session_id);
        setModuleTitle(moduleTitleParam || "");
        setUseMockData(false);
        
        // Store the initial question
        sessionStorage.setItem('viva_initial_data', JSON.stringify({
          first_question: data.first_question
        }));
        
        toast({
          title: "Viva Started",
          description: "Your examination has begun. Good luck!",
        });
        
      } catch (backendError) {
        // Fallback to mock data
        console.log('[VIVA] Backend not available, using mock data');
        
        const mockSession = startMockVivaSession(moduleTitleParam || "");
        
        setSessionId(mockSession.sessionId);
        setModuleTitle(moduleTitleParam || "");
        setUseMockData(true);
        
        // Store the initial question
        sessionStorage.setItem('viva_initial_data', JSON.stringify({
          first_question: mockSession.firstQuestion
        }));
        
        toast({
          title: "Viva Started (Demo Mode)",
          description: "Using mock data. Your examination has begun. Good luck!",
        });
      }
      
    } catch (err) {
      console.error('Error starting viva:', err);
      setError(err instanceof Error ? err.message : 'Failed to start viva session');
      
      toast({
        title: "Error",
        description: "Failed to start viva session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  
  const handleComplete = async (passed: boolean, score: number) => {
    // Call backend to update roadmap and unlock next module
    try {
      const storedProfile = localStorage.getItem("userProfile");
      if (!storedProfile) {
        console.error("No user profile found");
        return;
      }
      
      const profile = JSON.parse(storedProfile);
      const userId = profile.uid;
      
      if (!userId || !moduleTitleParam) {
        console.error("Missing user ID or module title");
        return;
      }
      
      console.log(`[VIVA] Calling /viva/complete with userId: ${userId}, module: ${moduleTitleParam}, score: ${score}`);
      
      const response = await fetch('http://localhost:8000/viva/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          module_id: moduleTitleParam,
          final_score: score,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete viva');
      }
      
      const data = await response.json();
      console.log('[VIVA] Complete response:', data);
      
      // Show success message
      toast({
        title: passed ? "Congratulations!" : "Keep Learning",
        description: data.message,
        variant: passed ? "default" : "destructive",
      });
      
      // Also update localStorage for immediate UI feedback
      if (passed && moduleTitleParam) {
        try {
          const storedVivaStatus = localStorage.getItem("vivaStatus");
          const vivaStatus = storedVivaStatus ? JSON.parse(storedVivaStatus) : {};
          vivaStatus[moduleTitleParam] = true;
          localStorage.setItem("vivaStatus", JSON.stringify(vivaStatus));
          console.log(`✓ Module "${moduleTitleParam}" marked as viva_passed in localStorage`);
        } catch (error) {
          console.error("Error saving viva status to localStorage:", error);
        }
      }
      
    } catch (error) {
      console.error('Error completing viva:', error);
      toast({
        title: "Error",
        description: "Failed to save viva results. Please try again.",
        variant: "destructive",
      });
    }
    
    // Navigate back to learning path after a delay
    setTimeout(() => {
      navigate('/learning-path');
    }, 3000);
  };
  
  const handleRetake = () => {
    // Restart the session
    startVivaSession();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="font-semibold">Preparing Your Viva...</p>
              <p className="text-sm text-muted-foreground">
                Setting up the examination room
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle>Unable to Start Viva</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/learning-path')}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Learning Path
                </Button>
                <Button
                  onClick={startVivaSession}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
  
  // Viva room
  if (sessionId) {
    // Get user goal from localStorage
    const storedProfile = localStorage.getItem("userProfile");
    let userGoal = null;
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        userGoal = profile.goal;
      } catch (e) {
        console.warn('Could not parse user profile:', e);
      }
    }
    
    return (
      <VivaRoom
        sessionId={sessionId}
        moduleTitle={moduleTitle}
        userGoal={userGoal}
        useMockData={useMockData}
        onComplete={handleComplete}
        onRetake={handleRetake}
      />
    );
  }
  
  return null;
};

export default Viva;
