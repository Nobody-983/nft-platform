import { FiBell, FiSearch, FiMenu } from "react-icons/fi";

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08080f]/80 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-4 px-5 lg:px-8">

        {/* Mobile menu */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg
          border border-white/10 bg-white/5 text-gray-300
          transition hover:bg-white/10 lg:hidden"
        >
          <FiMenu size={20} />
        </button>


        {/* Search */}
        <div className="relative max-w-xl flex-1">

          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />

          <input
            type="text"
            placeholder="Search collectibles, creators..."
            className="h-11 w-full rounded-xl border border-white/5
            bg-[#111119] pl-11 pr-4 text-sm text-white
            outline-none placeholder:text-gray-600
            transition
            focus:border-purple-500/50
            focus:ring-2 focus:ring-purple-500/10"
          />

        </div>


        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">

          {/* Notifications */}
          <button
            className="relative flex h-10 w-10 items-center justify-center
            rounded-xl border border-white/5 bg-[#111119]
            text-gray-400 transition hover:bg-white/10
            hover:text-white"
          >

            <FiBell size={19} />

            {/* Notification dot */}
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full
              bg-purple-500 ring-2 ring-[#111119]"
            />

          </button>


          {/* Divider */}
          <div className="hidden h-8 w-px bg-white/10 sm:block" />


          {/* Profile */}
          <button className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white/5">

            <div
              className="flex h-9 w-9 items-center justify-center
              overflow-hidden rounded-full
              bg-gradient-to-br from-purple-500 to-pink-500"
            >
              <span className="text-sm font-bold text-white">
                A
              </span>
            </div>

            {/* User info */}
            <div className="hidden text-left md:block">

              <p className="text-sm font-medium text-white">
                Ahmed
              </p>

              <p className="text-xs text-gray-500">
                0x82f4...ad7e
              </p>

            </div>

          </button>

        </div>

      </div>
    </header>
  );
}

export default TopBar;