import React, { createContext, useContext, useEffect, useState } from "react";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from "../lib/supabase";
import type { AuthContextType, AuthResponse, User } from "../types/auth";
import { clearState } from "../services/persistence";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps a raw Supabase Auth user to the app's lightweight User shape.
 * Name is stored in user_metadata.name when the account is created.
 */
function toAppUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name:
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split("@")[0] ||
      "Player",
    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
  };
}

const authSetupMessage =
  supabaseConfigError ||
  "Authentication is not configured. Add your Supabase credentials to .env.";

function getAuthErrorMessage(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("load failed")
  ) {
    return "Unable to reach the authentication server. Check your internet connection and Supabase project URL.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  return message || fallback;
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Restore existing session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ? toAppUser(session.user) : null);
      })
      .catch((error) => {
        console.error("[Auth] Session restore failed:", error);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Keep state in sync with Supabase session events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(toAppUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: authSetupMessage,
      };
    }

    try {
      // Step 1: Create authentication account
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim() },
        },
      });

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error, "Registration failed."),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: "Registration failed - please try again.",
        };
      }

      // Step 2: Create user profile
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          email: data.user.email,
          name: name.trim(),
          points: 0,
          level: 1,
          eco_score: 0,
        },
      ]);

      // Properly handle profile creation failure
      if (profileError) {
        console.error("[Auth] Profile insert failed:", profileError.message);

        return {
          success: false,
          error: getAuthErrorMessage(
            profileError,
            "Failed to create user profile."
          ),
        };
      }

      // Step 3: Create eco village
      const { error: villageError } = await supabase
        .from("eco_villages")
        .insert([
          {
            user_id: data.user.id,
            air_quality: 20,
            water_quality: 20,
            biodiversity: 10,
            trees: 0,
            solar_panels: 0,
            water_filters: 0,
            pollution_level: 80,
          },
        ]);

      // Properly handle eco village failure
      if (villageError) {
        console.error(
          "[Auth] Village initialization failed:",
          villageError.message
        );

        // Rollback user profile creation
        await supabase.from("users").delete().eq("id", data.user.id);

        return {
          success: false,
          error: getAuthErrorMessage(
            villageError,
            "Failed to initialize eco village."
          ),
        };
      }

      // Success
      return {
        success: true,
        user: toAppUser(data.user),
      };
    } catch (err: any) {
      console.error("[Auth] Register error:", err);

      return {
        success: false,
        error: getAuthErrorMessage(
          err,
          "An unexpected registration error occurred."
        ),
      };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: authSetupMessage,
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error, "Login failed."),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: "Login failed - please try again.",
        };
      }

      return {
        success: true,
        user: toAppUser(data.user),
      };
    } catch (err: any) {
      console.error("[Auth] Login error:", err);

      return {
        success: false,
        error: getAuthErrorMessage(err, "An unexpected login error occurred."),
      };
    }
  };

  const forgotPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: authSetupMessage,
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        return {
          success: false,
          error: getAuthErrorMessage(error, "Failed to send reset email."),
        };
      }

      return {
        success: true,
      };
    } catch (err: any) {
      console.error("[Auth] Forgot password error:", err);

      return {
        success: false,
        error: getAuthErrorMessage(err, "Failed to send reset email."),
      };
    }
  };

  const logout = async (): Promise<void> => {
    if (user) {
      clearState(user.id);
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        forgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
