import {
  Wallet as WalletIcon,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

function Wallet() {
  return (
    <div className="min-h-screen bg-[#0b0b12] px-6 py-6 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your digital assets and transactions.
        </p>
      </div>

      {/* Balance */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-600/30 to-white/[0.03] p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <WalletIcon size={20} />
          <span className="text-sm">Total Balance</span>
        </div>

        <h2 className="mt-4 text-4xl font-bold">$12,480.50</h2>

        <p className="mt-2 text-sm text-green-400">
          +8.42% this month
        </p>
      </div>

      {/* Wallet Address */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="mb-2 text-sm text-gray-400">Wallet Address</p>

        <div className="flex items-center justify-between gap-4">
          <p className="truncate text-sm">
            0x71C...93A82F
          </p>

          <button className="rounded-lg bg-white/[0.06] p-2 text-gray-400 hover:text-white">
            <Copy size={17} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-medium hover:bg-purple-700">
          <ArrowDownLeft size={18} />
          Receive
        </button>

        <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-medium hover:bg-white/[0.08]">
          <ArrowUpRight size={18} />
          Send
        </button>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Recent Transactions
        </h2>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
          {[
            ["NFT Purchase", "-0.85 ETH", "Today"],
            ["NFT Sale", "+1.20 ETH", "Yesterday"],
            ["Wallet Deposit", "+2.00 ETH", "Aug 29"],
          ].map(([title, amount, date]) => (
            <div
              key={title}
              className="flex items-center justify-between border-b border-white/10 p-5 last:border-0"
            >
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-xs text-gray-500">{date}</p>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Wallet;