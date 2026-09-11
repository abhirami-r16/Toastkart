import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('toastkart_user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load saved user:', error);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Check authentication when the application starts
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('toastkart_token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/me');

        setUser(res.data);
        localStorage.setItem('toastkart_user', JSON.stringify(res.data));
        localStorage.setItem('toastkart_last_user_id', res.data.id);
      } catch (err) {
        console.error('Authentication check failed:', err);

        localStorage.removeItem('toastkart_token');
        localStorage.removeItem('toastkart_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login using Laravel backend
  const login = async (email, password) => {
    try {
      const res = await api.post('/login', {
        email,
        password,
      });

      const { user, token } = res.data;

      if (!token) {
        return {
          success: false,
          message: 'Login failed: authentication token was not returned.',
        };
      }

      localStorage.setItem('toastkart_token', token);
      localStorage.setItem('toastkart_user', JSON.stringify(user));
      localStorage.setItem('toastkart_last_user_id', user.id);

      setUser(user);

      return {
        success: true,
        user,
      };
    } catch (err) {
      console.error('Login failed:', err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        'Invalid email or password.';

      return {
        success: false,
        message,
      };
    }
  };

  // Register using Laravel backend
  const register = async (
    name,
    email,
    password,
    role = 'owner',
    storeName = null,
    storeDescription = ''
  ) => {
    try {
      const payload = {
        name,
        email,
        password,
        role,
        store_name: storeName,
        store_description: storeDescription,
      };

      const res = await api.post('/register', payload);

      const { user, token } = res.data;

      // Registration successful, return without auto-logging in
      return {
        success: true,
        user,
      };
    } catch (err) {
      console.error('Registration failed:', err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        'Registration failed. Please try again.';

      return {
        success: false,
        message,
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = localStorage.getItem('toastkart_token');

      if (token) {
        await api.post('/logout');
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('toastkart_token');
      localStorage.removeItem('toastkart_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};