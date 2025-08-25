import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  name: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<{ user: User }, Error, LoginData>;
  registerMutation: UseMutationResult<{ user: User }, Error, RegisterData>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<{ user: User }> => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json() as { user: User };
    },
    onSuccess: (data: { user: User }) => {
      const user = data.user;
      setUser(user);
      localStorage.setItem('auth_user', JSON.stringify(user));
      queryClient.clear(); // Clear all cached data for new user
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${user.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData): Promise<{ user: User }> => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json() as { user: User };
    },
    onSuccess: (data: { user: User }) => {
      const user = data.user;
      setUser(user);
      localStorage.setItem('auth_user', JSON.stringify(user));
      queryClient.clear(); // Clear all cached data for new user
      toast({
        title: "Account created!",
        description: `Welcome to LinkedIn AutoPoster AI, ${user.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    queryClient.clear(); // Clear all cached data
    toast({
      title: "Logged out",
      description: "Successfully logged out",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginMutation,
        registerMutation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}