import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface Business {
  id: string;
  name: string;
  description: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  businesses: Business[];
  currentBusiness: Business | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setCurrentBusiness: (business: Business) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar token y currentBusiness del localStorage
    const savedToken = localStorage.getItem('token');
    const savedCurrentBusiness = localStorage.getItem('currentBusiness');

    if (savedToken) {
      // Verificar token con el backend
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.data.user);
            setBusinesses(data.data.businesses);
            setToken(savedToken);

            // Restaurar currentBusiness o seleccionar el primero
            if (savedCurrentBusiness) {
              const saved = JSON.parse(savedCurrentBusiness);
              const exists = data.data.businesses.find((b: Business) => b.id === saved.id);
              if (exists) {
                setCurrentBusinessState(saved);
              } else if (data.data.businesses.length > 0) {
                setCurrentBusinessState(data.data.businesses[0]);
                localStorage.setItem('currentBusiness', JSON.stringify(data.data.businesses[0]));
              }
            } else if (data.data.businesses.length > 0) {
              setCurrentBusinessState(data.data.businesses[0]);
              localStorage.setItem('currentBusiness', JSON.stringify(data.data.businesses[0]));
            }
          } else {
            // Token inválido
            localStorage.removeItem('token');
            localStorage.removeItem('currentBusiness');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('currentBusiness');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem('token', data.data.token);

    // Obtener negocios
    const businessesRes = await fetch(`${API_URL}/api/auth/businesses`, {
      headers: {
        'Authorization': `Bearer ${data.data.token}`,
      },
    });

    const businessesData = await businessesRes.json();

    if (businessesData.success && businessesData.data.length > 0) {
      setBusinesses(businessesData.data);
      setCurrentBusinessState(businessesData.data[0]);
      localStorage.setItem('currentBusiness', JSON.stringify(businessesData.data[0]));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem('token', data.data.token);

    // Obtener negocios
    const businessesRes = await fetch(`${API_URL}/api/auth/businesses`, {
      headers: {
        'Authorization': `Bearer ${data.data.token}`,
      },
    });

    const businessesData = await businessesRes.json();

    if (businessesData.success && businessesData.data.length > 0) {
      setBusinesses(businessesData.data);
      setCurrentBusinessState(businessesData.data[0]);
      localStorage.setItem('currentBusiness', JSON.stringify(businessesData.data[0]));
    }
  };

  const logout = () => {
    // Llamar al endpoint de logout
    if (token) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignorar errores de logout
      });
    }

    setUser(null);
    setBusinesses([]);
    setCurrentBusinessState(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentBusiness');
  };

  const setCurrentBusiness = (business: Business) => {
    setCurrentBusinessState(business);
    localStorage.setItem('currentBusiness', JSON.stringify(business));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businesses,
        currentBusiness,
        token,
        login,
        register,
        logout,
        setCurrentBusiness,
        isLoading,
      }}
    >
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
