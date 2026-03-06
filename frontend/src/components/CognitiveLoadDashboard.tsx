import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Activity, MousePointer, Keyboard, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function CognitiveLoadDashboard() {
  const [metrics, setMetrics] = useState({
    velocity: 0,
    directionChanges: 0,
    backspaceRate: 0,
    dwellTime: 0,
  });

  const [cognitiveLoad, setCognitiveLoad] = useState({
    score: 0,
    level: 'low' as 'low' | 'medium' | 'high' | 'critical',
    recommendations: ['Analyzing behavior...'],
  });

  const [visionMetrics, setVisionMetrics] = useState({
    eyeSaccadeRate: 0,
    pupilDilation: 0,
    facePresent: false,
    attentionScore: 0,
  });

  const [visionEnabled, setVisionEnabled] = useState(false);

  useEffect(() => {
    // Update metrics every 200ms
    const metricsInterval = setInterval(() => {
      const observer = (window as any).telemetryObserver;
      if (observer) {
        const snapshot = observer.getSnapshot();
        setMetrics(snapshot);
      }
    }, 200);

    // Listen for cognitive load updates
    const handleOverload = (event: CustomEvent) => {
      setCognitiveLoad({
        score: event.detail.score,
        level: event.detail.level,
        recommendations: event.detail.recommendations || [],
      });
    };

    window.addEventListener('ADAPTED_OVERLOAD_TRIGGERED', handleOverload as EventListener);

    // Listen for vision updates
    const handleVisionUpdate = (event: CustomEvent) => {
      setVisionMetrics(event.detail);
    };

    window.addEventListener('ADAPTED_VISION_UPDATE', handleVisionUpdate as EventListener);

    return () => {
      clearInterval(metricsInterval);
      window.removeEventListener('ADAPTED_OVERLOAD_TRIGGERED', handleOverload as EventListener);
      window.removeEventListener('ADAPTED_VISION_UPDATE', handleVisionUpdate as EventListener);
    };
  }, []);

  const toggleVision = async () => {
    const visionTracker = (window as any).visionTracker;
    if (!visionTracker) return;

    if (visionTracker.isEnabled()) {
      visionTracker.stop();
      setVisionEnabled(false);
    } else {
      const success = await visionTracker.initialize();
      setVisionEnabled(success);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'low': return 'from-green-600 to-green-700';
      case 'medium': return 'from-yellow-600 to-yellow-700';
      case 'high': return 'from-orange-600 to-orange-700';
      case 'critical': return 'from-red-600 to-red-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Cognitive Load Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-gradient-to-r rounded-xl p-6 text-white shadow-lg',
          getLevelBg(cognitiveLoad.level)
        )}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm opacity-90 mb-1">Cognitive Load Score</div>
            <div className="text-4xl font-bold">
              {Math.round(cognitiveLoad.score * 100)}%
            </div>
          </div>
          <div>
            <div className="text-sm opacity-90 mb-1">Load Level</div>
            <div className="text-2xl font-bold uppercase">{cognitiveLoad.level}</div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm opacity-90 mb-2">Recommendations</div>
            <ul className="text-sm space-y-1 opacity-90">
              {cognitiveLoad.recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MousePointer className="w-4 h-4" />
              <span className="text-xs">Velocity (px/ms)</span>
            </div>
            <div className="text-2xl font-bold">{metrics.velocity.toFixed(3)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Direction Changes</span>
            </div>
            <div className="text-2xl font-bold">{metrics.directionChanges}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Keyboard className="w-4 h-4" />
              <span className="text-xs">Backspace Rate (/10s)</span>
            </div>
            <div className="text-2xl font-bold">{metrics.backspaceRate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Timer className="w-4 h-4" />
              <span className="text-xs">Dwell Time (ms)</span>
            </div>
            <div className="text-2xl font-bold">{metrics.dwellTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vision Tracking */}
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Vision Tracking (Manual Control)</h3>
            </div>
            <Button
              size="sm"
              variant={visionEnabled ? "destructive" : "default"}
              onClick={toggleVision}
              className={visionEnabled ? '' : 'bg-green-600 hover:bg-green-700'}
            >
              {visionEnabled ? 'Disable' : 'Enable'} Webcam Tracking
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Eye Saccades (/s)</div>
              <div className="text-xl font-bold">
                {visionEnabled ? visionMetrics.eyeSaccadeRate.toFixed(1) : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Pupil Dilation</div>
              <div className="text-xl font-bold">
                {visionEnabled ? `${Math.round(visionMetrics.pupilDilation * 100)}%` : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Face Present</div>
              <div className="text-xl font-bold">
                {visionEnabled ? (visionMetrics.facePresent ? '✅ Yes' : '❌ No') : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Attention Score</div>
              <div className="text-xl font-bold">
                {visionEnabled ? `${Math.round(visionMetrics.attentionScore * 100)}%` : '-'}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            🔒 Privacy mode enabled. Video is processed locally and never stored or transmitted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
