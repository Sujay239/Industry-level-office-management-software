import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNotification } from "@/components/NotificationProvider";

// Define the shape of the context
export interface AttendanceContextType {
  status: "clocked_in" | "clocked_out" | "not_clocked_in";
  isCheckedIn: boolean; // Convenience boolean for UI toggles
  hasCheckedOut: boolean; // Convenience boolean for disabling UI
  startTime: number | null; // Timestamp for the timer
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  isLoading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(
  undefined
);

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<
    "clocked_in" | "clocked_out" | "not_clocked_in"
  >("not_clocked_in");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useNotification();

  // Load initial status from backend
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employee/dashboard/stats`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const backendStatus = data.stats.attendanceStatus; // 'clocked_in' | 'clocked_out' | 'not_clocked_in'

        setStatus(backendStatus);

        if (backendStatus === "clocked_in" && data.stats.checkInTime) {
          // If the backend sends a time string "HH:MM:SS" in UTC
          const [h, m, s] = data.stats.checkInTime.split(":").map(Number);

          const checkInDate = new Date();

          // --- FIXED: Use setUTCHours so the browser knows the DB time is UTC ---
          checkInDate.setUTCHours(h, m, s, 0);

          setStartTime(checkInDate.getTime());
        } else {
          setStartTime(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch attendance status", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const checkIn = async () => {
    if (status !== "not_clocked_in") return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/employee/dashboard/clock-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        // Optimistic update
        const now = Date.now();
        setStatus("clocked_in");
        setStartTime(now);
        showSuccess("Clocked In Successfully!");
      } else {
        const errorData = await response.json();
        showError(errorData.message || "Clock In Failed");
      }
    } catch (error) {
      console.error("Clock in error:", error);
      showError("Failed to clock in");
    }
  };

  const checkOut = async () => {
    if (status !== "clocked_in") return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/employee/dashboard/clock-out`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        setStatus("clocked_out");
        setStartTime(null);
        showSuccess("Clocked Out Successfully!");
      } else {
        const errorData = await response.json();
        showError(errorData.message || "Clock Out Failed");
      }
    } catch (error) {
      console.error("Clock out error:", error);
      showError("Failed to clock out");
    }
  };

  const isCheckedIn = status === "clocked_in";
  const hasCheckedOut = status === "clocked_out";

  return (
    <AttendanceContext.Provider
      value={{
        status,
        isCheckedIn,
        hasCheckedOut,
        startTime,
        checkIn,
        checkOut,
        isLoading,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};
