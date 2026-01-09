import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../components/SuperAdminSidebar";

const SuperAdminLayout = () => {
    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 flex overflow-hidden text-sm md:text-base">
            <SuperAdminSidebar />


            <main className="flex-1 w-full mx-auto overflow-x-hidden overflow-y-auto relative">
                <Outlet />
            </main>
        </div>
    );
};

export default SuperAdminLayout;
