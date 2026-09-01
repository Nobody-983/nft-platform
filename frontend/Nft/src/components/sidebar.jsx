import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Gamepad2,
  Wallet,
  User,
  Settings,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Marketplace",
    path: "/marketplace",
    icon: Store,
  },
  {
    name: "Games",
    path: "/games",
    icon: Gamepad2,
  },
  {
    name: "Wallet",
    path: "/wallet",
    icon: Wallet,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: User,
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#0b0b12] px-5 py-6 text-white">
      
      {/* Logo */}
      <div className="mb-10 px-3">
        <h1 className="text-2xl font-bold">
          Nimiq
        </h1>

        <p className="mt-1 text-xs text-gray-500">
          NFT ecosystem
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
            isActive
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
          }`
        }
      >
        <Settings size={19} />
        <span>Settings</span>
      </NavLink>

    </aside>
  );
}

export default Sidebar;