
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Wallet, PlusCircle, PieChart, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MobileLayout() {
    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                <div className="p-4 max-w-md mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )
                        }
                    >
                        <LayoutDashboard size={24} />
                        <span className="text-[10px] font-medium">Home</span>
                    </NavLink>

                    <NavLink
                        to="/accounts"
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )
                        }
                    >
                        <Wallet size={24} />
                        <span className="text-[10px] font-medium">Accounts</span>
                    </NavLink>

                    <NavLink
                        to="/add"
                        className="flex flex-col items-center justify-center w-full h-full -mt-6"
                    >
                        <div className="bg-blue-600 rounded-full p-4 shadow-lg active:scale-95 transition-transform">
                            <PlusCircle size={32} className="text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 mt-1">Add</span>
                    </NavLink>

                    <NavLink
                        to="/reports"
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )
                        }
                    >
                        <PieChart size={24} />
                        <span className="text-[10px] font-medium">Reports</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )
                        }
                    >
                        <Settings size={24} />
                        <span className="text-[10px] font-medium">Settings</span>
                    </NavLink>
                </div>
            </nav>
        </div>
    );
}
