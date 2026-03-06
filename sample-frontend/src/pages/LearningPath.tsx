import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LearningModule } from "@/lib/api";
import { CheckCircle2, Lock, Play, Clock, ChevronRight, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/30", label: "Completed" },
  active: { icon: Play, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", label: "In Progress" },
  pending: { icon: Lock, color: "text-muted-foreground", bg: "bg-muted", border: "border-border", label: "Locked" },
  locked: { icon: Lock, color: "text-muted-foreground", bg: "bg-muted", border: "border-border", label: "Locked" },
};

const LearningPath = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmapTitle, setRoadmapTitle] = useState("Learning Path");
  const [vivaStatus, setVivaStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        
        // Check if roadmap exists in localStorage
        const storedRoadmap = localStorage.getItem("roadmap");
        
        if (storedRoadmap) {
          // Use stored roadmap
          const roadmap = JSON.parse(storedRoadmap);
          
          // Load viva status from localStorage
          const storedVivaStatus = localStorage.getItem("vivaStatus");
          const vivaStatusMap: Record<string, boolean> = storedVivaStatus 
            ? JSON.parse(storedVivaStatus) 
            : {};
          
          setVivaStatus(vivaStatusMap);
          
          // Update module statuses based on viva_passed
          const updatedModules = roadmap.modules.map((mod: any, index: number) => {
            // Use module title as key for viva status
            const moduleKey = mod.title;
            const hasPassedViva = vivaStatusMap[moduleKey] || false;
            
            // First module is always unlocked
            if (index === 0) {
              return {
                ...mod,
                status: hasPassedViva ? "completed" : "active",
                viva_passed: hasPassedViva
              };
            }
            
            // Check if previous module has passed viva
            const prevModule = roadmap.modules[index - 1];
            const prevModuleKey = prevModule.title;
            const prevModulePassedViva = vivaStatusMap[prevModuleKey] || false;
            
            if (prevModulePassedViva) {
              // Previous module passed, unlock this one
              return {
                ...mod,
                status: hasPassedViva ? "completed" : "active",
                viva_passed: hasPassedViva
              };
            } else {
              // Previous module not passed, lock this one
              return {
                ...mod,
                status: "locked",
                viva_passed: false
              };
            }
          });
          
          setModules(updatedModules);
          
          // Get goal from stored profile
          const storedProfile = localStorage.getItem("userProfile");
          if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            setRoadmapTitle(`${profile.goal} Learning Path`);
          }
        } else {
          // No roadmap found, redirect to onboarding
          setError("No learning path found. Please complete onboarding first.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load roadmap");
        console.error("Error loading roadmap:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, []);

  // Helper function to convert week to duration string
  const getDuration = (week: number): string => {
    if (week === 1) return "1 week";
    return `${week} weeks`;
  };

  // Helper function to extract topics from resources (placeholder)
  const getTopics = (resources: string[]): string[] => {
    // Since the backend doesn't provide topics, we'll use resource names as topics
    // or return empty array for now
    return resources.slice(0, 4).map(r => {
      // Extract a short name from the resource
      const match = r.match(/^([^-:]+)/);
      return match ? match[1].trim() : r.substring(0, 20);
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading your learning path...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-destructive text-center">
            <p className="font-medium">Error: {error}</p>
          </div>
          <Button onClick={() => navigate("/onboarding")}>
            Start Onboarding
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Learning Path</h1>
        <p className="text-sm text-muted-foreground mt-1">{roadmapTitle} — {modules.length} modules</p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {modules.map((mod, i) => {
            const config = statusConfig[mod.status as keyof typeof statusConfig];
            const Icon = config.icon;
            const isActive = mod.status === "active";
            const isLocked = mod.status === "locked" || mod.status === "pending";
            const isCompleted = mod.status === "completed";
            const topics = getTopics(mod.resources);
            const duration = getDuration(mod.week);
            const moduleKey = mod.title;
            const hasPassedViva = vivaStatus[moduleKey] || false;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative pl-16 group",
                  isLocked && "opacity-60"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10",
                  isCompleted ? "bg-success border-success" : "",
                  isActive ? "bg-primary border-primary pulse-glow" : "",
                  isLocked ? "bg-muted border-border" : "",
                )}>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-success-foreground" />}
                  {isActive && <Play className="w-2.5 h-2.5 text-primary-foreground" />}
                  {isLocked && <Lock className="w-2.5 h-2.5 text-muted-foreground" />}
                </div>

                {/* Card */}
                <Link 
                  to={!isLocked ? `/learning-path/${encodeURIComponent(mod.title)}` : "#"}
                  className={cn(isLocked && "pointer-events-none")}
                >
                  <motion.div
                    whileHover={!isLocked ? { x: 4 } : {}}
                    className={cn(
                      "rounded-xl border p-5 transition-all cursor-pointer",
                      config.border,
                      isActive && "ring-2 ring-primary/20 shadow-md",
                      !isLocked && "hover:shadow-md",
                      isLocked && "bg-muted/30"
                    )}
                  >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Module {i + 1}</span>
                        <span className={cn("inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full", config.bg, config.color)}>
                          {config.label}
                        </span>
                        {hasPassedViva && (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success gap-1">
                            <Award className="w-3 h-3" />
                            Viva Passed
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{mod.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{duration}</span>
                        <span>{topics.length} topics</span>
                      </div>
                      {/* Topics */}
                      {topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {topics.map((t, idx) => (
                            <span key={idx} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {isLocked && (
                        <p className="text-xs text-muted-foreground italic mt-2">
                          Complete previous module's Viva to unlock
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="shrink-0 ml-4">
                      {!isLocked && (
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
