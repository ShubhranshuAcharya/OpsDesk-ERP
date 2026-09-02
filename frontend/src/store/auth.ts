import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isInitialized: false,
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  setUser: (user) => {
    set({ user });
  },
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  initialize: async () => {
    const token = get().token;
    if (!token) {
      set({ isInitialized: true, user: null });
      return;
    }
    
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data, isInitialized: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isInitialized: true });
    }
  }
}));
