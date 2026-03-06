import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Award, Lock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Module {
  title: string;
  description: string;
  status: string;
  week: number;
  viva_passed?: boolean;
}

const VivaSelection = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [vivaStatus, setVivaStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadModules = () => {
      try {
        setLoading(true);
        
        // Load roadmap from localStorage
        const storedRoadmap = localStorage.getItem("roadmap");
        
        if (storedRoadmap) {
          const roadmap = JSON.parse(storedRoadmap);
          
          // Load viva status
          const storedVivaStatus = localStorage.getItem("vivaStatus");
          const vivaStatusMap: Record<string, boolean> = storedVivaStatus 
            ? JSON.parse(storedVivaStatus) 
            : {};
          
          setVivaStatus(vivaStatusMap);
          
          // Filter modules that are active or completed (unlocked)
          const availableModules = roadmap.modules.filter((mod: Module) => 
            mod.status === "active" || mod.status === "completed"
          );
          
          setModules(availableModules);
        } else {
          // No roadmap, redirect to onboarding
          navigate("/onboarding", { replace: true });
        }
      } catch (error) {
        console.error("Error loading modules:", error);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [navigate]);

  const handleModuleClick = (module: Module) => {
    navigate(`/viva/${encodeURIComponent(module.title)}?moduleTitle=${encodeURIComponent(module.title)}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading available vivas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Viva Voice Examinations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            No modules available for viva yet. Complete some modules first!
          </p>
        </motion.div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">No Modules Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start learning to unlock viva examinations
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Viva Voice Examinations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a module to take your viva examination
        </p>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">About Viva Examinations</h3>
                <p className="text-sm text-muted-foreground">
                  Viva examinations test your understanding through voice-based Q&A. 
                  You'll answer 5 questions about the module. Pass with 60% or higher to unlock the next module.
                  The system works with or without a backend connection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module, index) => {
          const hasPassedViva = vivaStatus[module.title] || false;
          const canTakeViva = module.status === "active" || module.status === "completed";

          return (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  hasPassedViva && "border-success/30 bg-success/5",
                  !canTakeViva && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => canTakeViva && handleModuleClick(module)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                          hasPassedViva
                            ? "bg-success/20"
                            : canTakeViva
                            ? "bg-primary/20"
                            : "bg-muted"
                        )}
                      >
                        {hasPassedViva ? (
                          <CheckCircle2 className="w-6 h-6 text-success" />
                        ) : canTakeViva ? (
                          <Mic className="w-6 h-6 text-primary" />
                        ) : (
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{module.title}</h3>
                          {hasPassedViva && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              <Award className="w-3 h-3 mr-1" />
                              Passed
                            </Badge>
                          )}
                          {!hasPassedViva && canTakeViva && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              Available
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {module.description || "Test your knowledge with a voice-based examination"}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Week {module.week}</span>
                          <span>•</span>
                          <span>5 Questions</span>
                          <span>•</span>
                          <span>~15 minutes</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    {canTakeViva && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-4" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tips Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips for Success</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <p>Speak clearly and provide detailed answers</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <p>Mention key concepts and technical terms</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <p>Use Chrome or Edge browser for best voice recognition</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <p>You need 60% or higher to pass</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <p>Works offline with mock data if backend is unavailable</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VivaSelection;
