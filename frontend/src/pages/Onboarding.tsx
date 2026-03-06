import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoadmap, UserProfile } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, User, Target, MessageSquare, Sparkles, Brain, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Check if user already has a roadmap
  useEffect(() => {
    const existingRoadmap = localStorage.getItem("roadmap");
    if (existingRoadmap) {
      console.log("Roadmap already exists, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Simplified adaptive form state
  const [formData, setFormData] = useState({
    age: "",
    expertiseLevel: "",
    primaryGoal: "",
    additionalContext: "",
  });

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Navigation
  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validation
  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.age.trim() !== "" && formData.expertiseLevel !== "";
      case 2:
        return formData.primaryGoal.trim() !== "";
      case 3:
        return true; // Additional context is optional
      default:
        return false;
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    // Check if user is authenticated
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      // Map form data to API format with Firebase UID
      // The AI will interpret the free-form text and generate an appropriate roadmap
      const profile: UserProfile = {
        uid: currentUser.uid,
        goal: formData.primaryGoal,
        current_skills: [], // Will be inferred from additionalContext by AI
        preferred_language: "", // Will be inferred from additionalContext by AI
        time_commitment: "10 hours per week", // Default, can be adjusted later
        notification_time: "09:00", // Default
        weekly_hours: 10, // Default
        // Additional fields for AI processing
        age: formData.age,
        expertise_level: formData.expertiseLevel,
        additional_context: formData.additionalContext,
      };

      console.log("Generating adaptive roadmap with profile:", profile);

      // Generate roadmap (this also saves to backend database)
      const roadmap = await generateRoadmap(profile);

      console.log("✓ Received roadmap:", roadmap);

      // Validate roadmap
      if (!roadmap || !roadmap.modules || !Array.isArray(roadmap.modules)) {
        throw new Error("Invalid roadmap structure received");
      }

      // Store in localStorage for offline access
      localStorage.setItem("roadmap", JSON.stringify(roadmap));
      localStorage.setItem("userProfile", JSON.stringify(profile));
      localStorage.setItem("onboardingData", JSON.stringify(formData));

      console.log("✓ Roadmap stored successfully");

      toast({
        title: "Success!",
        description: "Your personalized learning roadmap is ready.",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);

    } catch (err) {
      console.error("Onboarding error:", err);
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center space-y-3 pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex justify-center mb-2"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to AdaptEd
            </CardTitle>
            <CardDescription className="text-base">
              Tell us about yourself, and our AI will create a personalized learning path
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pb-8">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between px-4">
              {[
                { num: 1, label: "The Basics", icon: User },
                { num: 2, label: "The Goal", icon: Target },
                { num: 3, label: "The Context", icon: MessageSquare },
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: step === s.num ? 1.1 : 1,
                        backgroundColor: step >= s.num ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                        step >= s.num ? "text-primary-foreground shadow-lg" : "text-muted-foreground"
                      )}
                    >
                      <s.icon className="w-5 h-5" />
                    </motion.div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:block",
                      step >= s.num ? "text-primary" : "text-muted-foreground"
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className="flex-1 h-1 mx-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{
                          width: step > s.num ? "100%" : "0%",
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-primary"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {/* Step 1: The Basics */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold flex items-center gap-2">
                      <User className="w-6 h-6 text-primary" />
                      Let's start with the basics
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      This helps us tailor the content and pacing to your needs
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-base font-medium">
                        What's your age?
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="e.g., 25"
                        value={formData.age}
                        onChange={(e) => updateFormData("age", e.target.value)}
                        className="text-base h-12"
                        min="1"
                        max="120"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expertise" className="text-base font-medium">
                        What's your current expertise level?
                      </Label>
                      <Select
                        value={formData.expertiseLevel}
                        onValueChange={(value) => updateFormData("expertiseLevel", value)}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Complete Beginner">Complete Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.expertiseLevel === "Complete Beginner" && "Perfect! We'll start from the fundamentals."}
                        {formData.expertiseLevel === "Intermediate" && "Great! We'll build on your existing knowledge."}
                        {formData.expertiseLevel === "Advanced" && "Excellent! We'll focus on advanced topics and specialization."}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* Step 2: The Goal */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold flex items-center gap-2">
                      <Target className="w-6 h-6 text-primary" />
                      What do you want to learn?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Be as specific or as broad as you like. Our AI will understand and adapt.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal" className="text-base font-medium">
                      Your primary goal
                    </Label>
                    <Input
                      id="goal"
                      placeholder="e.g., I want to learn Linux, Full-stack web development, Machine Learning"
                      value={formData.primaryGoal}
                      onChange={(e) => updateFormData("primaryGoal", e.target.value)}
                      className="text-base h-12"
                    />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Examples:</p>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• "I want to become a DevOps engineer"</li>
                          <li>• "Learn Python for data science"</li>
                          <li>• "Full-stack web development with React"</li>
                          <li>• "Cloud computing and AWS"</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={prevStep} variant="outline" className="flex-1 h-12">
                      Back
                    </Button>
                    <Button onClick={nextStep} disabled={!canProceed()} className="flex-1 h-12">
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: The Context (The Magic Step) */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold flex items-center gap-2">
                      <MessageSquare className="w-6 h-6 text-primary" />
                      Tell us more (optional)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Any preferences, constraints, or additional context? Our AI will use this to personalize your journey.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-base font-medium">
                      Additional context
                    </Label>
                    <Textarea
                      id="context"
                      placeholder="e.g., I prefer Python, I have 2 hours per day, I'm interested in cloud technologies..."
                      value={formData.additionalContext}
                      onChange={(e) => updateFormData("additionalContext", e.target.value)}
                      className="text-base min-h-[150px] resize-none"
                      rows={6}
                    />
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Pro Tips:</p>
                        <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                          <li>• <strong>Have a specific language in mind?</strong> Let us know!</li>
                          <li>• <strong>Complete beginner?</strong> Just type "Decide for me" and our AI will pick the best starting point</li>
                          <li>• <strong>Time constraints?</strong> Mention how many hours per week you can dedicate</li>
                          <li>• <strong>Specific interests?</strong> Tell us what excites you (e.g., "I love automation", "interested in AI")</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                    <p className="font-semibold text-sm text-primary flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Your Learning Profile:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{formData.age}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Level:</span>
                        <span className="font-medium">{formData.expertiseLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Goal:</span>
                        <span className="font-medium text-right max-w-[60%]">{formData.primaryGoal}</span>
                      </div>
                      {formData.additionalContext && (
                        <div className="pt-2 border-t border-border/50">
                          <span className="text-muted-foreground text-xs">Additional Context:</span>
                          <p className="text-xs mt-1 text-muted-foreground italic">
                            {formData.additionalContext.substring(0, 100)}
                            {formData.additionalContext.length > 100 && "..."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={prevStep} variant="outline" className="flex-1 h-12">
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 h-12 text-base font-semibold"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Sparkles className="w-5 h-5" />
                          </motion.div>
                          Generating your roadmap...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5 mr-2" />
                          Generate My Roadmap
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <Card className="w-full max-w-md p-8 text-center space-y-6">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary-foreground" />
                  </div>
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Crafting Your Journey</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing your profile and creating a personalized curriculum just for you...
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;

