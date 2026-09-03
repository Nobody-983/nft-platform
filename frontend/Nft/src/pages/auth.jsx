
import { useState } from "react";
import { Wallet, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useWallet } from "../context/walletContext";

function Auth() {
  const navigate = useNavigate();

  const {
    connectWallet,
    isConnected,
    walletAddress,
    loading,
  } = useWallet();

  const [error, setError] = useState("");

  const handleConnect = async () => {
    setError("");

    try {
      const address = await connectWallet();

      if (!address) {
        throw new Error(
          "No Nimiq wallet account was selected."
        );
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Wallet connection error:", err);

      const message = err?.message?.toLowerCase() || "";

      if (
        message.includes("denied") ||
        message.includes("reject") ||
        message.includes("cancel")
      ) {
        setError("Wallet connection was cancelled.");
      } else {
        setError(
          err?.message ||
            "Unable to connect to your Nimiq wallet."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a25] border border-white/10">
            <Wallet size={30} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Welcome
          </h1>

          <p className="mt-3 text-sm text-white/50">
            Connect your Nimiq wallet to enter the marketplace
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-white/10 bg-[#11111a] p-6 shadow-2xl">

          {/* Connected wallet */}
          {isConnected && walletAddress ? (
            <div className="space-y-4">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/40 mb-2">
                  Connected wallet
                </p>

                <p className="text-sm font-medium break-all">
                  {walletAddress}
                </p>
              </div>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full h-14 rounded-2xl bg-white text-black font-semibold flex items-center justify-center gap-3 transition hover:bg-white/90"
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-white text-black font-semibold flex items-center justify-center gap-3 transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={20} />
                  Connect Nimiq Wallet
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Security information */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/[0.03] p-4">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-white/70"
            />

            <div>
              <p className="text-sm font-medium">
                Your wallet, your identity
              </p>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Your private keys never leave your Nimiq
                wallet. Wallet actions are approved directly
                through Nimiq.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/30">
          New here? Connecting your wallet automatically
          creates your account.
        </p>
      </div>
    </div>
  );
}

export default Auth;
