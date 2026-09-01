import {
  Bell,
  Camera,
  ChevronRight,
  Copy,
  Lock,
  Moon,
  Shield,
  User,
  Wallet,
} from "lucide-react";

function Account() {
  return (
    <div className="min-h-screen bg-[#0b0b12] px-6 py-6 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile & Settings</h1>

        <p className="mt-1 text-sm text-gray-400">
          Manage your profile, wallet and Nimiq preferences.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* Profile */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* Avatar */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-3xl font-bold">
                A
              </div>

              <button className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-black transition hover:bg-gray-200">
                <Camera size={15} />
              </button>
            </div>

            {/* User */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                Alex Morgan
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                @alexmorgan
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Digital creator & NFT collector
              </p>
            </div>

            <button className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700">
              Edit Profile
            </button>
          </div>
        </section>

        {/* Account Information */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Account
          </h2>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

            <button className="flex w-full items-center gap-4 border-b border-white/10 p-5 text-left transition hover:bg-white/[0.05]">
              <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <User size={20} />
              </div>

              <div className="flex-1">
                <p className="font-medium">Personal Information</p>

                <p className="mt-1 text-sm text-gray-500">
                  Name, username and email address
                </p>
              </div>

              <ChevronRight
                size={19}
                className="text-gray-500"
              />
            </button>

            <button className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.05]">
              <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Bell size={20} />
              </div>

              <div className="flex-1">
                <p className="font-medium">Notifications</p>

                <p className="mt-1 text-sm text-gray-500">
                  Manage marketplace and account notifications
                </p>
              </div>

              <ChevronRight
                size={19}
                className="text-gray-500"
              />
            </button>

          </div>
        </section>

        {/* Wallet */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Wallet
          </h2>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Wallet size={21} />
              </div>

              <div className="flex-1">
                <p className="font-medium">
                  Connected Wallet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  0x71C...93A82F
                </p>
              </div>

              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                Connected
              </span>
            </div>

            {/* Wallet address */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
              <p className="truncate text-sm text-gray-400">
                0x71C8A9B2F1D83E7C93A82F
              </p>

              <button className="ml-3 text-gray-500 transition hover:text-white">
                <Copy size={17} />
              </button>
            </div>

            <button className="mt-4 text-sm font-medium text-red-400 hover:text-red-300">
              Disconnect Wallet
            </button>

          </div>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Preferences
          </h2>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

            {/* Dark Mode */}
            <div className="flex items-center gap-4 border-b border-white/10 p-5">
              <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Moon size={20} />
              </div>

              <div className="flex-1">
                <p className="font-medium">
                  Dark Mode
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Use dark mode across Nimiq
                </p>
              </div>

              <button className="h-6 w-11 rounded-full bg-purple-600 p-1">
                <div className="ml-auto h-4 w-4 rounded-full bg-white" />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Bell size={20} />
              </div>

              <div className="flex-1">
                <p className="font-medium">
                  Marketplace Notifications
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Get notified about sales and offers
                </p>
              </div>

              <button className="h-6 w-11 rounded-full bg-purple-600 p-1">
                <div className="ml-auto h-4 w-4 rounded-full bg-white" />
              </button>
            </div>

          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Security
          </h2>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03]">

            <button className="flex w-full items-center gap-4 border-b border-white/10 p-5 text-left transition hover:bg-white/[0.05]">
              <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Shield size={20} />
              </div>

              <div className="flex-1">
                <p className="font-medium">
                  Security & Privacy
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Manage your security preferences
                </p>
              </div>

              <ChevronRight
                size={19}
                className="text-gray-500"
              />
            </button>

            <button className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.05]">
              <div className="rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Lock size={20} />
              </div>

              <div className="flex-1">
                <p className="font-medium">
                  Connected Accounts
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Manage accounts connected to Nimiq
                </p>
              </div>

              <ChevronRight
                size={19}
                className="text-gray-500"
              />
            </button>

          </div>
        </section>

      </div>
    </div>
  );
}

export default Account;