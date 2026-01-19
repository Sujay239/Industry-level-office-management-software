import { Navigate, useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageLoader from './components/PageLoader';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';

// Auth Components (Lazy load if not critical, but typically login is critical)
import Login from './pages/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import TwoFactorGuard from './components/TwoFactorGuard';

// Lazy Load Pages
// User Pages
const Dashboard = lazy(() => import('./pages/users/Dashboard'));
const Tasks = lazy(() => import('./pages/users/Tasks'));
const Notifications = lazy(() => import('./pages/users/Notifications'));
const Attendance = lazy(() => import('./pages/users/Attendance'));
const Chats = lazy(() => import('./pages/users/Chats'));
const ApplyLeave = lazy(() => import('./pages/users/ApplyLeave'));
const Meetings = lazy(() => import('./pages/users/Meetings'));
const Holidays = lazy(() => import('./pages/users/Holidays'));
const Settings = lazy(() => import('./pages/users/Settings'));
const Payroll = lazy(() => import('./pages/users/Payroll'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageAdmins = lazy(() => import('./pages/admin/ManageAdmins'));
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'));
const Employees = lazy(() => import('./pages/admin/Employees'));
const AdminLeaves = lazy(() => import('./pages/admin/AdminLeaves'));
const AdminPayroll = lazy(() => import('./pages/admin/AdminPayroll'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const PastEmployees = lazy(() => import('./pages/admin/PastEmployees'));
const AdminHolidays = lazy(() => import('./pages/admin/AdminHolidays'));
const AdminTasks = lazy(() => import('./pages/admin/AdminTasks'));
const AdminMeetings = lazy(() => import('./pages/admin/AdminMeetings'));
const AllowedIPs = lazy(() => import('./pages/admin/AllowedIPs'));

// Auth Pages (Non-critical)
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Verify2FA = lazy(() => import('./pages/auth/Verify2FA'));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const Departments = lazy(() => import('./pages/superadmin/Departments'));
const AuditLogs = lazy(() => import('./pages/superadmin/AuditLogs'));

// Error Pages
const Unauthorized = lazy(() => import('./pages/error/Unauthorized'));
const NotFound = lazy(() => import('./pages/error/NotFound'));


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
      {
        path: "holidays",
        element: <Holidays />,
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
      {
        path: "allowed-ips",
        element: <AllowedIPs />,
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
        path: "audit-logs",
        element: <AuditLogs />,
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
      {
        path: "allowed-ips",
        element: <AllowedIPs />,
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
  return (
    <Suspense fallback={<PageLoader />}>
      {element}
    </Suspense>
  );
}

export default AppRoutes;
