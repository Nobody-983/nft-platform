import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Wallet,
  Menu,
  X,
  PlusSquare,
  User,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Marketplace",
    path: "/marketplace",
    icon: Store,
  },
  {
    name: "My NFTs",
    path: "/create-nft",
    icon: PlusSquare,
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
  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* ================= MOBILE MENU BUTTON ================= */}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#151520] text-white shadow-lg lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      {/* ================= MOBILE OVERLAY ================= */}

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen flex-col
          border-r border-white/10
          bg-[#0b0b12]
          text-white
          shadow-xl
          transition-[width,transform]
          duration-300
          ease-in-out

          ${
            isOpen
              ? "w-64 translate-x-0 px-4"
              : "w-20 -translate-x-full px-3 lg:translate-x-0"
          }
        `}
      >
        {/* ================= HEADER ================= */}

        <div className="shrink-0 border-b border-white/5">
          <div
            className={`
              flex h-20 items-center
              ${isOpen ? "justify-between px-2" : "justify-center"}
            `}
          >
            {/* LOGO */}

            <div className="min-w-0">
              <h1
                className={`
                  font-black tracking-tight
                  ${isOpen ? "text-2xl" : "text-xl"}
                `}
              >
                {isOpen ? "Nimiq" : "N"}
              </h1>

              {isOpen && (
                <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-gray-500">
                  NFT ecosystem
                </p>
              )}
            </div>

            {/* CLOSE BUTTON */}

            {isOpen && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#151520] text-gray-400 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Close sidebar"
              >
                <X size={17} />
              </button>
            )}
          </div>

          {/* COLLAPSED DESKTOP BUTTON */}

          {!isOpen && (
            <div className="hidden justify-center pb-4 lg:flex">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#151520] text-gray-400 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Expand sidebar"
              >
                <Menu size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ================= NAVIGATION ================= */}

        <div className="flex min-h-0 flex-1 flex-col pt-7">
          {isOpen && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">
              Menu
            </p>
          )}

          <nav className="flex flex-col gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={handleNavigation}
                  className={({ isActive }) =>
                    `
                    group flex items-center
                    rounded-xl
                    py-3
                    text-sm font-medium
                    transition-all duration-200

                    ${
                      isOpen
                        ? "gap-3 px-4"
                        : "justify-center px-2"
                    }

                    ${
                      isActive
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                        : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                    }
                    `
                  }
                >
                  <Icon
                    size={19}
                    className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                  />

                  {isOpen && (
                    <span className="whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;