import { useEffect, useState } from "react";
import {
  Wallet as WalletIcon,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react";

import { useWallet } from "../context/walletContext";
import {
  formatNimiqAddress,
  shortenAddress,
  cleanAddress,
  sendNIMTransaction,
} from "../lib/nimiq";

function Wallet() {
  const {
    walletAddress,
    isConnected,
    loading: walletLoading,
    connectWallet,
    disconnectWallet,
    profile,
    balance,
    balanceWarning,
    consensus,
    blockNumber,
    refreshBalance,
    nimiq,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendTxHash, setSendTxHash] = useState("");

  // ==========================================
  // REFRESH BALANCE
  // ==========================================

  useEffect(() => {
    if (!walletAddress) return;

    refreshBalance(walletAddress);
  }, [walletAddress, refreshBalance]);

  // ==========================================
  // COPY ADDRESS
  // ==========================================

  const handleCopy = async () => {
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

  // ==========================================
  // MANUAL BALANCE REFRESH
  // ==========================================

  const handleManualRefresh = async () => {
    if (!walletAddress || refreshing) return;

    setRefreshing(true);
    setError("");

    try {
      await refreshBalance(walletAddress);
    } catch (err) {
      console.error("REFRESH BALANCE ERROR:", err);
      setError("Failed to refresh wallet balance.");
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 600);
    }
  };

  // ==========================================
  // RECEIVE
  // ==========================================

  const handleOpenReceive = () => {
    if (!walletAddress) {
      setError("Please connect your Nimiq testnet wallet first.");
      return;
    }

    setError("");
    setShowReceiveModal(true);
  };

  // ==========================================
  // SEND
  // ==========================================

  const handleOpenSend = () => {
    if (!walletAddress) {
      setError("Please connect your Nimiq testnet wallet first.");
      return;
    }

    setError("");
    setSuccess("");
    setSendTxHash("");
    setSendRecipient("");
    setSendAmount("");
    setSendMessage("");
    setShowSendModal(true);
  };

  const handleExecuteSend = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!nimiq) {
      setError(
        "Nimiq Testnet provider is not initialized. Please open the app inside Nimiq Pay."
      );
      return;
    }

    const cleanRecip = cleanAddress(sendRecipient);

    if (!cleanRecip || !cleanRecip.startsWith("NQ")) {
      setError(
        "Please enter a valid Nimiq recipient address starting with NQ."
      );
      return;
    }

    const numAmount = Number(sendAmount);

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("Please enter an amount greater than 0 NIM.");
      return;
    }

    if (numAmount > balance) {
      setError("Insufficient testnet NIM balance.");
      return;
    }

    setSending(true);

    try {
      const txHash = await sendNIMTransaction(nimiq, {
        recipient: cleanRecip,
        valueInNim: numAmount,
        data: sendMessage.trim(),
      });

      setSendTxHash(txHash || "Transaction submitted");
      setSuccess("Testnet transaction broadcasted successfully!");

      setTimeout(() => {
        if (walletAddress) {
          refreshBalance(walletAddress);
        }
      }, 3000);
    } catch (err) {
      console.error("SEND TESTNET NIM ERROR:", err);

      setError(
        err?.message ||
          "Failed to complete the testnet transaction."
      );
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // ADDRESS
  // ==========================================

  const shortWalletAddress = walletAddress
    ? shortenAddress(walletAddress, 6, 6)
    : "No wallet connected";

  const formattedFullAddress = walletAddress
    ? formatNimiqAddress(walletAddress)
    : "";

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6 lg:px-8">

      {/* HEADER */}

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Wallet
          </h1>

          <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            TESTNET
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-400">
          Manage your Nimiq testnet wallet, balance and transactions.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">

        {/* NOTIFICATIONS */}

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 transition hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-400 transition hover:text-green-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =========================
            TESTNET NOTICE
        ========================= */}

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400" />

            <div>
              <p className="text-sm font-medium text-yellow-300">
                Nimiq Testnet
              </p>

              <p className="mt-1 text-xs text-yellow-400/70">
                You are using testnet NIM. Testnet tokens have no real-world value.
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            BALANCE DIAGNOSTIC WARNING
            (distinct from the static testnet notice above —
            this only appears when refreshBalance actually
            detected a problem: account not found on testnet,
            or the RPC call itself failed.)
        ========================= */}

        {balanceWarning && (
          <div className="flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{balanceWarning}</span>
          </div>
        )}

        {/* =========================
            WALLET BALANCE
        ========================= */}

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-600/30 to-white/[0.03] p-6">

          <div className="flex items-center justify-between text-gray-400">

            <div className="flex items-center gap-3">
              <WalletIcon
                size={20}
                className="text-purple-400"
              />

              <span className="text-sm">
                Testnet Wallet Balance
              </span>
            </div>

            {walletAddress && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Refresh balance"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin text-purple-400"
                      : ""
                  }
                />
              </button>
            )}

          </div>

          <div className="mt-5">

            <h2 className="text-4xl font-bold tracking-tight">
              {walletAddress
                ? `${Number(balance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 5,
                  })} NIM`
                : "0.00 NIM"}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {walletAddress
                ? "Nimiq Testnet account balance"
                : "Connect your Nimiq wallet to view your testnet balance"}
            </p>

          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2">

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

            {consensus && (
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs text-green-300">
                Testnet Synced
              </span>
            )}

            {blockNumber !== null &&
              blockNumber !== undefined && (
                <span className="text-xs text-gray-500">
                  Block #{Number(blockNumber).toLocaleString()}
                </span>
              )}

          </div>

        </div>

        {/* =========================
            USER WALLET ACCOUNT
        ========================= */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-400">
                Your Wallet Account
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Connected to your Nimiq testnet wallet
              </p>
            </div>

            <WalletIcon
              size={20}
              className="text-purple-400"
            />

          </div>

          {walletLoading ? (

            <div className="flex items-center gap-2 rounded-xl bg-black/20 px-4 py-4 text-sm text-gray-400">

              <Loader2
                size={17}
                className="animate-spin text-purple-400"
              />

              Loading wallet...

            </div>

          ) : walletAddress ? (

            <>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                <p className="mb-2 text-xs text-gray-500">
                  Testnet Wallet Address
                </p>

                <div className="flex items-center gap-3">

                  <p className="min-w-0 flex-1 truncate font-mono text-sm text-white">
                    {shortWalletAddress}
                  </p>

                  <button
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
                  </button>

                </div>

              </div>

              <div className="mt-3">

                <p className="break-all font-mono text-xs text-gray-500">
                  {formattedFullAddress}
                </p>

              </div>

              {copied && (
                <p className="mt-2 text-xs text-green-400">
                  Wallet address copied to clipboard!
                </p>
              )}
            </>

          ) : (

            <div className="rounded-xl border border-white/10 bg-black/20 p-5">

              <p className="text-sm text-gray-400">
                You don't have a wallet connected yet.
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Connect your Nimiq wallet to start using testnet NIM.
              </p>

              <button
                type="button"
                onClick={connectWallet}
                disabled={walletLoading}
                className="mt-4 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-purple-700 disabled:opacity-50"
              >

                {walletLoading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Connecting...
                  </>
                ) : (
                  <>
                    <WalletIcon size={16} />
                    Connect Nimiq Wallet
                  </>
                )}

              </button>

            </div>

          )}

        </div>

        {/* =========================
            ACTIONS
        ========================= */}

        <div className="grid grid-cols-2 gap-4">

          <button
            type="button"
            onClick={handleOpenReceive}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-medium transition hover:bg-purple-700"
          >
            <ArrowDownLeft size={18} />
            Receive
          </button>

          <button
            type="button"
            onClick={handleOpenSend}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-medium transition hover:bg-white/[0.08]"
          >
            <ArrowUpRight size={18} />
            Send
          </button>

        </div>

        {/* =========================
            ACCOUNT DETAILS
        ========================= */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-lg font-semibold">
              Account Details
            </h2>

            {isConnected && (
              <button
                type="button"
                onClick={disconnectWallet}
                className="text-xs text-red-400 transition hover:text-red-300"
              >
                Disconnect
              </button>
            )}

          </div>

          <div className="space-y-4">

            <div className="border-b border-white/10 pb-4">

              <p className="text-sm text-gray-400">
                Account ID / Username
              </p>

              <p className="mt-1 font-mono text-sm">
                {profile?.username || "Not logged in"}
              </p>

            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-4">

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

              {walletAddress ? (
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                  Connected
                </span>
              ) : (
                <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs text-gray-500">
                  Disconnected
                </span>
              )}

            </div>

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  Network
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Nimiq Testnet
                </p>

              </div>

              {blockNumber !== null &&
                blockNumber !== undefined && (
                  <span className="text-xs text-gray-500">
                    Height #{Number(blockNumber).toLocaleString()}
                  </span>
                )}

            </div>

          </div>

        </div>

        {/* =========================
            TRANSACTIONS
        ========================= */}

        <div>

          <h2 className="mb-4 text-xl font-semibold">
            Recent Transactions
          </h2>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03]">

            <div className="p-5 text-sm text-gray-500">
              No recent transactions.
            </div>

          </div>

        </div>

      </div>

      {/* =========================
          RECEIVE MODAL
      ========================= */}

      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121e] p-6 shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/10 pb-4">

              <h3 className="flex items-center gap-2 text-lg font-semibold">

                <ArrowDownLeft
                  size={20}
                  className="text-purple-400"
                />

                Receive Testnet NIM

              </h3>

              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            <div className="mt-5 space-y-4">

              <p className="text-xs text-gray-400">
                Share this Nimiq testnet address with the sender to receive testnet NIM.
              </p>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4">

                <p className="mb-1 text-xs text-gray-500">
                  Your Testnet Nimiq Address
                </p>

                <p className="break-all font-mono text-sm leading-relaxed text-white">
                  {formattedFullAddress}
                </p>

              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700"
              >

                {copied ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Address
                  </>
                )}

              </button>

              <p className="text-center text-[11px] text-gray-500">
                Only send Nimiq testnet NIM to this address.
              </p>

            </div>

          </div>

        </div>
      )}

      {/* =========================
          SEND MODAL
      ========================= */}

      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121e] p-6 shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/10 pb-4">

              <h3 className="flex items-center gap-2 text-lg font-semibold">

                <ArrowUpRight
                  size={20}
                  className="text-purple-400"
                />

                Send Testnet NIM

              </h3>

              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            {sendTxHash ? (

              <div className="mt-5 space-y-4 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <Check size={28} />
                </div>

                <h4 className="text-lg font-bold">
                  Transaction Sent!
                </h4>

                <p className="text-xs text-gray-400">
                  Your testnet transaction was submitted successfully.
                </p>

                <p className="break-all rounded-xl bg-black/30 p-3 font-mono text-xs text-gray-400">
                  {sendTxHash}
                </p>

                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700"
                >
                  Close
                </button>

              </div>

            ) : (

              <form
                onSubmit={handleExecuteSend}
                className="mt-5 space-y-4"
              >

                <div>

                  <label className="mb-1 block text-xs text-gray-400">
                    Recipient Nimiq Address
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="NQ..."
                    value={sendRecipient}
                    onChange={(e) =>
                      setSendRecipient(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500"
                  />

                </div>

                <div>

                  <div className="mb-1 flex items-center justify-between">

                    <label className="text-xs text-gray-400">
                      Amount (NIM)
                    </label>

                    <span className="text-xs text-gray-500">
                      Balance: {Number(balance || 0).toFixed(2)} NIM
                    </span>

                  </div>

                  <div className="relative">

                    <input
                      type="number"
                      step="any"
                      min="0.00001"
                      required
                      placeholder="0.0"
                      value={sendAmount}
                      onChange={(e) =>
                        setSendAmount(e.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 pr-16 text-sm text-white outline-none focus:border-purple-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setSendAmount(
                          String(Number(balance || 0))
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-purple-400 transition hover:text-purple-300"
                    >
                      MAX
                    </button>

                  </div>

                </div>

                <div>

                  <label className="mb-1 block text-xs text-gray-400">
                    Message / Memo (Optional)
                  </label>

                  <input
                    type="text"
                    placeholder="Note or reference"
                    value={sendMessage}
                    onChange={(e) =>
                      setSendMessage(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500"
                  />

                </div>

                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-300">
                  This transaction uses Nimiq Testnet. You will still need to confirm the transaction in Nimiq Pay.
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700 disabled:opacity-50"
                >

                  {sending ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={16} />
                      Send Testnet NIM
                    </>
                  )}

                </button>

              </form>

            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Wallet;
