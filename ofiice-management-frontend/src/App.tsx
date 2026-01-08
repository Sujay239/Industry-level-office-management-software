// src/App.tsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { NotificationProvider } from "./components/NotificationProvider";
import { UserProvider } from "./components/UserProvider";
import { ThemeProvider } from "./hooks/use-theme";
import Approutes from "./routes";

const App: React.FC = () => {
  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <NotificationProvider>
          <UserProvider>
            <BrowserRouter>
              <Approutes />
            </BrowserRouter>
          </UserProvider>
        </NotificationProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
