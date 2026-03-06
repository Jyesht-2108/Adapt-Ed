import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "accent" | "success" | "warning";
  delay?: number;
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-primary/5 border-primary/20",
  accent: "bg-accent/5 border-accent/20",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
};

const iconStyles = {
  default: "bg-secondary text-muted-foreground",
  primary: "gradient-primary text-primary-foreground",
  accent: "gradient-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, variant = "default", delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, boxShadow: "var(--shadow-elevated)" }}
      className={cn(
        "rounded-xl border p-5 transition-all duration-300",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <span className="inline-flex items-center text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl", iconStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
