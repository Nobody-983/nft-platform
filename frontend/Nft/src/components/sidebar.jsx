import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Wallet,
  User,
  Menu,
  X,
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
    name: "Wallet",
    path: "/wallet",
    icon: Wallet,
  },
  {
    name: "Account",
    path: "/account",
    icon: User,
  },
];

function Sidebar({ isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-[#151520] p-2 text-white lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40
          flex h-screen flex-col
          border-r border-white/10
          bg-[#0b0b12]
          px-5 py-6
          text-white
          transition-all duration-300

          ${
            isOpen
              ? "w-64 translate-x-0"
              : "w-20 -translate-x-0 px-3"
          }

          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div
          className={`mb-10 transition-all ${
            isOpen ? "px-3" : "px-0 text-center"
          }`}
        >
          <h1 className="text-2xl font-bold">
            {isOpen ? "Nimiq" : "N"}
          </h1>

          {isOpen && (
            <p className="mt-1 text-xs text-gray-500">
              NFT ecosystem
            </p>
          )}
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
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  `
                  flex items-center
                  rounded-xl
                  py-3
                  text-sm font-medium
                  transition-all

                  ${isOpen ? "gap-3 px-4" : "justify-center px-2"}

                  ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                  }
                  `
                }
              >
                <Icon size={19} />

                {isOpen && (
                  <span>{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop collapse button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden items-center justify-center rounded-xl p-3 text-gray-400 transition hover:bg-white/5 hover:text-white lg:flex"
        >
          {isOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </aside>
    </>
  );
}

export default Sidebar;