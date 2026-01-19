import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNotification } from "../../components/NotificationProvider";

interface FormValues {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const currentYear = new Date().getFullYear();
const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();

  const [values, setValues] = useState<FormValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // New State for Session Handling
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL || ''}/auth/me`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const role = data.user.role;

            // Check 2FA for admins/super_admins
            if (role === 'admin' || role === 'super_admin') {
              try {
                const twoFARes = await fetch(`${API_BASE_URL}/auth/2fa`, { credentials: 'include' });
                if (twoFARes.ok) {
                  const twoFAData = await twoFARes.json();
                  const target = role === 'super_admin' ? '/super-admin' : '/admin';
                  // If 2FA is enabled but session is not verified, go to verify page
                  if (twoFAData.twoFactorEnabled && !data.user.is2FAVerified) {
                    navigate('/verify-2fa', { replace: true, state: { from: { pathname: target } } });
                    return;
                  }
                }
              } catch (e) {
                console.error("2FA Check failed", e);
              }

              if (role === 'super_admin') navigate('/super-admin', { replace: true });
              else navigate('/admin', { replace: true });

            } else {
              navigate('/user', { replace: true });
            }
          }
        }
      } catch (error) {
        // Stay on login if auth fails
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error on change
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!/^\S+@\S+$/.test(values.email)) {
      newErrors.email = "Invalid email";
    }

    if (values.password.length < 6) {
      newErrors.password = "Password should include at least 6 characters";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const loginRequest = async (forceLogout = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...values, forceLogout }),
      });

      const data = await res.json();

      // --- DEBUG LOGS ---
      console.log("Login Response Status:", res.status);
      console.log("Login Response Data:", data);

      if (!res.ok) {
        // RELAXED CHECK: If status is 409, show session modal regardless of data payload
        if (res.status === 409) {
          console.log("Creating Session Active Modal...");
          setSessionActive(true);
          setLoading(false);
          return;
        }

        showError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Logic Success
      if (data.role === "admin" || data.role === "super_admin") {
        try {
          const twoFARes = await fetch(`${API_BASE_URL}/auth/2fa`, {
            credentials: 'include'
          });

          if (twoFARes.ok) {
            const twoFAData = await twoFARes.json();
            if (twoFAData.twoFactorEnabled) {
              const target = data.role === 'super_admin' ? '/super-admin' : '/admin';
              navigate("/verify-2fa", { state: { from: { pathname: target } } });
              return;
            }
          }
        } catch (err) {
          console.error("Failed to check 2FA status", err);
        }

        if (data.role === "super_admin") {
          navigate("/super-admin");
        } else {
          navigate("/admin");
        }

      } else {
        navigate("/user");
      }
    } catch (error) {
      console.error(error);
      showError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors).find(
        (err) => err !== undefined
      );
      if (firstError) showError(firstError);
      return;
    }

    // Attempt Login
    await loginRequest(false);
  };

  const handleForceLogout = async () => {
    setSessionActive(false);
    await loginRequest(true); // Retry with forceLogout = true
  };

  const handleCancelSession = () => {
    setSessionActive(false);
    setValues({ email: '', password: '' }); // Clear form
  }

  const handleContactAdmin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const adminEmail = "kotalsujay89@gmail.com";
    const subject = "Login Support Request - Office Management";
    const body = `Hello Admin,

I am having trouble accessing my account.

Email: ${values.email || "[No email provided]"}
Year: ${currentYear}`;

    // Gmail-specific compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      adminEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Opens in a new browser tab/window
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  // --- Render Session Active UI ---
  if (sessionActive) {
    return (
      <div className="relative min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Already Active</h2>
            <p className="text-slate-500 dark:text-slate-400">
              You are currently logged in on another device or browser. <br />
              Continuing here will log you out from the other session.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleForceLogout}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center justify-center shadow-lg shadow-red-500/20"
            >
              {loading ? "Processing..." : "Destroy Previous Session & Login"}
            </button>
            <button
              onClick={handleCancelSession}
              disabled={loading}
              className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 lg:flex lg:items-center lg:justify-center overflow-hidden">

      {/* Mobile Background Image (Visible only on small screens) */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <img
          src="/office_login_bg.png"
          alt="Background"
          className="w-full h-full object-cover blur-sm opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80" />
      </div>

      <div className="w-full min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-2 z-10 relative lg:shadow-none lg:bg-transparent lg:rounded-none overflow-hidden">

        {/* Left Side - Image (Desktop) */}
        <div className="hidden lg:relative lg:flex lg:flex-col lg:items-start lg:justify-end lg:p-20 overflow-hidden bg-slate-900">
          <img
            src="/office_login_bg.png"
            alt="Login background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />

          <div className="relative z-10 space-y-6 max-w-lg animate-in slide-in-from-left-10 duration-700">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fac5c8] to-[#9a91ff]">Workspace</span> with confidence.
            </h1>
            <p className="text-lg text-slate-300 font-light leading-relaxed">
              Streamline attendance, payroll, task management, and team collaboration in one unified platform.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white dark:bg-slate-950 lg:bg-white lg:dark:bg-slate-950 h-full">
          <div className="w-full flex flex-col justify-center max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500 lg:mt-36 max-sm:mt-[25%]">

            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
              <p className="text-slate-500 dark:text-slate-400">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={values.email}
                    onChange={handleChange}
                    className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:text-white"
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 animate-in slide-in-from-left-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" /> {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-slate-900 dark:text-white hover:underline">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange}
                    className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:text-white"
                    required
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 animate-in slide-in-from-left-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" /> {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center h-12 rounded-xl text-sm font-bold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 cursor-pointer transform active:scale-[0.98] duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : "Sign In"}
              </button>

            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
              <button onClick={handleContactAdmin} className="font-semibold text-slate-900 dark:text-white opacity-70 cursor-pointer">
                Contact Administrator
              </button>
            </p>
          </div>

          <div className="mt-auto pt-10 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-600">
              © {currentYear} Auto Computation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
