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
import { motion } from 'framer-motion';

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
          
          // Check user status from backend with timeout
          console.log('Checking user status from backend...');
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
          
          // Show error toast
          toast({
            title: 'Connection Issue',
            description: 'Taking longer than expected. Redirecting to onboarding...',
            variant: 'default',
          });
          
          // If error checking status (timeout or server error), assume new user and go to onboarding
          // This prevents users from being stuck on the loading screen
          setTimeout(() => {
            navigate('/onboarding');
          }, 1000);
        } finally {
          setIsCheckingStatus(false);
        }
      }
    };

    checkUserStatus();
  }, [currentUser, navigate, toast]);

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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        {/* Animated Background Elements - Same as main view */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ top: '10%', left: '10%' }}
          />
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ bottom: '10%', right: '10%' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-background/95 border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <motion.p
                className="text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Checking your account...
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
      {/* Deep Space Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Starfield - Multiple layers for depth with subtle drift */}
        {[...Array(100)].map((_, i) => {
          const randomX = Math.random() * 100;
          const randomY = Math.random() * 100;
          const driftX = (Math.random() - 0.5) * 20;
          const driftY = (Math.random() - 0.5) * 20;
          
          return (
            <motion.div
              key={`star-${i}`}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                top: `${randomY}%`,
                left: `${randomX}%`,
              }}
              animate={{
                x: [0, driftX, 0],
                y: [0, driftY, 0],
                opacity: [
                  Math.random() * 0.3 + 0.4,
                  Math.random() * 0.5 + 0.5,
                  Math.random() * 0.3 + 0.4
                ],
                scale: [1, Math.random() * 0.3 + 1, 1],
              }}
              transition={{
                duration: Math.random() * 8 + 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          );
        })}

        {/* Nebula clouds */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, rgba(75, 0, 130, 0.2) 50%, transparent 70%)',
            top: '10%',
            left: '5%',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(0, 191, 255, 0.4) 0%, rgba(30, 144, 255, 0.2) 50%, transparent 70%)',
            bottom: '5%',
            right: '5%',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255, 20, 147, 0.3) 0%, rgba(199, 21, 133, 0.2) 50%, transparent 70%)',
            top: '40%',
            right: '20%',
            filter: 'blur(70px)',
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Shooting Asteroids/Meteors */}
        {[...Array(3)].map((_, i) => {
          const startY = Math.random() * 30;
          const startX = Math.random() * 100;
          const angle = 45 + Math.random() * 20;
          const size = Math.random() * 12 + 18;
          const angleRad = (angle * Math.PI) / 180;
          
          return (
            <motion.div
              key={`asteroid-container-${i}`}
              className="absolute pointer-events-none"
              style={{
                top: `${startY}%`,
                left: `${startX}%`,
              }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [0, window.innerWidth * 0.9],
                y: [0, window.innerWidth * 0.9 * Math.tan(angleRad)],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 6 + i * 3,
                ease: "linear",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              <div className="absolute" style={{ transform: `rotate(${angle}deg)` }}>
                <div
                  className="absolute"
                  style={{
                    width: size * 15,
                    height: size * 1.2,
                    top: '50%',
                    right: size,
                    marginTop: -(size * 0.6),
                    background: 'linear-gradient(to left, rgba(255, 255, 255, 0.9), rgba(255, 180, 80, 0.7), rgba(255, 120, 40, 0.4), transparent)',
                    filter: 'blur(4px)',
                    boxShadow: '0 0 20px rgba(255, 200, 100, 0.6)',
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: size * 12,
                    height: size * 0.6,
                    top: '50%',
                    right: size,
                    marginTop: -(size * 0.3),
                    background: 'linear-gradient(to left, rgba(255, 255, 255, 0.6), rgba(255, 220, 150, 0.4), transparent)',
                    filter: 'blur(6px)',
                  }}
                />
                {[...Array(8)].map((_, pi) => (
                  <motion.div
                    key={`particle-${pi}`}
                    className="absolute bg-orange-200 rounded-full"
                    style={{
                      width: size * 0.25,
                      height: size * 0.25,
                      top: '50%',
                      right: size + (size * 2 * pi),
                      marginTop: -(size * 0.125),
                      boxShadow: '0 0 8px rgba(255, 150, 50, 0.8)',
                    }}
                    animate={{
                      opacity: [0.9, 0],
                      scale: [1, 0.2],
                      y: [0, (Math.random() - 0.5) * size],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: pi * 0.1,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
              <motion.div
                className="relative"
                style={{
                  width: size,
                  height: size,
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                }}
                animate={{
                  rotate: [0, 360 * 2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #8b9199 0%, #5b6269 50%, #3b4149 100%)',
                    clipPath: 'polygon(30% 0%, 70% 10%, 100% 35%, 90% 70%, 60% 100%, 20% 90%, 0% 60%, 10% 20%)',
                    boxShadow: `
                      inset -4px -4px 8px rgba(0, 0, 0, 0.7),
                      inset 2px 2px 4px rgba(255, 255, 255, 0.4)
                    `,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '20%',
                      left: '30%',
                      width: '30%',
                      height: '30%',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '50%',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '60%',
                      left: '50%',
                      width: '25%',
                      height: '25%',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '50%',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '40%',
                      left: '15%',
                      width: '20%',
                      height: '20%',
                      background: 'rgba(0, 0, 0, 0.35)',
                      borderRadius: '50%',
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })}

        {/* Animated Orbit Rings with Solid Planets */}
        {[
          { 
            color: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', 
            size: 50, 
            glow: '59, 130, 246',
            name: 'Ice Giant'
          },
          { 
            color: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', 
            size: 60, 
            glow: '168, 85, 247',
            name: 'Gas Giant'
          },
          { 
            color: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', 
            size: 45, 
            glow: '249, 115, 22',
            name: 'Red Planet'
          },
          { 
            color: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', 
            size: 55, 
            glow: '16, 185, 129',
            name: 'Earth-like'
          },
        ].map((planet, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: 280 + i * 200,
              height: 280 + i * 200,
              marginLeft: -(140 + i * 100),
              marginTop: -(140 + i * 100),
              border: `3px solid rgba(255, 255, 255, ${0.6 - i * 0.1})`,
              boxShadow: `
                0 0 30px rgba(255, 255, 255, ${0.5 - i * 0.08}),
                inset 0 0 30px rgba(255, 255, 255, ${0.3 - i * 0.05}),
                0 0 60px rgba(${planet.glow}, ${0.4 - i * 0.05})
              `,
            }}
            animate={{
              rotate: i % 2 === 0 ? [0, 360] : [360, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              rotate: {
                duration: 25 + i * 10,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 5 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <motion.div
              className="absolute"
              style={{
                top: '50%',
                left: '0%',
                marginTop: -planet.size / 2,
                marginLeft: -planet.size / 2,
              }}
              whileHover={{ scale: 1.3 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="relative rounded-full"
                style={{
                  width: planet.size,
                  height: planet.size,
                  background: planet.color,
                  boxShadow: `
                    0 0 ${planet.size * 1.2}px rgba(${planet.glow}, 0.8),
                    0 0 ${planet.size * 2}px rgba(${planet.glow}, 0.4),
                    inset -${planet.size / 3}px -${planet.size / 3}px ${planet.size / 2}px rgba(0, 0, 0, 0.5),
                    inset ${planet.size / 4}px ${planet.size / 4}px ${planet.size / 3}px rgba(255, 255, 255, 0.3)
                  `,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 30%, transparent 60%)`,
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `
                      radial-gradient(circle at 25% 75%, rgba(0, 0, 0, 0.4) 0%, transparent 40%),
                      radial-gradient(circle at 75% 25%, rgba(0, 0, 0, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 60% 80%, rgba(0, 0, 0, 0.2) 0%, transparent 35%)
                    `,
                  }}
                />
                {planet.size > 50 && (
                  <motion.div
                    className="absolute"
                    style={{
                      top: '50%',
                      left: '50%',
                      width: planet.size * 1.8,
                      height: planet.size * 0.4,
                      marginLeft: -(planet.size * 0.9),
                      marginTop: -(planet.size * 0.2),
                      background: `linear-gradient(to bottom, 
                        rgba(255, 255, 255, 0.6) 0%, 
                        rgba(255, 255, 255, 0.4) 50%, 
                        rgba(255, 255, 255, 0.6) 100%)`,
                      borderRadius: '50%',
                      transform: 'rotateX(75deg)',
                      boxShadow: `
                        0 0 20px rgba(255, 255, 255, 0.5),
                        inset 0 2px 10px rgba(0, 0, 0, 0.3)
                      `,
                    }}
                    animate={{
                      rotateZ: [0, 360],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </div>
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: `0 0 ${planet.size * 2}px rgba(${planet.glow}, 0.6)`,
                }}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.6, 0.2, 0.6],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="w-full shadow-2xl backdrop-blur-xl bg-white/10 border-white/20">
        <CardHeader className="space-y-3 text-center">
          <motion.div
            className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2 relative"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <svg
              className="w-10 h-10 text-primary-foreground relative z-10"
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
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-3xl font-bold text-white">Welcome to AdaptEd</CardTitle>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardDescription className="text-base text-gray-200">
              Your personalized AI-powered learning platform
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium relative overflow-hidden group"
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
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
          </motion.div>
          
          <motion.div
            className="text-center text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
};

export default Login;