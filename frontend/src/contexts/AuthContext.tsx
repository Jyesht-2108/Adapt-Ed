import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        sessionStorage.setItem('user_id', user.uid);
      } else {
        sessionStorage.removeItem('user_id');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Google Sign In with Firebase
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✓ User signed in:', result.user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Logout with Firebase
  const logout = async () => {
    try {
      await signOut(auth);
      
      // Clear all user-specific data
      sessionStorage.removeItem('user_id');
      localStorage.removeItem('roadmap');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('vivaStatus');
      localStorage.removeItem('onboardingData');
      
      console.log('✓ Logged out and cleared user data');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
