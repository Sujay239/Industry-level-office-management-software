import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import db from './db/db.js';
import authRoutes from './routes/auth/auth.js';
import adminEmp from './routes/admin/adminEmp.js';
import manageAdmins from './routes/admin/manageAdmins.js';
import manageIPs from './routes/admin/manageIPs.js';
import adminPayroll from './routes/admin/adminPayroll.js';
import AdminLeaves from './routes/admin/AdminLeavesManagement.js';
import adminSetting from './routes/admin/adminSetting.js';
import forgotPasswordRoutes from './routes/auth/ForgotPassword.js';
import announcementRoutes from './routes/admin/announcements.js';
import adminHolidays from './routes/admin/adminHolidays.js';
import dashboardRoutes from './routes/admin/dashboard.js';
import adminTasks from './routes/admin/adminTasks.js';
import meetingRoutes from './routes/admin/meetings.js';
import adminDepartments from './routes/admin/adminDepartments.js';
import auditLogsRoutes from './routes/superadmin/auditLogs.js';
import settings from './routes/employees/setting.js';
import empDashboardRoutes from './routes/employees/dashboard.js';
// import clearTable from './scripts/clearTable.js';
import tasks from './routes/employees/tasks.js';
import notifications from './routes/admin/notifications.js';
import empNotification from './routes/employees/Notification.js';
import attendance from './routes/employees/attendance.js';
import payroll from './routes/employees/payroll.js';
import Leaves from './routes/employees/Leaves.js';
import chatRoutes from './routes/chat.js';
import { handleSocketConnection } from './controllers/chatController.js';
import adminAttendance from './routes/admin/adminAttendance.js';
import { sendEmail } from "./utils/mailer.js";
import { initScheduler } from './scheduler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';


// ===== FIX __dirname FOR ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== APP SETUP =====
const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;

app.use(helmet());

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Strict limit for auth routes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.'
});

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://office-management-sbuh.onrender.com",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost"
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'Access-Control-Allow-Headers']
};

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== HTTP + SOCKET =====
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true, // Required for cookies in Socket.IO handshake
    allowedHeaders: ["cookie"]
  },
  cookie: true // Enables cookie parsing support internally
});

app.set('socketio', io);

// ===== SOCKET AUTH MIDDLEWARE =====
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) {
    return next(new Error('Authentication error: No cookies found'));
  }

  const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  if (!token) {
    return next(new Error('Authentication error: Token not found'));
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.data.user = user;
    next();
  });
});

// ===== CRON JOB =====
cron.schedule('0 0 26 * *', async () => {
  console.log('Running Monthly Payroll Generation Job...');
  try {
    await db.query('SELECT generate_monthly_payroll()');
    console.log('Monthly Payroll Generated Successfully.');
  } catch (err) {
    console.error('Error generating payroll:', err);
  }
});

// ===== ROUTES =====

// Auth
app.use('/auth', authLimiter, authRoutes);
app.use('/auth', authLimiter, forgotPasswordRoutes);

// Super Admin
app.use('/superadmin/departments', adminDepartments);
app.use('/superadmin/audit-logs', auditLogsRoutes);

// Admin
app.use('/admin/departments', adminDepartments);
app.use('/admin/emp', adminEmp);
app.use('/api/admins', manageAdmins);
app.use('/api/ips', manageIPs);
app.use('/payroll', adminPayroll);
app.use('/admin/leaves', AdminLeaves);
app.use('/admin/settings', adminSetting);
app.use('/admin/announcements', announcementRoutes);
app.use('/admin/holidays', adminHolidays);
app.use('/admin/dashboard', dashboardRoutes);
app.use('/admin/tasks', adminTasks);
app.use('/admin/meetings', meetingRoutes);
app.use('/admin/notifications', notifications);
app.use('/admin/attendance', adminAttendance);

// Employees
app.use('/settings', settings);
app.use('/employee/dashboard', empDashboardRoutes);
app.use('/employee/tasks', tasks);
app.use('/employee/notifications', empNotification);
app.use('/employee/attendance', attendance);
app.use('/employee/payroll', payroll);
app.use('/employee/leaves', Leaves);

// Chat
app.use('/api/chats', chatRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Scripts
// app.use('/scripts', clearTable);

// Health
app.get('/health-check', (req, res) => {
  res.send('Backend is running!');
});



app.get("/debug-mail", async (req, res) => {
  try {
    console.log("🚀 /debug-mail hit");

    const toEmail = process.env.DEBUG_MAIL_TO;

    if (!toEmail) {
      return res.status(400).json({ error: "DEBUG_MAIL_TO environment variable is not set" });
    }

    const info = await sendEmail({
      to: toEmail,
      subject: "Brevo SMTP Test",
      text: "If you received this, Brevo SMTP is working correctly.",
    });

    res.json({ success: true, info });
  } catch (err) {
    console.error("❌ DEBUG MAIL ERROR:", err);
    res.status(500).json({ error: "Mail failed", details: err });
  }
});


// ===== SOCKET INIT =====
handleSocketConnection(io);


// Corn jobs
initScheduler();


// ===== GLOBAL ERROR HANDLER =====
app.use(errorHandler);


// ===== START SERVER =====
if (process.env.NODE_ENV !== 'test') {
  const server = httpServer.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

  // Graceful Shutdown Logic
  const shutdown = async () => {
    console.log('Received shutdown signal. Closing server...');
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await db.end(); // Close DB pool
        console.log('Database connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error during database disconnection:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Uncaught Exceptions & Rejections
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1); // Optional: depends on if you want to restart
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...', err);
    process.exit(1);
  });
}

export default app;
