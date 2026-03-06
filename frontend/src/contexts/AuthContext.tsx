import React, { createContext, useContext, useEffect, useState } from 'react';

// Mock user interface (replacing Firebase User)
interface MockUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  currentUser: MockUser | null;
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
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        sessionStorage.setItem('user_id', user.uid);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('mockUser');
      }
    }
    setLoading(false);
  }, []);

  // Mock Google Sign In
  const signInWithGoogle = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock user
      const mockUser: MockUser = {
        uid: 'test_user_' + Date.now(),
        email: 'testuser@example.com',
        displayName: 'Test User',
      };
      
      // Store in localStorage and state
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      sessionStorage.setItem('user_id', mockUser.uid);
      setCurrentUser(mockUser);
      
      console.log('✓ Mock user signed in:', mockUser);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Clear all user-specific data
      localStorage.removeItem('mockUser');
      sessionStorage.removeItem('user_id');
      localStorage.removeItem('roadmap');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('vivaStatus');
      localStorage.removeItem('onboardingData');
      
      setCurrentUser(null);
      
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
