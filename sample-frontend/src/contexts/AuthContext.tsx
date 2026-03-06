import React, { createContext, useContext, useState } from 'react';

// Mock user type
interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
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

// Mock user data
const mockUser: MockUser = {
  uid: 'mock-user-123',
  email: 'prince.kumar@example.com',
  displayName: 'Prince Kumar',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PrinceKumar',
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Auto-login with mock user (no Firebase needed)
  const [currentUser, setCurrentUser] = useState<MockUser | null>(mockUser);
  const [loading] = useState(false);

  // Mock sign in with Google
  const signInWithGoogle = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentUser(mockUser);
      console.log('✓ Mock login successful');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Mock logout
  const logout = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentUser(null);
      
      // Clear all user-specific data from localStorage
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
