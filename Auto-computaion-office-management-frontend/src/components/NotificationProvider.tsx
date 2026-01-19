import React, { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type NotificationType = "success" | "error";

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

interface NotificationContextProps {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextProps>(
  {} as NotificationContextProps
);

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const pushNotification = React.useCallback((type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const showSuccess = React.useCallback((message: string) => pushNotification("success", message), [pushNotification]);
  const showError = React.useCallback((message: string) => pushNotification("error", message), [pushNotification]);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError }}>
      {children}

      {createPortal(
        <div className="fixed top-5 right-5 space-y-3 z-50">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 rounded shadow-lg text-white animate-fadeIn
              ${n.type === "success" ? "bg-green-600" : "bg-red-600"}
              `}
            >
              {n.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
};
