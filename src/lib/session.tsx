"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { authClient } from "./auth-client";
import type { UserProfile, AuthState } from "./schemas";
import { setAuthToken, api } from "./api";

interface SessionContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeOnboarding: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isOnboardingComplete: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading } = authClient.useSession();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [planData, setPlanData] = useState<any>(null);

  useEffect(() => {
    setAuthToken((session as any)?.session?.id || null);
  }, [session]);

  useEffect(() => {
    if (session?.user && (session as any)?.session?.id) {
      api.getUserPlan()
        .then(setPlanData)
        .catch(() => setPlanData(null));
    } else {
      setPlanData(null);
    }
  }, [session?.user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const onboardingComplete = localStorage.getItem("kryptos_onboarding_complete");
      setIsOnboardingComplete(onboardingComplete === "true");
    }
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message || "Login failed");
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });
    if (error) throw new Error(error.message || "Registration failed");
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authClient.signIn.social({ provider: "google" });
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboardingComplete(true);
    localStorage.setItem("kryptos_onboarding_complete", "true");
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    const { error } = await authClient.updateUser({
      image: data.avatar_url ?? undefined,
      name: data.display_name ?? undefined,
    });
    if (error) throw new Error(error.message || "Failed to update profile");
  }, []);

  const mappedUser = useMemo<UserProfile | null>(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id as string,
      email: session.user.email,
      is_email_verified: session.user.emailVerified ?? false,
      premium_tier: (session.user as any).premium_tier || "free",
      subscription_status: (session.user as any).subscription_status || "active",
      created_at: session.user.createdAt.toISOString(),
      avatar_url: session.user.image,
      display_name: session.user.name,
      plan: planData?.plan || "free",
      daily_scans_used: planData?.daily_scans_used || 0,
      daily_scans_limit: planData?.daily_scans_limit || 5,
    };
  }, [session, planData]);

  const value = useMemo<SessionContextType>(
    () => ({
      isAuthenticated: !!session,
      isEmailVerified: session?.user.emailVerified ?? false,
      user: mappedUser,
      token: (session as any)?.session?.id || null,
      refreshToken: null,
      login,
      register,
      logout,
      loginWithGoogle,
      completeOnboarding,
      updateProfile,
      isOnboardingComplete,
      isLoading,
    } as any),
    [session, mappedUser, login, register, logout, loginWithGoogle, isOnboardingComplete, isLoading],
  );

  return (
    <SessionContext.Provider value={value}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
        </div>
      ) : children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
