'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const COLOURS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', 
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#718096'
];

interface UserContextType {
  user: User | null;
  setUserName: (name: string) => void;
  isNameSet: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUserName: () => {},
  isNameSet: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isNameSet, setIsNameSet] = useState(false);

  useEffect(() => {
    // Check localStorage for existing user
    const savedUser = localStorage.getItem('workshopUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setIsNameSet(true);
    } else {
      // Create new user with random colour
      const newUser: User = {
        id: uuidv4(),
        name: '',
        colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
        lastSeen: Date.now(),
      };
      setUser(newUser);
    }
  }, []);

  const setUserName = (name: string) => {
    if (user) {
      const updatedUser = { ...user, name, lastSeen: Date.now() };
      setUser(updatedUser);
      localStorage.setItem('workshopUser', JSON.stringify(updatedUser));
      setIsNameSet(true);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUserName, isNameSet }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
