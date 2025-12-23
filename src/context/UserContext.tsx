'use client';

import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getUser, uploadUser } from "@/lib/ServerActions/users";
import { User } from "@/interfaces";

interface UserContextType {
  userData: User | null;
  setUserData: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  handlerTheme: (theme: "dark" | "light" | "system") => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { ready, authenticated, user } = usePrivy();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrSetUser = async () => {
      console.log(`[UserContext] Effect triggered. Privy ready: ${ready}, authenticated: ${authenticated}`);
      if (ready) {
        if (authenticated && user) {
          setLoading(true);
          console.log("[UserContext] User is authenticated, fetching data for Privy UID:", user.id);
          try {
            const resUserData = await getUser(user.id);
            if (resUserData) {
              setUserData(resUserData);
            } else {
              console.log("[UserContext] User not found in DB, creating new user.");
              // If user does not exist in DB, create them with default values
              const newUser: User = {
                _id: user.id,
                fullName: user.google?.name || "New User",
                email: user.google?.email || "",
                avatar: "/logo.png",
                addresses: [],
                isSeller: false,
                joined: new Date().toISOString(),
                location: "",
                bio: "",
                website: "",
                twitter: "",
                x: "",
                instagram: "",
                telegram: "",
                facebook: "",
                settings: {
                  theme: "light",
                  currency: "USD",
                  language: "en",
                },
                wishlist: [],
                isLogisticsClient: false,
              };
              await uploadUser(newUser);
              setUserData(newUser);
            }
          } catch (error) {
            console.error("[UserContext] Failed to fetch or create user:", error);
            setUserData(null);
          } finally {
            console.log("[UserContext] Finished fetching, setting loading to false.");
            setLoading(false);
          }
        } else {
          console.log("[UserContext] User is not authenticated.");
          setUserData(null);
          setLoading(false);
        }
      }
    };

    fetchOrSetUser();
  }, [ready, authenticated, user]);

  // Sync theme from user settings when userData is loaded
  useEffect(() => {
    if (userData?.settings?.theme) {
      const savedTheme = userData.settings.theme as "light" | "dark" | "system";
      console.log(`[UserContext] Applying saved user theme: ${savedTheme}`);
      handlerTheme(savedTheme);
    }
  }, [userData]);

  // The theme logic can be simplified and should not run on server
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');

      if (defaultTheme === 'dark') {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const handlerTheme = (theme: "dark" | "light" | "system") => {
    let newTheme = theme;
    if (theme === "system") {
      newTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
    }

    if (newTheme === 'dark') {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    // Update context if needed, but DOM is the source of truth for theme
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, loading, handlerTheme }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};