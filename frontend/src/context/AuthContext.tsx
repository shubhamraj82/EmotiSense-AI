import { createContext, useContext, useEffect, useState } from "react";
import type { IUser } from "../../public/assets/assets";
import api from "../configs/api";
import toast from "react-hot-toast";

interface AuthContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  isLoading: boolean;
  login: (user: { email: string; password: string }) => Promise<void>;
  signUp: (user: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  user: null,
  setUser: () => {},
  isLoading: true,
  login: async () => {},
  signUp: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const signUp = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Sign up failed");
    }
  };

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  const logout = async () => {
    try {
      const { data } = await api.post("/api/auth/logout");
      setUser(null);
      setIsLoggedIn(false);
      toast.success(data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/api/auth/verify");
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
    } catch (error: any) {
      // Silently handle — user is simply not logged in yet
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchUser();
    })();
  }, []);

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    user,
    setUser,
    isLoading,
    login,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
