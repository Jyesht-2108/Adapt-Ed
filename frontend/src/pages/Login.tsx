import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Check if user is already logged in and their onboarding status
  useEffect(() => {
    const checkUserStatus = async () => {
      if (currentUser) {
        setIsCheckingStatus(true);
        try {
          // Clear any existing localStorage data from previous user
          const existingProfile = localStorage.getItem('userProfile');
          if (existingProfile) {
            const profile = JSON.parse(existingProfile);
            // If the stored profile is for a different user, clear it
            if (profile.uid !== currentUser.uid) {
              console.log('Different user detected, clearing old data');
              localStorage.removeItem('roadmap');
              localStorage.removeItem('userProfile');
              localStorage.removeItem('vivaStatus');
              localStorage.removeItem('onboardingData');
            }
          }
          
          // Check user status from backend
          const status = await getUserStatus(currentUser.uid);
          
          console.log('User status from backend:', status);
          
          if (status.onboarding_completed) {
            // Returning user - go to dashboard
            console.log('User has completed onboarding, redirecting to dashboard');
            
            // Store roadmap in localStorage if available
            if (status.roadmap) {
              localStorage.setItem('roadmap', JSON.stringify(status.roadmap));
            }
            if (status.profile) {
              localStorage.setItem('userProfile', JSON.stringify(status.profile));
            }
            
            navigate('/dashboard');
          } else {
            // New user - go to onboarding
            console.log('User has not completed onboarding, redirecting to onboarding');
            navigate('/onboarding');
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          // If error checking status, assume new user and go to onboarding
          navigate('/onboarding');
        } finally {
          setIsCheckingStatus(false);
        }
      }
    };

    checkUserStatus();
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      
      toast({
        title: 'Welcome!',
        description: 'Successfully signed in with Google.',
      });
      
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      toast({
        title: 'Sign In Failed',
        description: error.message || 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
      
      setIsLoading(false);
    }
  };

  // Show loading while checking status
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking your account...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <svg
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to AdaptEd</CardTitle>
          <CardDescription className="text-base">
            Your personalized AI-powered learning platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
