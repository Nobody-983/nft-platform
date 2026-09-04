
import { useEffect, useState } from "react";
import {
  Wallet as WalletIcon,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";

import {
  MotionDiv,
  MotionButton,
  fadeUp,
  fadeIn,
  staggerContainer,
} from "../components/motion";

import { supabase } from "../lib/supabase";

function Wallet() {
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD USER WALLET
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const loadWallet = async () => {
      try {
        setLoading(true);
        setError("");

        // Get current logged-in user
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "GET SESSION ERROR:",
            sessionError
          );

          if (mounted) {
            setError(
              sessionError.message ||
                "Unable to load your wallet."
            );
          }

          return;
        }

        if (!session?.user) {
          if (mounted) {
            setError(
              "No active account found."
            );
          }

          return;
        }

        if (!mounted) return;

        setUser(session.user);

        // Get wallet from profile
        const { data, error: profileError } =
          await supabase
            .from("profiles")
            .select("wallet_address")
            .eq("id", session.user.id)
            .maybeSingle();

        if (!mounted) return;

        if (profileError) {
          console.error(
            "LOAD WALLET ERROR:",
            profileError
          );

          setError(
            profileError.message ||
              "Unable to load your wallet."
          );

          return;
        }

        setWalletAddress(
          data?.wallet_address || ""
        );
      } catch (err) {
        console.error(
          "WALLET LOAD ERROR:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Something went wrong while loading your wallet."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWallet();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================
  // WALLET DISPLAY
  // ==========================================

  const shortWalletAddress = walletAddress
    ? `${walletAddress.slice(
        0,
        8
      )}...${walletAddress.slice(-8)}`
    : "No wallet connected";

  // ==========================================
  // COPY ADDRESS
  // ==========================================

  const handleCopy = async () => {
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
  // ACTIONS
  // ==========================================

  const handleReceive = () => {
    if (!walletAddress) {
      alert("Connect a wallet first.");
      return;
    }

    alert(
      "Your wallet address is ready to receive NIM."
    );
  };

  const handleSend = () => {
    if (!walletAddress) {
      alert("Connect a wallet first.");
      return;
    }

    alert("Send feature coming soon.");
  };

  // ==========================================
  // TRANSACTIONS
  // ==========================================

  const transactions = [
    ["NFT Purchase", "-0.85 NIM", "Today"],
    ["NFT Sale", "+1.20 NIM", "Yesterday"],
    ["Wallet Deposit", "+2.00 NIM", "Aug 29"],
  ];

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6 lg:px-8">

      {/* HEADER */}

      <MotionDiv
        variants={fadeUp}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Wallet
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Manage your Nimiq wallet and transactions.
        </p>
      </MotionDiv>

      <div className="max-w-4xl space-y-6">

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* =========================
            WALLET BALANCE
        ========================= */}

        <MotionDiv
          variants={fadeUp}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-600/30 to-white/[0.03] p-6"
        >
          <div className="flex items-center gap-3 text-gray-400">
            <WalletIcon size={20} />

            <span className="text-sm">
              Wallet Balance
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-4xl font-bold">
              0 NIM
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Nimiq balance
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                walletAddress
                  ? "bg-green-400"
                  : "bg-gray-600"
              }`}
            />

            <span className="text-sm text-gray-400">
              {walletAddress
                ? "Wallet connected"
                : "No wallet connected"}
            </span>
          </div>
        </MotionDiv>

        {/* =========================
            USER WALLET ACCOUNT
        ========================= */}

        <MotionDiv
          variants={fadeUp}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Your Wallet Account
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Connected to your Nimiq profile
              </p>
            </div>

            <WalletIcon
              size={20}
              className="text-purple-400"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 rounded-xl bg-black/20 px-4 py-4 text-sm text-gray-500">
              <Loader2
                size={17}
                className="animate-spin"
              />

              Loading wallet...
            </div>
          ) : walletAddress ? (
            <>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-2 text-xs text-gray-500">
                  Wallet Address
                </p>

                <div className="flex items-center gap-3">
                  <p className="min-w-0 flex-1 truncate font-mono text-sm text-white">
                    {shortWalletAddress}
                  </p>

                  <MotionButton
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg bg-white/[0.06] p-2 text-gray-400 transition hover:bg-white/[0.1] hover:text-white"
                    aria-label="Copy wallet address"
                  >
                    {copied ? (
                      <Check
                        size={17}
                        className="text-green-400"
                      />
                    ) : (
                      <Copy size={17} />
                    )}
                  </MotionButton>
                </div>
              </div>

              <div className="mt-3">
                <p className="break-all font-mono text-xs text-gray-600">
                  {walletAddress}
                </p>
              </div>

              {copied && (
                <p className="mt-2 text-xs text-green-400">
                  Wallet address copied!
                </p>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-gray-400">
                You don't have a wallet connected yet.
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Connect a Nimiq wallet to start using
                marketplace features.
              </p>
            </div>
          )}
        </MotionDiv>

        {/* =========================
            ACTIONS
        ========================= */}

        <MotionDiv
          variants={fadeUp}
          className="grid grid-cols-2 gap-4"
        >
          <MotionButton
            type="button"
            onClick={handleReceive}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-medium transition hover:bg-purple-700"
          >
            <ArrowDownLeft size={18} />
            Receive
          </MotionButton>

          <MotionButton
            type="button"
            onClick={handleSend}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-medium transition hover:bg-white/[0.08]"
          >
            <ArrowUpRight size={18} />
            Send
          </MotionButton>
        </MotionDiv>

        {/* =========================
            ACCOUNT DETAILS
        ========================= */}

        <MotionDiv
          variants={fadeUp}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <h2 className="text-lg font-semibold">
            Account
          </h2>

          <div className="mt-5 space-y-4">

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-gray-400">
                  Email
                </p>

                <p className="mt-1 text-sm">
                  {user?.email || "Unavailable"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Wallet Status
                </p>

                <p className="mt-1 text-sm">
                  {walletAddress
                    ? "Connected"
                    : "Not connected"}
                </p>
              </div>

              {walletAddress && (
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                  Connected
                </span>
              )}
            </div>

          </div>
        </MotionDiv>

        {/* =========================
            TRANSACTIONS
        ========================= */}

        <MotionDiv variants={fadeUp}>

          <h2 className="mb-4 text-xl font-semibold">
            Recent Transactions
          </h2>

          <MotionDiv
            variants={staggerContainer}
            className="rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            {transactions.map(
              ([title, amount, date]) => (
                <MotionDiv
                  key={`${title}-${date}`}
                  variants={fadeIn}
                  className="flex items-center justify-between border-b border-white/10 p-5 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {date}
                    </p>
                  </div>

                  <p
                    className={`font-semibold ${
                      amount.startsWith("+")
                        ? "text-green-400"
                        : "text-white"
                    }`}
                  >
                    {amount}
                  </p>
                </MotionDiv>
              )
            )}
          </MotionDiv>

        </MotionDiv>

      </div>
    </div>
  );
}

export default Wallet;
