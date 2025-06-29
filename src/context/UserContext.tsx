'use client';

import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getUser, uploadUser } from "@/lib/ServerActions/users";
import { User } from "@/interfaces";
import { ObjectId } from "mongodb";



interface UserContextType {
  userData: User;
  setUserData: Dispatch<SetStateAction<User>>;
  handlerTheme: (theme: "dark" | "light" | "system") => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {

  const { ready, authenticated, user } = usePrivy()
  const [userData, setUserData] = useState<User>({
    _id: "" as unknown as ObjectId,
    name: "going",
    isSeller: false,
    addresses: [],
    email: "going@example.com",
    avatar: "/logo.png",
    joined: "January 2025",
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
      currency: "",
      language: "en",
    },
    wishlist: []
  });

  useEffect(() => {
    (async () => {
      if (ready && authenticated && user) {
        try {
          console.log("user", user, user?.id)
          const resUserData = (await getUser(user?.id.toString()))

          if (resUserData) {
            setUserData((prev) => ({
              ...prev,
              ...resUserData
            }))
            return
          }
          // Fetch user data or perform any necessary actions
          const defaultUserData: User = {
            _id: "" as unknown as ObjectId,
            name: "unknown",
            addresses: [],
            isSeller: false,
            email: "",
            avatar: "",
            joined: "",
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
            wishlist: []
          }

          setUserData(defaultUserData)
          uploadUser({
            ...defaultUserData,
            _id: user?.id.toString(),
            // addresses: user?.linkedAccounts?.filter((account) => account.type === "wallet").map((account) => account.address),
            name: user?.google?.name || "",
            email: user?.google?.email || "",
          })
        } catch (error) {
          console.log(error)

        }
      }
    })();
  }, [ready, authenticated, user]);

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
      setUserData((prevData) => ({
        ...prevData,
        settings: {
          ...prevData.settings,
          theme: "dark",
        },
      }));
      return
    } else if (localStorage.getItem("theme") === "light") {
      document.documentElement.classList.remove("dark");
      setUserData((prevData) => ({
        ...prevData,
        settings: {
          ...prevData.settings,
          theme: "light",
        },
      }));
      return
    }

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
      setUserData((prevData) => ({
        ...prevData,
        settings: {
          ...prevData.settings,
          theme: "dark",
        },
      }));
      return
    } else {
      document.documentElement.classList.remove("dark");

      setUserData((prevData) => ({
        ...prevData,
        settings: {
          ...prevData.settings,
          theme: "light",
        },
      }));
      return
    }
  }, []);

  const handlerTheme = (theme: "dark" | "light" | "system") => {
    if (theme === "dark") {
      document.documentElement.classList.remove(userData.settings.theme)
      document.documentElement.classList.add("dark")

    } else if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.remove(userData.settings.theme)
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark")
        setUserData((prevData) => ({
          ...prevData,
          settings: {
            ...prevData.settings,
            theme: "dark",
          },
        }));
        return
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.removeItem("theme")
        setUserData((prevData) => ({
          ...prevData,
          settings: {
            ...prevData.settings,
            theme: "light",
          },
        }));
        return
      }
    } else {
      document.documentElement.classList.remove(userData.settings.theme)
    }
    localStorage.setItem("theme", theme)
    setUserData((prevData) => ({
      ...prevData,
      settings: {
        ...prevData.settings,
        theme,
      },
    }));
  };



  return (
    <UserContext.Provider value={{ userData, setUserData, handlerTheme }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}