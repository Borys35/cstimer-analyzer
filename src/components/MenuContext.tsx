"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface MenuCtx {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const MenuContext = createContext<MenuCtx>({
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function MenuProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <MenuContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
