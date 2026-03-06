import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface ProgressDonutProps {
  value: number;
  total: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
  delay?: number;
}

export function ProgressDonut({ value, total, label, sublabel, color = "hsl(243, 75%, 59%)", size = 180, delay = 0 }: ProgressDonutProps) {
  const percentage = Math.round((value / total) * 100);
  const data = [
    { name: "completed", value: percentage },
    { name: "remaining", value: 100 - percentage },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.45}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{percentage}%</span>
          <span className="text-xs text-muted-foreground">{sublabel || "Complete"}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground mt-2">{label}</p>
    </motion.div>
  );
}
