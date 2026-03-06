import { useState } from "react";
import { Send, Bot, User, Code2, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const mockMessages = [
  { id: 1, role: "assistant" as const, content: "Welcome to the Shadow Tutor! I can see you're working on API integration. What would you like help with?" },
  { id: 2, role: "user" as const, content: "I'm confused about how React Query handles caching. When does it refetch?" },
  { id: 3, role: "assistant" as const, content: "Great question! Think about it this way: React Query uses a concept called 'stale time'. By default, data becomes stale immediately. What do you think happens when you revisit a component with stale data?" },
];

const mockCode = `import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;

  return (
    <div className="profile-card">
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  );
}`;

const CodeSandbox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, role: "user", content: input },
      { id: prev.length + 2, role: "assistant", content: "That's an interesting approach! But consider — what happens if the component unmounts before the fetch completes? Think about cleanup patterns with useEffect." },
    ]);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Tutor Chat Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[380px] shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-primary">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Shadow Tutor</h3>
              <p className="text-xs text-muted-foreground">Socratic guidance • Won't give answers</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <Lightbulb className="w-3 h-3 text-warning" />
            <span className="text-muted-foreground">Powered by local Ollama — private & fast</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}
            >
              <div className={cn(
                "p-1.5 rounded-lg shrink-0 h-fit",
                msg.role === "assistant" ? "gradient-primary" : "bg-secondary"
              )}>
                {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-primary-foreground" /> : <User className="w-3.5 h-3.5 text-secondary-foreground" />}
              </div>
              <div className={cn(
                "rounded-xl px-3.5 py-2.5 text-sm max-w-[85%]",
                msg.role === "assistant" ? "bg-secondary text-secondary-foreground" : "gradient-primary text-primary-foreground"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask the tutor..."
              className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleSend} className="p-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Code Editor Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
          <Code2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">UserProfile.tsx</span>
          <span className="text-xs text-muted-foreground ml-auto">React Query Exercise</span>
        </div>
        <div className="flex-1 overflow-auto bg-[hsl(230,25%,8%)] p-5">
          <pre className="font-mono text-sm leading-relaxed">
            <code className="text-[hsl(220,20%,85%)]">
              {mockCode.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-[hsl(220,10%,40%)] select-none w-8 text-right mr-4 shrink-0">{i + 1}</span>
                  <span>{colorize(line)}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </motion.div>
    </div>
  );
};

function colorize(line: string): string {
  // Simple syntax "highlighting" via returning the raw text
  // A full implementation would use a proper highlighter
  return line;
}

export default CodeSandbox;
