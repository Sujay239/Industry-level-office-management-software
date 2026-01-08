import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

const AdminLayout: React.FC = () => {
    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 flex overflow-hidden text-sm md:text-base">
            <AdminSidebar />


            <main className="flex-1 w-full mx-auto overflow-x-hidden overflow-y-auto relative">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
