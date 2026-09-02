import { useState } from "react";
import {
  Bell,
  Camera,
  ChevronRight,
  Copy,
  Lock,
  LogOut,
  Moon,
  Shield,
  User,
  Wallet,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function Account({ user }) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // =========================
  // USER INFORMATION
  // =========================

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Nimiq User";

  const userEmail = user?.email || "";

  const userAvatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  const username =
    userName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "") || "nimiquser";

  const initial = userName.charAt(0).toUpperCase();

  // =========================
  // DEMO WALLET
  // =========================

  const walletAddress = "0x71C8A9B2F1D83E7C93A82F";

  const shortWalletAddress = `${walletAddress.slice(
    0,
    6
  )}...${walletAddress.slice(-6)}`;

  // =========================
  // COPY WALLET
  // =========================

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy wallet address:", error);
    }
  };

  // =========================
  // SIGN OUT
  // =========================

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        setSigningOut(false);
        return;
      }

      // Do NOT navigate here.
      // App.jsx listens for SIGNED_OUT
      // and redirects to /login.
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6 lg:px-8">
      {/* =========================
          HEADER
      ========================= */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Profile & Settings
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Manage your profile, wallet and Nimiq preferences.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* =========================
            PROFILE
        ========================= */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* Avatar */}
            <div className="relative shrink-0">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-3xl font-bold">
                  {initial}
                </div>
              )}

              <button
                type="button"
                className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-black shadow-lg transition hover:bg-gray-200"
                aria-label="Change profile picture"
              >
                <Camera size={15} />
              </button>
            </div>

            {/* User information */}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold sm:text-2xl">
                {userName}
              </h2>

              <p className="mt-1 truncate text-sm text-gray-400">
                @{username}
              </p>

              <p className="mt-2 truncate text-sm text-gray-500">
                {userEmail}
              </p>
            </div>

            <button
              type="button"
              className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700 sm:w-auto"
            >
              Edit Profile
            </button>
          </div>
        </section>

        {/* =========================
            ACCOUNT
        ========================= */}

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Account
          </h2>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

            {/* Personal Information */}
            <button
              type="button"
              className="flex w-full items-center gap-4 border-b border-white/10 p-5 text-left transition hover:bg-white/[0.05]"
            >
              <div className="shrink-0 rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <User size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Personal Information
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Name, username and email address
                </p>
              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-gray-500"
              />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.05]"
            >
              <div className="shrink-0 rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Bell size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Notifications
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Manage marketplace and account notifications
                </p>
              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-gray-500"
              />
            </button>

          </div>
        </section>

        {/* =========================
            WALLET
        ========================= */}

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Wallet
          </h2>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex items-center gap-4">
              <div className="shrink-0 rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Wallet size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Connected Wallet
                </p>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {shortWalletAddress}
                </p>
              </div>

              <span className="hidden rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 sm:block">
                Connected
              </span>
            </div>

            {/* Wallet address */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
              <p className="truncate text-sm text-gray-400">
                {walletAddress}
              </p>

              <button
                type="button"
                onClick={copyWalletAddress}
                className="ml-3 shrink-0 text-gray-500 transition hover:text-white"
                aria-label="Copy wallet address"
              >
                <Copy size={17} />
              </button>
            </div>

            {copied && (
              <p className="mt-2 text-xs text-green-400">
                Wallet address copied!
              </p>
            )}

            <button
              type="button"
              className="mt-4 text-sm font-medium text-red-400 transition hover:text-red-300"
            >
              Disconnect Wallet
            </button>

          </div>
        </section>

        {/* =========================
            PREFERENCES
        ========================= */}

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Preferences
          </h2>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

            {/* Dark Mode */}
            <div className="flex items-center gap-4 border-b border-white/10 p-5">
              <div className="shrink-0 rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Moon size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Dark Mode
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Use dark mode across Nimiq
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`h-6 w-11 shrink-0 rounded-full p-1 transition ${
                  darkMode
                    ? "bg-purple-600"
                    : "bg-gray-600"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition ${
                    darkMode ? "ml-auto" : "ml-0"
                  }`}
                />
              </button>
            </div>

            {/* Marketplace Notifications */}
            <div className="flex items-center gap-4 p-5">
              <div className="shrink-0 rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Bell size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Marketplace Notifications
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Get notified about sales and offers
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNotifications(!notifications)
                }
                className={`h-6 w-11 shrink-0 rounded-full p-1 transition ${
                  notifications
                    ? "bg-purple-600"
                    : "bg-gray-600"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition ${
                    notifications
                      ? "ml-auto"
                      : "ml-0"
                  }`}
                />
              </button>
            </div>

          </div>
        </section>

        {/* =========================
            SECURITY
        ========================= */}

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Security
          </h2>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

            {/* Security & Privacy */}
            <button
              type="button"
              className="flex w-full items-center gap-4 border-b border-white/10 p-5 text-left transition hover:bg-white/[0.05]"
            >
              <div className="shrink-0 rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Shield size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Security & Privacy
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Manage your security preferences
                </p>
              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-gray-500"
              />
            </button>

            {/* Connected Accounts */}
            <button
              type="button"
              className="flex w-full items-center gap-4 border-b border-white/10 p-5 text-left transition hover:bg-white/[0.05]"
            >
              <div className="shrink-0 rounded-xl bg-purple-600/10 p-3 text-purple-400">
                <Lock size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  Connected Accounts
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Manage accounts connected to Nimiq
                </p>
              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-gray-500"
              />
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-red-500/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="shrink-0 rounded-xl bg-red-500/10 p-3 text-red-400">
                <LogOut size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-red-400">
                  {signingOut
                    ? "Signing Out..."
                    : "Sign Out"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Sign out of your Nimiq account
                </p>
              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-gray-500"
              />
            </button>

          </div>
        </section>

      </div>
    </div>
  );
}

export default Account;