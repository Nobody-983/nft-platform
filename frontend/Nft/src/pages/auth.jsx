
import { useState } from "react";
import { init } from "@nimiq/mini-app-sdk";
import { Wallet, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Auth() {
  const navigate = useNavigate();

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    setConnecting(true);
    setError("");

    try {
      // Initialize the Nimiq provider
      const nimiq = await init();

      // Ask the user to connect/select their Nimiq account
      const accounts = await nimiq.listAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error("No Nimiq wallet account was selected.");
      }

      const walletAddress = accounts[0];

      // Save the connected wallet temporarily.
      // We will replace this with a verified backend session
      // once the authentication endpoint is connected.
      localStorage.setItem("nimiq_wallet", walletAddress);

      // Continue into the application
      navigate("/dashboard");
    } catch (err) {
      console.error("Wallet connection error:", err);

      if (
        err?.message?.toLowerCase().includes("denied") ||
        err?.message?.toLowerCase().includes("reject")
      ) {
        setError("Wallet connection was cancelled.");
      } else {
        setError(
          err?.message || "Unable to connect to your Nimiq wallet."
        );
      }
    } finally {
      setConnecting(false);
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
            Welcome back
          </h1>

          <p className="mt-3 text-sm text-white/50">
            Connect your Nimiq wallet to continue
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-white/10 bg-[#11111a] p-6 shadow-2xl">

          <button
            onClick={connectWallet}
            disabled={connecting}
            className="w-full h-14 rounded-2xl bg-white text-black font-semibold flex items-center justify-center gap-3 transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet size={20} />
                Connect Nimiq Wallet
              </>
            )}
          </button>

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
                Wallet-first authentication
              </p>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Your private keys never leave your Nimiq wallet.
                You approve wallet actions directly through Nimiq Pay.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/30">
          New here? Your wallet automatically creates your account.
        </p>
      </div>
    </div>
  );
}

export default Auth;
