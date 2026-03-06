import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import LearningPath from "./pages/LearningPath";
import ModuleDetail from "./pages/ModuleDetail";
import LessonView from "./pages/LessonView";
import CodeSandbox from "./pages/CodeSandbox";
import VivaSelection from "./pages/VivaSelection";
import Viva from "./pages/Viva";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Onboarding route (protected, no layout) */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes with layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout><Dashboard /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout><Dashboard /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learning-path" 
            element={
              <ProtectedRoute>
                <MainLayout><LearningPath /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learning-path/:moduleId" 
            element={
              <ProtectedRoute>
                <MainLayout><ModuleDetail /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lesson/:moduleId" 
            element={
              <ProtectedRoute>
                <MainLayout><LessonView /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/code-sandbox" 
            element={
              <ProtectedRoute>
                <MainLayout><CodeSandbox /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/viva" 
            element={
              <ProtectedRoute>
                <MainLayout><VivaSelection /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/viva/:moduleId" 
            element={
              <ProtectedRoute>
                <MainLayout><Viva /></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <MainLayout><div className="text-foreground">Settings coming soon</div></MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
