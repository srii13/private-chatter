import { create } from 'zustand';
import { generateKeyPair } from '../utils/crypto';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('chat_user')) || null, // {id, username, public_key, avatar}
  token: localStorage.getItem('chat_token') || null,
  isAuthenticated: !!localStorage.getItem('chat_token'),
  privateKey: localStorage.getItem('chat_private_key') || null,

  setToken: (token) => {
    localStorage.setItem('chat_token', token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem('chat_user', JSON.stringify(user));
    set({ user });
  },

  login: async (username, password) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Login failed');
      }
      const data = await res.json();
      
      // We expect the private key to be in localStorage from registration or previous session on this device
      const storedPrivateKey = localStorage.getItem(`priv_${data.user.username}`);
      if (storedPrivateKey) {
        localStorage.setItem('chat_private_key', storedPrivateKey);
        set({ privateKey: storedPrivateKey });
      } else {
        console.warn('Private key not found on this device for this user!');
      }

      get().setToken(data.token);
      get().setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  },

  register: async (username, password) => {
    try {
      const keys = generateKeyPair();
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          public_key: keys.publicKey
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Registration failed');
      }
      const data = await res.json();

      // Store private key locally
      localStorage.setItem('chat_private_key', keys.privateKey);
      localStorage.setItem(`priv_${username}`, keys.privateKey);
      set({ privateKey: keys.privateKey });

      get().setToken(data.token);
      get().setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_private_key');
    localStorage.removeItem('chat_user');
    set({ user: null, token: null, isAuthenticated: false, privateKey: null });
  }
}));
