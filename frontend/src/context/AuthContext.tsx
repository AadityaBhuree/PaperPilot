import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, type LoginRequest, type RegisterRequest, type UserResponse } from '../api/client';
import { AuthContext } from './AuthContextDef';

const STORAGE_KEY = 'paperpilot_token';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const saved = getStoredToken();
    if (saved) {
      api.defaults.headers.common['Authorization'] = `Bearer ${saved}`;
      // Fetch user profile
      api.get<UserResponse>('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token invalid — clear
          storeToken(null);
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
      return;
    }
    // No saved token — schedule state update to avoid React 19 synchronous rule
    queueMicrotask(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/auth/login', { email, password } satisfies LoginRequest);
    const newToken = res.data.access_token;
    storeToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    const me = await api.get<UserResponse>('/auth/me');
    setUser(me.data);
    setToken(newToken);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string, role: string) => {
    const res = await api.post<{ access_token: string }>('/auth/register', {
      email, password, display_name: displayName, role,
    } satisfies RegisterRequest);
    const newToken = res.data.access_token;
    storeToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    const me = await api.get<UserResponse>('/auth/me');
    setUser(me.data);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    storeToken(null);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
