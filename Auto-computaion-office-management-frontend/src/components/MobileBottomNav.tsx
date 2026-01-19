import React from 'react';
import { NavLink } from 'react-router-dom';


interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    end?: boolean;
}

interface MobileBottomNavProps {
    items: NavItem[];
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items }) => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default MobileBottomNav;
