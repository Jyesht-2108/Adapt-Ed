import { Bell, Search, Flame, LogOut, User } from "lucide-react";
import { mockUser } from "@/mocks/mockData";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-2 w-full max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search modules, topics, or resources..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
        <kbd className="hidden sm:inline-flex text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-4">
        {/* Streak */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full text-sm font-semibold"
        >
          <Flame className="w-4 h-4" />
          <span>{mockUser.streak} day streak</span>
        </motion.div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="w-9 h-9">
                <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || 'User'} />
                <AvatarFallback className="gradient-primary text-primary-foreground font-bold text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
