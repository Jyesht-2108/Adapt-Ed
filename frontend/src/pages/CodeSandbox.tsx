import { useState } from "react";
import { Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CodeSandbox = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const MCP_IDE_URL = "http://localhost:5174"; // MCP-IDE frontend URL

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    window.open(MCP_IDE_URL, '_blank');
  };

  return (
    <div className={cn(
      "transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-50 bg-background" 
        : "h-[calc(100vh-7rem)]"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden"
      >
        {/* Header with controls - Compact */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs font-medium text-foreground">MCP-IDE - Code Sandbox</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={openInNewTab}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* IDE iframe */}
        <div className="flex-1 relative bg-[hsl(230,25%,8%)]">
          <iframe
            src={MCP_IDE_URL}
            className="w-full h-full border-0"
            title="MCP-IDE Code Editor"
            allow="clipboard-read; clipboard-write"
          />
          
          {/* Loading overlay (optional) */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none opacity-0 transition-opacity">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading IDE...</p>
            </div>
          </div>
        </div>

        {/* Status bar - Compact */}
        <div className="px-3 py-1 border-t border-border bg-secondary/30 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Connected to MCP-IDE
            </span>
            <span>Port: 5174</span>
          </div>
          <div className="flex items-center gap-3">
            <span>AI Tutor: Enabled</span>
            <span>Multi-file: Supported</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CodeSandbox;
