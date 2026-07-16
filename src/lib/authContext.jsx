import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth';
import { loginWithEmail, logoutSession, resetUserPassword, subscribeToAuth, updateAuthProfile } from './firebase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const nextUser = await loginWithEmail(email, password);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    await logoutSession();
    setUser(null);
  };

  const updateProfile = async (displayName, photoURL) => {
    const nextUser = await updateAuthProfile(displayName, photoURL);
    setUser(nextUser);
    return nextUser;
  };

  const resetPassword = async (email) => {
    await resetUserPassword(email);
  };

  const value = useMemo(() => ({ user, loading, login, logout, updateProfile, resetPassword }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

