import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseSignOut, getCurrentToken } from '../services/firebase';
import { authAPI, setTokenGetter } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Backend user data
  const [fbUser, setFbUser] = useState(null);    // Firebase user object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inject token getter vào API service
  useEffect(() => {
    setTokenGetter(getCurrentToken);
  }, []);

  // Listen Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFbUser(firebaseUser);
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await authAPI.login(idToken);
          setUser(res.Data);
          setError(null);
        } catch (err) {
          console.error('Backend sync failed:', err);
          setUser(null);
        }
      } else {
        setFbUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function logout() {
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignore backend logout errors
    }
    await firebaseSignOut();
    setUser(null);
    setFbUser(null);
  }

  const value = {
    user,
    fbUser,
    loading,
    error,
    logout,
    setUser,
    setError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
