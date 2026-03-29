import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, {
  setAuthToken,
  setRefreshToken,
  setStoredUser,
  clearAuthData
} from '../api/axios';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        clearAuthData();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const userData = response.data.data.user;
        setUser(userData);
        setStoredUser(userData);
      } catch {
        clearAuthData();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const hasFile = userData.avatar instanceof File;
      let response;

      if (hasFile) {
        const formData = new FormData();
        Object.entries(userData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });
        response = await api.post('/auth/register', formData);
      } else {
        response = await api.post('/auth/register', userData);
      }

      const payload = response.data.data || {};
      const emailSent = payload.emailSent !== false;
      if (emailSent) {
        toast.success(response.data.message || 'Verification code sent');
      } else {
        toast.error(response.data.message || 'We could not send the verification code right now. Please try resend in a moment.');
      }
      return { success: true, ...payload };
    } catch (error) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const verifyRegistration = useCallback(async (email, code) => {
    try {
      const response = await api.post('/auth/verify-email', { email, code });
      const { user: verifiedUser, accessToken, refreshToken } = response.data.data;

      setAuthToken(accessToken);
      setRefreshToken(refreshToken);
      setStoredUser(verifiedUser);
      setUser(verifiedUser);

      toast.success('Email verified successfully');
      return { success: true, user: verifiedUser };
    } catch (error) {
      const message = error.data?.message || error.response?.data?.message || error.message || 'Verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const resendVerificationCode = useCallback(async (email) => {
    try {
      const response = await api.post('/auth/resend-verification-code', { email });
      toast.success(response.data.message || 'Verification code sent');
      return { success: true, message: response.data.message || 'Verification code sent' };
    } catch (error) {
      const message = error.data?.message || error.response?.data?.message || error.message || 'Failed to resend code';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, accessToken, refreshToken } = response.data.data;

      setAuthToken(accessToken);
      setRefreshToken(refreshToken);
      setStoredUser(loggedInUser);
      setUser(loggedInUser);

      toast.success(`Welcome back, ${loggedInUser.fullName}!`);
      return { success: true, user: loggedInUser };
    } catch (error) {
      const message = error.data?.message || error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return {
        success: false,
        error: message,
        code: error.data?.code || error.response?.data?.code || null,
        email: error.data?.data?.email || error.response?.data?.data?.email || null,
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Ignore API failure.
    } finally {
      clearAuthData();
      setUser(null);
      toast.success('Logged out successfully');
    }
  }, []);

  const updateAvatar = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.put('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = response.data.data.user;

      setUser(updatedUser);
      setStoredUser(updatedUser);

      toast.success('Avatar updated successfully');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.data?.message || error.response?.data?.message || error.message || 'Avatar upload failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const response = await api.put('/auth/update-profile', formData);
      const updatedUser = response.data.data.user;

      setUser(updatedUser);
      setStoredUser(updatedUser);
      toast.success('Profile updated successfully');

      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.data?.message || error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data.user;
      setUser(userData);
      setStoredUser(userData);
      return userData;
    } catch {
      return null;
    }
  }, []);

  const value = {
    user,
    isLoading,
    register,
    verifyRegistration,
    resendVerificationCode,
    login,
    logout,
    updateProfile,
    updateAvatar,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
