// import React from 'react'
import { Navigate, useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import Dashboard from './pages/users/Dashboard';
import Tasks from './pages/users/Tasks';
import Notifications from './pages/users/Notifications';
import Attendance from './pages/users/Attendance';
import Chats from './pages/users/Chats';
import ApplyLeave from './pages/users/ApplyLeave';
import Meetings from './pages/users/Meetings';
import Settings from './pages/users/Settings';
import Payroll from './pages/users/Payroll';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageAdmins from './pages/admin/ManageAdmins';
import AdminAttendance from './pages/admin/AdminAttendance';
import Employees from './pages/admin/Employees';
import AdminLeaves from './pages/admin/AdminLeaves';
import AdminPayroll from './pages/admin/AdminPayroll';
import AdminSettings from './pages/admin/AdminSettings';
import PastEmployees from './pages/admin/PastEmployees';
import AdminHolidays from './pages/admin/AdminHolidays';
import AdminTasks from './pages/admin/AdminTasks';
import AdminMeetings from './pages/admin/AdminMeetings';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/error/Unauthorized';
import NotFound from './pages/error/NotFound';
import ResetPassword from './pages/auth/ResetPassword';

import ForgotPassword from './pages/auth/ForgotPassword';
import Verify2FA from './pages/auth/Verify2FA';
import TwoFactorGuard from './components/TwoFactorGuard';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import Departments from './pages/superadmin/Departments';

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/verify-2fa",
    element: <Verify2FA />,
  },
  {
    path: "/user",
    element: (
      <ProtectedRoute allowedRoles={['employee']}>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <Dashboard />,
      },
      {
        path: "tasks",
        element: <Tasks />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "attendance",
        element: <Attendance />,
      },
      {
        path: "chats",
        element: <Chats />,
      },
      {
        path: "leave",
        element: <ApplyLeave />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "payroll",
        element: <Payroll />,
      },
      {
        path: "meetings",
        element: <Meetings />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <TwoFactorGuard>
          <AdminLayout />
        </TwoFactorGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <AdminDashboard />,
      },
      {
        path: "employees",
        element: <Employees />,
      },
      {
        path: "leaves",
        element: <AdminLeaves />,
      },
      // {
      //   path: "manage-admins",
      //   element: <ManageAdmins />,
      // },
      {
        path: "attendance",
        element: <AdminAttendance />,
      },
      {
        path: "payroll",
        element: <AdminPayroll />,
      },
      {
        path: "settings",
        element: <AdminSettings />,
      },
      {
        path: "past-employees",
        element: <PastEmployees />,
      },
      {
        path: "holidays",
        element: <AdminHolidays />,
      },
      {
        path: "tasks",
        element: <AdminTasks />,
      },
      {
        path: "meetings",
        element: <AdminMeetings />,
      },
      {
        path: "chats",
        element: <Chats />,
      },
    ],
  },
  {
    path: "/super-admin",
    element: (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <TwoFactorGuard>
          <SuperAdminLayout />
        </TwoFactorGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <SuperAdminDashboard />,
      },
      {
        path: "manage-admins",
        element: <ManageAdmins />,
      },
      {
        path: "departments",
        element: <Departments />,
      },
      {
        path: "employees",
        element: <Employees />,
      },
      {
        path: "leaves",
        element: <AdminLeaves />,
      },
      {
        path: "attendance",
        element: <AdminAttendance />,
      },
      {
        path: "payroll",
        element: <AdminPayroll />,
      },
      {
        path: "settings",
        element: <AdminSettings />,
      },
      {
        path: "past-employees",
        element: <PastEmployees />,
      },
      {
        path: "holidays",
        element: <AdminHolidays />,
      },
      {
        path: "tasks",
        element: <AdminTasks />,
      },
      {
        path: "meetings",
        element: <AdminMeetings />,
      },
      {
        path: "chats",
        element: <Chats />,
      },
    ],
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
}

export default AppRoutes;
