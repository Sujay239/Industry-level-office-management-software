import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Define the shape of the user data
export interface UserProfile {
  name: string;
  email: string;
  role: string;
  designation: string;
  bio: string;
  phone: string;
  location: string;
  avatar: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const defaultUser: UserProfile = {
  name: "",
  email: "",
  role: "",
  designation: "",
  bio: "",
  phone: "",
  location: "",
  avatar: "",
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isLoading, setIsLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/myData`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const dbUser = data.user;
          if (dbUser) {
            setUser({
              name: dbUser.name || "",
              email: dbUser.email || "",
              role: dbUser.role || "employee",
              bio: dbUser.bio || "No bio available.",
              phone: dbUser.phone || "N/A",
              location: dbUser.location || "N/A",
              avatar: dbUser.avatar_url || "/profile.png",
              designation: dbUser.designation || "N/A"
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [BASE_URL]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
