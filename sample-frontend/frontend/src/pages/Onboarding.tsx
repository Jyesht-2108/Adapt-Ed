import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoadmap, UserProfile } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Rocket, Target, Code, Clock, Plus, X, Sparkles, Brain, Zap, CheckCircle2 } from "lucide-react";
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

  // Single state object for all form data
  const [formData, setFormData] = useState({
    goal: "",
    current_skills: [] as string[],
    preferred_language: "",
    weekly_hours: 10,
    notification_time: "09:00",
  });

  const [skillInput, setSkillInput] = useState("");

  // Predefined options
  const popularGoals = [
    { label: "MLOps Engineer", icon: Brain },
    { label: "DevOps Engineer", icon: Zap },
    { label: "Full-Stack Developer", icon: Code },
    { label: "Frontend Developer", icon: Sparkles },
    { label: "Backend Developer", icon: Target },
    { label: "Cloud Architect", icon: Rocket },
  ];

  const programmingLanguages = [
    { value: "Python", description: "Great for ML, automation, and backend" },
    { value: "Go", description: "Fast, efficient, perfect for cloud-native" },
    { value: "Java", description: "Enterprise-grade, robust ecosystem" },
    { value: "JavaScript", description: "Full-stack web development" },
    { value: "Rust", description: "Systems programming, high performance" },
  ];

  const popularSkills = [
    "HTML", "CSS", "JavaScript", "Python", "Git", "Docker", 
    "Linux", "SQL", "React", "Node.js", "AWS", "Kubernetes", 
    "CI/CD", "REST APIs"
  ];

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle skill management
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.current_skills.includes(skillInput.trim())) {
      updateFormData("current_skills", [...formData.current_skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    updateFormData("current_skills", formData.current_skills.filter(s => s !== skill));
  };

  const handleToggleSkill = (skill: string) => {
    if (formData.current_skills.includes(skill)) {
      handleRemoveSkill(skill);
    } else {
      updateFormData("current_skills", [...formData.current_skills, skill]);
    }
  };

  // Navigation
  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validation
  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.goal.trim() !== "";
      case 2:
        return true; // Skills are optional
      case 3:
        return formData.preferred_language !== "";
      case 4:
        return true; // All fields have defaults
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
      const profile: UserProfile = {
        uid: currentUser.uid,
        goal: formData.goal,
        current_skills: formData.current_skills,
        preferred_language: formData.preferred_language,
        time_commitment: `${formData.weekly_hours} hours per week`,
        notification_time: formData.notification_time,
        weekly_hours: formData.weekly_hours,
      };

      console.log("Generating roadmap with profile:", profile);

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
        className="w-full max-w-3xl"
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
                <Rocket className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to AdaptEd
            </CardTitle>
            <CardDescription className="text-base">
              Let's build your personalized learning journey in 4 simple steps
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pb-8">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between px-4">
              {[
                { num: 1, label: "Ambition", icon: Target },
                { num: 2, label: "Baseline", icon: CheckCircle2 },
                { num: 3, label: "Preferences", icon: Code },
                { num: 4, label: "Commitment", icon: Clock },
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
                  {idx < 3 && (
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
              {/* Step 1: The Ambition */}
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
                      <Target className="w-6 h-6 text-primary" />
                      What is your primary goal?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Tell us what you want to achieve, and we'll create a roadmap to get you there
                    </p>
                    <Input
                      placeholder="e.g., MLOps Engineer, Full-Stack Developer, Cloud Architect"
                      value={formData.goal}
                      onChange={(e) => updateFormData("goal", e.target.value)}
                      className="text-base h-12"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Or choose from popular goals:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {popularGoals.map((g) => {
                        const Icon = g.icon;
                        return (
                          <motion.div
                            key={g.label}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant={formData.goal === g.label ? "default" : "outline"}
                              className={cn(
                                "w-full h-auto py-4 flex flex-col items-center gap-2",
                                formData.goal === g.label && "ring-2 ring-primary ring-offset-2"
                              )}
                              onClick={() => updateFormData("goal", g.label)}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-sm font-medium">{g.label}</span>
                            </Button>
                          </motion.div>
                        );
                      })}
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

              {/* Step 2: The Baseline */}
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
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      What do you already know?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      We'll skip topics you've already mastered and focus on what's new
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill (e.g., Python, Docker, Git)"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                        className="text-base h-12"
                      />
                      <Button onClick={handleAddSkill} size="lg" className="px-6">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Popular Skills */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Quick select:</p>
                    <div className="flex flex-wrap gap-2">
                      {popularSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant={formData.current_skills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/10 px-3 py-1.5 text-sm"
                          onClick={() => handleToggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Selected Skills */}
                  {formData.current_skills.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Your skills ({formData.current_skills.length}):</p>
                      <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                        {formData.current_skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-2 px-3 py-1.5">
                            {skill}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => handleRemoveSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={prevStep} variant="outline" className="flex-1 h-12">
                      Back
                    </Button>
                    <Button onClick={nextStep} className="flex-1 h-12">
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: The Preferences */}
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
                      <Code className="w-6 h-6 text-primary" />
                      How do you want to build?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred programming language for examples and projects
                    </p>
                  </div>

                  <RadioGroup
                    value={formData.preferred_language}
                    onValueChange={(value) => updateFormData("preferred_language", value)}
                    className="space-y-3"
                  >
                    {programmingLanguages.map((lang) => (
                      <motion.div
                        key={lang.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Label
                          htmlFor={lang.value}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                            formData.preferred_language === lang.value
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <RadioGroupItem value={lang.value} id={lang.value} className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-base">{lang.value}</p>
                            <p className="text-sm text-muted-foreground">{lang.description}</p>
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </RadioGroup>

                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      When should we nudge you?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Set your preferred time for daily learning reminders
                    </p>
                    <Input
                      type="time"
                      value={formData.notification_time}
                      onChange={(e) => updateFormData("notification_time", e.target.value)}
                      className="text-base h-12 w-full max-w-xs"
                    />
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

              {/* Step 4: The Commitment */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold flex items-center gap-2">
                      <Zap className="w-6 h-6 text-primary" />
                      How much time can you commit?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      We'll pace your learning based on your availability
                    </p>
                  </div>

                  <div className="space-y-6 p-6 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Hours per week</span>
                      <motion.span
                        key={formData.weekly_hours}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-3xl font-bold text-primary"
                      >
                        {formData.weekly_hours}
                      </motion.span>
                    </div>
                    
                    <Slider
                      value={[formData.weekly_hours]}
                      onValueChange={(value) => updateFormData("weekly_hours", value[0])}
                      min={1}
                      max={40}
                      step={1}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 hour</span>
                      <span>20 hours</span>
                      <span>40 hours</span>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        {formData.weekly_hours < 5 && "Perfect for busy schedules. Steady progress with bite-sized lessons."}
                        {formData.weekly_hours >= 5 && formData.weekly_hours < 10 && "Great balance! You'll make consistent progress."}
                        {formData.weekly_hours >= 10 && formData.weekly_hours < 20 && "Excellent commitment! You'll advance quickly."}
                        {formData.weekly_hours >= 20 && "Intensive learning mode! You'll master skills rapidly."}
                      </p>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                    <p className="font-semibold text-sm text-primary">Your Learning Plan Summary:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Goal:</span>
                        <span className="font-medium">{formData.goal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Skills:</span>
                        <span className="font-medium">{formData.current_skills.length} listed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Language:</span>
                        <span className="font-medium">{formData.preferred_language}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weekly Hours:</span>
                        <span className="font-medium">{formData.weekly_hours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Reminder:</span>
                        <span className="font-medium">{formData.notification_time}</span>
                      </div>
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
                          Generating your curriculum...
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
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Crafting Your Journey</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing your goals and creating a personalized curriculum just for you...
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
