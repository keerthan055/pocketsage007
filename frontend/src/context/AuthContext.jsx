import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user details", error);
          setUser({ email: 'user@example.com' });
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/login`, formData);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    
    try {
      const userRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      setUser(userRes.data);
    } catch (err) {
      setUser({ email }); 
    }
    return response.data;
  };

  const register = async (email, password, fullName) => {
    const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/register`, {
      email,
      password,
      full_name: fullName
    });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
