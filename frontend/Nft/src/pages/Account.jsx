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

function Account({ user }) {
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [showEditProfile, setShowEditProfile] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // LOAD PROFILE
  // =========================

  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error: profileError } = await supabase
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
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("LOAD PROFILE ERROR:", profileError);
          setError("Unable to load your profile.");
          return;
        }

        setProfile(data);

        setUsername(data?.username || "");
        setBio(data?.bio || "");
      } catch (err) {
        console.error("LOAD PROFILE ERROR:", err);
        setError("Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // =========================
  // USER INFORMATION
  // =========================

  const displayName =
    profile?.display_name ||
    profile?.username ||
    "Nimiq User";

  const profileUsername =
    profile?.username || "nimiquser";

  const userEmail = user?.email || "";

  const userAvatar = profile?.avatar_url || null;

  const initial =
    displayName?.charAt(0)?.toUpperCase() || "N";

  // =========================
  // WALLET
  // =========================

  const walletAddress = profile?.wallet_address || "";

  const shortWalletAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`
    : "No wallet connected";

  // =========================
  // COPY WALLET ADDRESS
  // =========================

  const copyWalletAddress = async () => {
    if (!walletAddress) return;

    try {
      await navigator.clipboard.writeText(walletAddress);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("COPY WALLET ERROR:", err);
    }
  };

  // =========================
  // OPEN EDIT PROFILE
  // =========================

  const openEditProfile = () => {
    setUsername(profile?.username || "");
    setBio(profile?.bio || "");

    setError("");
    setSuccess("");

    setShowEditProfile(true);
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (saving) return;

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
      setError("Username must be at least 3 characters.");
      return;
    }

    if (cleanUsername.length > 30) {
      setError("Username must be 30 characters or less.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data, error: updateError } = await supabase
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
        console.error("UPDATE PROFILE ERROR:", updateError);

        if (updateError.code === "23505") {
          setError("That username is already taken.");
        } else {
          setError("Unable to update your profile.");
        }

        return;
      }

      setProfile((previous) => ({
        ...previous,
        ...data,
      }));

      setUsername(data.username || "");
      setBio(data.bio || "");

      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        setShowEditProfile(false);
        setSuccess("");
      }, 1200);
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
      setError("Something went wrong while updating your profile.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DISCONNECT WALLET
  // =========================

  const handleDisconnectWallet = async () => {
    if (!user?.id || !walletAddress || disconnecting) return;

    const confirmed = window.confirm(
      "Are you sure you want to disconnect your wallet?"
    );

    if (!confirmed) return;

    try {
      setDisconnecting(true);
      setError("");
      setSuccess("");

      const { data, error: updateError } = await supabase
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

        setError("Unable to disconnect your wallet.");
        return;
      }

      setProfile((previous) => ({
        ...previous,
        ...data,
      }));

      setSuccess("Wallet disconnected.");

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("DISCONNECT WALLET ERROR:", err);
      setError("Something went wrong while disconnecting.");
    } finally {
      setDisconnecting(false);
    }
  };

  // =========================
  // SIGN OUT
  // =========================

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "SIGN OUT ERROR:",
          signOutError
        );

        setError("Unable to sign out.");
        setSigningOut(false);
      }

      // App.jsx should handle SIGNED_OUT
      // and redirect the user to /login.
    } catch (err) {
      console.error("SIGN OUT ERROR:", err);
      setError("Unable to sign out.");
      setSigningOut(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b12] text-white">
        <Loader2
          size={30}
          className="animate-spin text-purple-500"
        />
      </div>
    );
  }

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
          Manage your profile and connected wallet.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* =========================
            ERROR / SUCCESS
        ========================= */}

        {error && !showEditProfile && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

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

            {/* Avatar */}

            <div className="relative shrink-0">
              {userAvatar ? (
                <img
                  src={userAvatar}
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
                aria-label="Change profile picture"
              >
                <Camera size={15} />
              </button>
            </div>

            {/* Profile information */}

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold sm:text-2xl">
                @{profileUsername}
              </h2>

              <p className="mt-1 truncate text-sm text-gray-400">
                {userEmail}
              </p>

              {profile?.bio && (
                <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                  {profile.bio}
                </p>
              )}
            </div>

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

            {/* Personal Information */}

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
                  {shortWalletAddress}
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
            if (event.target === event.currentTarget) {
              setShowEditProfile(false);
              setError("");
              setSuccess("");
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11111a] p-5 shadow-2xl sm:p-6">

            {/* Modal header */}

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
                onClick={() => {
                  setShowEditProfile(false);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Close edit profile"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="space-y-5"
            >
              {/* Username */}

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
                      setUsername(event.target.value)
                    }
                    placeholder="username"
                    maxLength={30}
                    className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-600">
                  3–30 characters. Letters, numbers and
                  underscores only.
                </p>
              </div>

              {/* Email */}

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
                  value={userEmail}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-gray-500 outline-none"
                />

                <p className="mt-2 text-xs text-gray-600">
                  Your email is managed by your Nimiq account.
                </p>
              </div>

              {/* Bio */}

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
                    setBio(event.target.value)
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

              {/* Modal error */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Modal success */}

              {success && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  {success}
                </div>
              )}

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    setError("");
                    setSuccess("");
                  }}
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