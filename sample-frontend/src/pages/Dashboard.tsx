import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Flame, Mic, Zap, Award, TrendingUp, Loader2 } from "lucide-react";
import { mockUser, mockRoadmap } from "@/mocks/mockData";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProgressDonut } from "@/components/dashboard/ProgressDonut";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface UserStats {
  total_modules: number;
  completed_modules: number;
  active_modules: number;
  pending_modules: number;
  progress_percentage: number;
  current_module: {
    title: string;
    description: string;
    week: number;
    status: string;
  } | null;
  viva_count: number;
  avg_viva_score: number;
  viva_scores: number[];
  goal: string;
  streak: number;
  xp: number;
  level: number;
  modules: Array<{
    title: string;
    status: string;
    week: number;
    viva_score: number | null;
  }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user has completed onboarding
    const hasRoadmap = localStorage.getItem("roadmap");
    if (!hasRoadmap) {
      navigate("/onboarding", { replace: true });
      return;
    }
    
    // Fetch user stats from backend
    const fetchStats = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:8000/users/${currentUser.uid}/stats`);
        if (!response.ok) {
          console.warn('Failed to fetch stats from backend, using localStorage');
          // Fall back to localStorage if backend fails
          setLoading(false);
          return;
        }
        const data = await response.json();
        setStats(data);
        console.log("[DASHBOARD] Stats fetched:", data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fall back to mock data on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [navigate, currentUser]);

  // Get user's display name from Firebase (Google account name)
  const userName = currentUser?.displayName || mockUser.name;
  
  // Use real stats if available, otherwise fall back to mock data
  const completedModules = stats?.completed_modules ?? mockRoadmap.modules.filter(m => m.status === "completed").length;
  const totalModules = stats?.total_modules ?? mockRoadmap.modules.length;
  const currentModule = stats?.current_module ?? mockRoadmap.modules.find(m => m.status === "in-progress");
  const vivaScore = stats?.avg_viva_score ?? mockUser.vivaScore;
  const vivaCount = stats?.viva_count ?? 5;
  const streak = stats?.streak ?? mockUser.streak;
  const xp = stats?.xp ?? mockUser.xp;
  const level = stats?.level ?? mockUser.level;
  const progressPercentage = stats?.progress_percentage ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Hero Welcome Section with dark bluish gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 text-white shadow-xl"
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {userName} 👋</h1>
          <p className="text-white/80 text-sm">
            You're on module {completedModules + 1} of {totalModules} — keep going!
          </p>
          {currentModule && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              Currently studying: {currentModule.title}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Modules Completed"
          value={`${completedModules}/${totalModules}`}
          icon={BookOpen}
          variant="primary"
          trend={completedModules > 0 ? `${progressPercentage}% complete` : "Get started!"}
          delay={0.1}
        />
        <StatsCard
          title="Current Streak"
          value={streak > 0 ? `${streak} Days` : "Start today!"}
          icon={Flame}
          variant="warning"
          subtitle={streak > 0 ? "Keep it up!" : "Begin your journey"}
          delay={0.15}
        />
        <StatsCard
          title="Viva Score"
          value={vivaScore > 0 ? `${vivaScore}%` : "No vivas yet"}
          icon={Mic}
          variant="success"
          trend={vivaCount > 0 ? `Avg across ${vivaCount} vivas` : "Take your first viva"}
          delay={0.2}
        />
        <StatsCard
          title="XP Earned"
          value={xp.toLocaleString()}
          icon={Zap}
          variant="accent"
          subtitle={`Level ${level}`}
          delay={0.25}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Course Progress</h3>
          <div className="flex items-center justify-around">
            <ProgressDonut
              value={completedModules}
              total={totalModules}
              label="Overall"
              color="hsl(243, 75%, 59%)"
              size={140}
              delay={0.3}
            />
            <ProgressDonut
              value={progressPercentage}
              total={100}
              label="Progress"
              sublabel={`${completedModules} modules`}
              color="hsl(199, 89%, 48%)"
              size={140}
              delay={0.35}
            />
          </div>
        </motion.div>

        {/* Weekly Bar Chart */}
        <div className="lg:col-span-2">
          <WeeklyChart />
        </div>
      </div>

      {/* Activity + Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={BookOpen} title="Continue Learning" subtitle="Resume current module" gradient="gradient-primary" href="/learning-path" />
            <QuickAction icon={Mic} title="Start Viva" subtitle="Test your knowledge" gradient="gradient-accent" href="/viva" />
            <QuickAction icon={Award} title="Code Sandbox" subtitle="Practice coding" gradient="gradient-warm" href="/code-sandbox" />
            <QuickAction icon={TrendingUp} title="View Progress" subtitle="Detailed analytics" gradient="gradient-primary" href="/learning-path" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function QuickAction({ icon: Icon, title, subtitle, gradient, href }: { icon: any; title: string; subtitle: string; gradient: string; href: string }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className={`p-2 rounded-lg ${gradient} shrink-0`}>
        <Icon className="w-4 h-4 text-primary-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </motion.a>
  );
}

export default Dashboard;
