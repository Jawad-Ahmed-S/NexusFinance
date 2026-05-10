"use client";

import React, { createContext, useContext } from "react";
import { useSession } from "next-auth/react";

interface UserContextType {
  userId: number;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = Number((session?.user as { id?: string } | undefined)?.id) || 0;

  return (
    <UserContext.Provider value={{ userId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
