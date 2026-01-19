import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="absolute top-5 right-5 flex items-center gap-2 rounded-full border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-xs sm:text-sm bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 shadow-md backdrop-blur-sm transition-colors duration-200 cursor-pointer"
    >
      <span>{isDark ? <Sun size={16} /> : <Moon size={16} />}</span>
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
};

export default ThemeToggle;
