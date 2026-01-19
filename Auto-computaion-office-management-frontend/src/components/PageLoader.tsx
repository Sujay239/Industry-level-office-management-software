import { Loader2 } from "lucide-react";

const PageLoader = () => {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-slate-50 dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
};

export default PageLoader;
