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
  ExternalLink,
} from "lucide-react";

import {
  MotionDiv,
  MotionButton,
  fadeUp,
  fadeIn,
  staggerContainer,
} from "../components/motion";

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
    user,
    profile,
    balance,
    consensus,
    blockNumber,
    refreshBalance,
    nimiq,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals state
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Send form state
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendTxHash, setSendTxHash] = useState("");

  // Refresh balance on mount
  useEffect(() => {
    if (walletAddress) {
      refreshBalance(walletAddress);
    }
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
      console.warn("Refresh balance error:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  // ==========================================
  // ACTIONS: RECEIVE & SEND
  // ==========================================

  const handleOpenReceive = () => {
    if (!walletAddress) {
      setError("Please connect your Nimiq wallet first.");
      return;
    }
    setError("");
    setShowReceiveModal(true);
  };

  const handleOpenSend = () => {
    if (!walletAddress) {
      setError("Please connect your Nimiq wallet first.");
      return;
    }
    setError("");
    setSendTxHash("");
    setSendRecipient("");
    setSendAmount("");
    setSendMessage("");
    setShowSendModal(true);
  };

  const handleExecuteSend = async (e) => {
    e.preventDefault();
    if (!nimiq) {
      setError("Nimiq Pay provider is not initialized. Please ensure the app is open in Nimiq Pay.");
      return;
    }

    const cleanRecip = cleanAddress(sendRecipient);
    if (!cleanRecip || !cleanRecip.startsWith("NQ")) {
      setError("Please enter a valid recipient address starting with 'NQ'.");
      return;
    }

    const numAmount = Number(sendAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter an amount greater than 0 NIM.");
      return;
    }

    if (numAmount > balance) {
      setError("Insufficient NIM balance.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const txHash = await sendNIMTransaction(nimiq, {
        recipient: cleanRecip,
        valueInNim: numAmount,
        data: sendMessage.trim(),
      });

      setSendTxHash(txHash || "Success");
      setSuccess(`Transaction broadcasted successfully!`);
      // Update balance
      setTimeout(() => {
        refreshBalance(walletAddress);
      }, 2000);
    } catch (err) {
      console.error("Send NIM error:", err);
      setError(err?.message || "Failed to complete transaction.");
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // TRANSACTIONS MOCK / RECENT
  // ==========================================

  const transactions = [
    ["NFT Purchase", "-0.85 NIM", "Today"],
    ["NFT Sale", "+1.20 NIM", "Yesterday"],
    ["Wallet Deposit", "+2.00 NIM", "Aug 29"],
  ];

  const shortWalletAddress = walletAddress
    ? shortenAddress(walletAddress, 6, 6)
    : "No wallet connected";

  const formattedFullAddress = walletAddress
    ? formatNimiqAddress(walletAddress)
    : "";

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6 lg:px-8">
      {/* HEADER */}
      <MotionDiv variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your Nimiq wallet, balance and transactions.
        </p>
      </MotionDiv>

      <div className="max-w-4xl space-y-6">
        {/* NOTIFICATIONS */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center justify-between">
            <span>{success}</span>
            <button
              onClick={() => setSuccess("")}
              className="text-green-400 hover:text-green-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =========================
            WALLET BALANCE CARD
        ========================= */}
        <MotionDiv
          variants={fadeUp}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-600/30 to-white/[0.03] p-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-gray-400">
            <div className="flex items-center gap-3">
              <WalletIcon size={20} className="text-purple-400" />
              <span className="text-sm">Wallet Balance</span>
            </div>

            {walletAddress && (
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Refresh balance"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin text-purple-400" : ""}
                />
              </button>
            )}
          </div>

          <div className="mt-5">
            <h2 className="text-4xl font-bold tracking-tight">
              {walletAddress
                ? `${balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 5,
                  })} NIM`
                : "0.00 NIM"}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {walletAddress
                ? "Nimiq main account balance"
                : "Connect your Nimiq wallet to view your balance"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  walletAddress ? "bg-green-400" : "bg-gray-600"
                }`}
              />
              <span className="text-sm text-gray-400">
                {walletAddress ? "Wallet connected" : "No wallet connected"}
              </span>
            </div>

            {consensus && (
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs text-purple-300">
                Consensus Synced
              </span>
            )}

            {blockNumber && (
              <span className="text-xs text-gray-500">
                Block #{blockNumber.toLocaleString()}
              </span>
            )}
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
              <p className="text-sm text-gray-400">Your Wallet Account</p>
              <p className="mt-1 text-xs text-gray-500">
                Connected to your Nimiq profile
              </p>
            </div>
            <WalletIcon size={20} className="text-purple-400" />
          </div>

          {walletLoading ? (
            <div className="flex items-center gap-2 rounded-xl bg-black/20 px-4 py-4 text-sm text-gray-400">
              <Loader2 size={17} className="animate-spin text-purple-400" />
              Loading wallet...
            </div>
          ) : walletAddress ? (
            <>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-2 text-xs text-gray-500">Wallet Address</p>
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
                      <Check size={17} className="text-green-400" />
                    ) : (
                      <Copy size={17} />
                    )}
                  </MotionButton>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="break-all font-mono text-xs text-gray-500">
                  {formattedFullAddress}
                </p>
              </div>

              {copied && (
                <p className="mt-2 text-xs text-green-400">
                  Wallet address copied to clipboard!
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <a
                  href={`https://nimiq.watch/#${cleanAddress(walletAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
                >
                  View on Nimiq Watch
                  <ExternalLink size={13} />
                </a>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-gray-400">
                You don't have a wallet connected yet.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Connect your Nimiq wallet to start trading NFTs and sending payments.
              </p>

              <button
                type="button"
                onClick={connectWallet}
                disabled={walletLoading}
                className="mt-4 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-purple-700 disabled:opacity-50"
              >
                {walletLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
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
        </MotionDiv>

        {/* =========================
            ACTIONS
        ========================= */}
        <MotionDiv variants={fadeUp} className="grid grid-cols-2 gap-4">
          <MotionButton
            type="button"
            onClick={handleOpenReceive}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-medium transition hover:bg-purple-700"
          >
            <ArrowDownLeft size={18} />
            Receive
          </MotionButton>

          <MotionButton
            type="button"
            onClick={handleOpenSend}
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Account Details</h2>
            {isConnected && (
              <button
                type="button"
                onClick={disconnectWallet}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Disconnect
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-gray-400">Account ID / Username</p>
                <p className="mt-1 text-sm font-mono">
                  {profile?.username || user?.email || "Not logged in"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-gray-400">Wallet Status</p>
                <p className="mt-1 text-sm">
                  {walletAddress ? "Connected" : "Not connected"}
                </p>
              </div>

              {walletAddress ? (
                <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
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
                <p className="text-sm text-gray-400">Network</p>
                <p className="mt-1 text-sm text-gray-300">
                  {consensus ? "Nimiq Network (Synced)" : "Nimiq Network"}
                </p>
              </div>
              {blockNumber && (
                <span className="text-xs text-gray-500">
                  Height #{blockNumber}
                </span>
              )}
            </div>
          </div>
        </MotionDiv>

        {/* =========================
            TRANSACTIONS
        ========================= */}
        <MotionDiv variants={fadeUp}>
          <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>

          <MotionDiv
            variants={staggerContainer}
            className="rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            {transactions.map(([title, amount, date]) => (
              <MotionDiv
                key={`${title}-${date}`}
                variants={fadeIn}
                className="flex items-center justify-between border-b border-white/10 p-5 last:border-0"
              >
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-xs text-gray-500">{date}</p>
                </div>

                <p
                  className={`font-semibold ${
                    amount.startsWith("+") ? "text-green-400" : "text-white"
                  }`}
                >
                  {amount}
                </p>
              </MotionDiv>
            ))}
          </MotionDiv>
        </MotionDiv>
      </div>

      {/* =========================
          RECEIVE MODAL
      ========================= */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121e] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ArrowDownLeft size={20} className="text-purple-400" />
                Receive NIM
              </h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-xs text-gray-400">
                Share your Nimiq address with the sender to receive NIM directly into your wallet.
              </p>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-gray-500 mb-1">Your Nimiq Address</p>
                <p className="break-all font-mono text-sm leading-relaxed text-white">
                  {formattedFullAddress}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700"
                >
                  {copied ? (
                    <>
                      <Check size={16} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy Address
                    </>
                  )}
                </button>

                <a
                  href={`https://nimiq.watch/#${cleanAddress(walletAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium transition hover:bg-white/[0.1]"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              <p className="text-[11px] text-gray-500 text-center">
                Only send NIM to this address.
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
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ArrowUpRight size={20} className="text-purple-400" />
                Send NIM
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {sendTxHash ? (
              <div className="mt-5 space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <Check size={28} />
                </div>
                <h4 className="text-lg font-bold">Transaction Sent!</h4>
                <p className="text-xs text-gray-400 break-all font-mono">
                  Hash: {sendTxHash}
                </p>
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold hover:bg-purple-700 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecuteSend} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Recipient Nimiq Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="NQ..."
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-gray-600 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-400">Amount (NIM)</label>
                    <span className="text-xs text-gray-500">
                      Balance: {balance.toFixed(2)} NIM
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
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-purple-500 pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setSendAmount(String(balance))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-purple-400 hover:text-purple-300 px-2 py-1"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Message / Memo (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Note or reference"
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
                  />
                </div>

                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-xs text-purple-300">
                  Every transaction requires user confirmation in the native Nimiq Pay dialog.
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={16} />
                      Send Transaction
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
