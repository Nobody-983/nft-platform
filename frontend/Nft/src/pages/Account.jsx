import { useWallet } from "../context/walletContext";
import { useEffect, useState } from "react";
import {
  Bell,
  Camera,
  Copy,
  ChevronRight,
  LogOut,
  User,
  Wallet,
  X,
  Loader2,
  Save,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function Account() {
  const { disconnectWallet } = useWallet();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [showEditProfile, setShowEditProfile] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  // ==========================================
  // LOAD ACCOUNT
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      try {
        setLoadingProfile(true);
        setError("");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("GET SESSION ERROR:", sessionError);

          if (mounted) {
            setError(
              sessionError.message ||
                "Unable to load your account."
            );
          }

          return;
        }

        if (!session?.user) {
          if (mounted) {
            setError("No active session found.");
          }

          return;
        }

        const currentUser = session.user;

        if (!mounted) return;

        setUser(currentUser);

        // ==========================================
        // LOAD PROFILE
        // ==========================================

        const { data, error: profileError } =
          await supabase
            .from("profiles")
            .select(`
              id,
              username,
              display_name,
              avatar_url,
              bio,
              wallet_address,
              created_at,
              updated_at
            `)
            .eq("id", currentUser.id)
            .maybeSingle();

        if (!mounted) return;

        if (profileError) {
          console.error(
            "LOAD PROFILE ERROR:",
            profileError
          );

          setError(
            profileError.message ||
              "Unable to load your profile."
          );

          return;
        }

        setProfile(data);
        setUsername(data?.username || "");
        setBio(data?.bio || "");
      } catch (err) {
        console.error("ACCOUNT LOAD ERROR:", err);

        if (mounted) {
          setError(
            err?.message ||
              "Something went wrong while loading your account."
          );
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================
  // PROFILE VALUES
  // ==========================================

  const displayName =
    profile?.display_name ||
    profile?.username ||
    "Nimiq User";

  const currentUsername =
    profile?.username || "username";

  const email =
    user?.email || "No email available";

  const avatar =
    profile?.avatar_url || null;

  const initial =
    displayName.charAt(0).toUpperCase();

  const walletAddress =
    profile?.wallet_address || "";

  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`
    : "No wallet connected";

  // ==========================================
  // EDIT PROFILE
  // ==========================================

  const openEditProfile = () => {
    setUsername(profile?.username || "");
    setBio(profile?.bio || "");

    setError("");
    setSuccess("");

    setShowEditProfile(true);
  };

  const closeEditProfile = () => {
    if (saving) return;

    setShowEditProfile(false);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (saving || !user?.id) return;

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    if (!cleanUsername) {
      setError("Username is required.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError(
        "Username can only contain letters, numbers and underscores."
      );
      return;
    }

    if (cleanUsername.length < 3) {
      setError(
        "Username must be at least 3 characters."
      );
      return;
    }

    if (cleanUsername.length > 30) {
      setError(
        "Username must be 30 characters or less."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data, error: updateError } =
        await supabase
          .from("profiles")
          .update({
            username: cleanUsername,
            bio: bio.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

      if (updateError) {
        console.error(
          "UPDATE PROFILE ERROR:",
          updateError
        );

        if (updateError.code === "23505") {
          setError("That username is already taken.");
        } else {
          setError(
            updateError.message ||
              "Unable to update your profile."
          );
        }

        return;
      }

      setProfile((previous) => ({
        ...previous,
        ...data,
      }));

      setUsername(data.username || "");
      setBio(data.bio || "");

      setSuccess(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setShowEditProfile(false);
        setSuccess("");
      }, 1000);
    } catch (err) {
      console.error(
        "UPDATE PROFILE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // COPY WALLET
  // ==========================================

  const copyWalletAddress = async () => {
    if (!walletAddress) return;

    try {
      await navigator.clipboard.writeText(
        walletAddress
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "COPY WALLET ERROR:",
        err
      );
    }
  };

  // ==========================================
  // DISCONNECT WALLET
  // ==========================================

  const handleDisconnectWallet = async () => {
    if (
      !walletAddress ||
      !user?.id ||
      disconnecting
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to disconnect your wallet?"
    );

    if (!confirmed) return;

    try {
      setDisconnecting(true);
      setError("");
      setSuccess("");

      const { data, error: updateError } =
        await supabase
          .from("profiles")
          .update({
            wallet_address: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

      if (updateError) {
        console.error(
          "DISCONNECT WALLET ERROR:",
          updateError
        );

        setError(
          updateError.message ||
            "Unable to disconnect your wallet."
        );

        return;
      }

      // Clear wallet state from the application too.
      disconnectWallet();

      setProfile((previous) => ({
        ...previous,
        ...data,
      }));

      setSuccess("Wallet disconnected.");

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error(
        "DISCONNECT WALLET ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to disconnect your wallet."
      );
    } finally {
      setDisconnecting(false);
    }
  };

  // ==========================================
  // SIGN OUT
  // ==========================================

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      setError("");

      // First clear the wallet state.
      disconnectWallet();

      // Then sign out of Supabase.
      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "SIGN OUT ERROR:",
          signOutError
        );

        setError(
          signOutError.message ||
            "Unable to sign out."
        );

        return;
      }

      // Supabase auth state is now signed out.
      // The auth guard will redirect the user
      // back to the login page.
    } catch (err) {
      console.error(
        "SIGN OUT ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to sign out."
      );
    } finally {
      setSigningOut(false);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6 lg:px-8">

      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Profile & Settings
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Manage your profile and connected wallet.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* LOADING NOTICE */}

        {loadingProfile && (
          <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
            <Loader2
              size={16}
              className="animate-spin"
            />
            Loading your profile...
          </div>
        )}

        {/* ERROR */}

        {error && !showEditProfile && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && !showEditProfile && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* =========================
            PROFILE
        ========================= */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* AVATAR */}

            <div className="relative shrink-0">

              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-3xl font-bold">
                  {initial}
                </div>
              )}

              <button
                type="button"
                onClick={openEditProfile}
                className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-black shadow-lg transition hover:bg-gray-200"
                aria-label="Edit profile"
              >
                <Camera size={15} />
              </button>

            </div>

            {/* INFO */}

            <div className="min-w-0 flex-1">

              <h2 className="truncate text-xl font-bold sm:text-2xl">
                @{currentUsername}
              </h2>

              <p className="mt-1 truncate text-sm text-gray-400">
                {email}
              </p>

              {profile?.bio && (
                <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                  {profile.bio}
                </p>
              )}

            </div>

            {/* EDIT BUTTON */}

            <button
              type="button"
              onClick={openEditProfile}
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

            {/* PERSONAL INFORMATION */}

            <button
              type="button"
              onClick={openEditProfile}
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
                  Username and bio
                </p>

              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-gray-500"
              />

            </button>

            {/* NOTIFICATIONS */}

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
                  Manage marketplace notifications
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
                  {shortWallet}
                </p>

              </div>

              {walletAddress && (
                <span className="hidden rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 sm:block">
                  Connected
                </span>
              )}

            </div>

            {walletAddress ? (
              <>

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
                  onClick={handleDisconnectWallet}
                  disabled={disconnecting}
                  className="mt-4 text-sm font-medium text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disconnecting
                    ? "Disconnecting..."
                    : "Disconnect Wallet"}
                </button>

              </>
            ) : (
              <div className="mt-5 rounded-xl bg-black/20 px-4 py-4">

                <p className="text-sm text-gray-500">
                  No wallet is currently connected.
                </p>

              </div>
            )}

          </div>

        </section>

        {/* =========================
            SIGN OUT
        ========================= */}

        <section>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-red-500/20 hover:bg-red-500/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
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

        </section>

      </div>

      {/* =========================
          EDIT PROFILE MODAL
      ========================= */}

      {showEditProfile && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeEditProfile();
            }
          }}
        >

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11111a] p-5 shadow-2xl sm:p-6">

            {/* HEADER */}

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Edit Profile
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update your Nimiq profile.
                </p>

              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSaveProfile}
              className="space-y-5"
            >

              {/* USERNAME */}

              <div>

                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium"
                >
                  Username
                </label>

                <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 transition focus-within:border-purple-500">

                  <span className="text-gray-500">
                    @
                  </span>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    placeholder="username"
                    maxLength={30}
                    className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                  />

                </div>

                <p className="mt-2 text-xs text-gray-600">
                  3–30 characters. Letters, numbers
                  and underscores only.
                </p>

              </div>

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-gray-500 outline-none"
                />

              </div>

              {/* BIO */}

              <div>

                <label
                  htmlFor="bio"
                  className="mb-2 block text-sm font-medium"
                >
                  Bio
                </label>

                <textarea
                  id="bio"
                  value={bio}
                  onChange={(event) =>
                    setBio(
                      event.target.value
                    )
                  }
                  placeholder="Tell people a little about yourself..."
                  maxLength={160}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
                />

                <div className="mt-2 text-right text-xs text-gray-600">
                  {bio.length}/160
                </div>

              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  {success}
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Account;