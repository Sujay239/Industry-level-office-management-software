import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
    '/login': 'Login',
    '/reset-password': 'Reset Password',
    '/forgot-password': 'Forgot Password',
    '/verify-2fa': 'Verify 2FA',
    '/unauthorized': 'Unauthorized',

    // User Routes
    '/user': 'Dashboard',
    '/user/tasks': 'Tasks',
    '/user/notifications': 'Notifications',
    '/user/attendance': 'Attendance',
    '/user/chats': 'Chats',
    '/user/leave': 'Apply Leave',
    '/user/settings': 'Settings',
    '/user/payroll': 'Payroll',
    '/user/meetings': 'Meetings',
    '/user/holidays': 'Holidays',

    // Admin Routes
    '/admin': 'Admin Dashboard',
    '/admin/employees': 'Manage Employees',
    '/admin/leaves': 'Manage Leaves',
    '/admin/attendance': 'Attendance Reports',
    '/admin/payroll': 'Payroll Management',
    '/admin/settings': 'Admin Settings',
    '/admin/past-employees': 'Past Employees',
    '/admin/holidays': 'Manage Holidays',
    '/admin/tasks': 'Manage Tasks',
    '/admin/meetings': 'Manage Meetings',
    '/admin/chats': 'Chats',
    '/admin/allowed-ips': 'Allowed IPs',

    // Super Admin Routes
    '/super-admin': 'Super Admin Dashboard',
    '/super-admin/manage-admins': 'Manage Admins',
    '/super-admin/departments': 'Departments',
    '/super-admin/audit-logs': 'Audit Logs',
    '/super-admin/employees': 'Manage Employees',
    '/super-admin/leaves': 'Manage Leaves',
    '/super-admin/attendance': 'Attendance Reports',
    '/super-admin/payroll': 'Payroll Management',
    '/super-admin/settings': 'Super Admin Settings',
    '/super-admin/past-employees': 'Past Employees',
    '/super-admin/holidays': 'Manage Holidays',
    '/super-admin/tasks': 'Manage Tasks',
    '/super-admin/meetings': 'Manage Meetings',
    '/super-admin/chats': 'Chats',
    '/super-admin/allowed-ips': 'Allowed IPs',
};

const DynamicTitle = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        // Find exact match or default
        const title = routeTitles[path] || 'Office Management';
        document.title = `Auto Computation - ${title}`;
    }, [location]);

    return null;
};

export default DynamicTitle;
