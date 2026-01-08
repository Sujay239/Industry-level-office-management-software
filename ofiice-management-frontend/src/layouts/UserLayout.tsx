import React from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";

const UserLayout: React.FC = () => {
  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 flex overflow-hidden">
      <UserSidebar />

      {/* Page content - Scrollable Area */}
      <main className="flex-1 w-full mx-auto sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
