// src/App.tsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { NotificationProvider } from "./components/NotificationProvider";
import { UserProvider } from "./components/UserProvider";
import { ThemeProvider } from "./hooks/use-theme";
import Approutes from "./routes";
import ScrollToTop from "./components/ScrollToTop";
import DynamicTitle from "./components/DynamicTitle";
import SessionGuard from "./components/SessionGuard";

const App: React.FC = () => {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <NotificationProvider>
          <UserProvider>
            <BrowserRouter>
              <DynamicTitle />
              <SessionGuard />
              <ScrollToTop />
              <Approutes />
            </BrowserRouter>
          </UserProvider>
        </NotificationProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
