import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Define the shape of the user data
export interface UserProfile {
  name: string;
  email: string;
  role: string;
  bio: string;
  phone: string;
  location: string;
  avatar: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const defaultUser: UserProfile = {
  name: "John Doe",
  email: "john.doe@example.com",
  role: "Software Engineer",
  bio: "Passionate developer loving React and modern UI design.",
  phone: "+1 (555) 123-4567",
  location: "New York, USA",
  avatar: "/profile.png",
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
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
