
import React from "react";
import {
  Wallet as WalletIcon,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

import {
  MotionDiv,
  MotionButton,
  fadeUp,
  fadeIn,
  staggerContainer,
} from "../components/motion";

function Wallet() {
  const transactions = [
    ["NFT Purchase", "-0.85 ETH", "Today"],
    ["NFT Sale", "+1.20 ETH", "Yesterday"],
    ["Wallet Deposit", "+2.00 ETH", "Aug 29"],
  ];

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6">

      {/* Header */}
      <MotionDiv
        variants={fadeUp}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Wallet
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Manage your digital assets and transactions.
        </p>
      </MotionDiv>

      {/* Balance */}
      <MotionDiv
        variants={fadeUp}
        className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-600/30 to-white/[0.03] p-6"
      >
        <div className="flex items-center gap-3 text-gray-400">
          <WalletIcon size={20} />

          <span className="text-sm">
            Total Balance
          </span>
        </div>

        <h2 className="mt-4 text-4xl font-bold">
          $12,480.50
        </h2>

        <p className="mt-2 text-sm text-green-400">
          +8.42% this month
        </p>
      </MotionDiv>

      {/* Wallet Address */}
      <MotionDiv
        variants={fadeUp}
        className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <p className="mb-2 text-sm text-gray-400">
          Wallet Address
        </p>

        <div className="flex items-center justify-between gap-4">
          <p className="truncate text-sm">
            0x71C...93A82F
          </p>

          <MotionButton
            onClick={() =>
              navigator.clipboard.writeText("0x71C...93A82F")
            }
            className="rounded-lg bg-white/[0.06] p-2 text-gray-400 hover:text-white"
          >
            <Copy size={17} />
          </MotionButton>
        </div>
      </MotionDiv>

      {/* Actions */}
      <MotionDiv
        variants={fadeUp}
        className="mb-8 grid grid-cols-2 gap-4"
      >
        <MotionButton
          onClick={() => alert("Receive feature coming soon")}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-medium transition hover:bg-purple-700"
        >
          <ArrowDownLeft size={18} />
          Receive
        </MotionButton>

        <MotionButton
          onClick={() => alert("Send feature coming soon")}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-medium transition hover:bg-white/[0.08]"
        >
          <ArrowUpRight size={18} />
          Send
        </MotionButton>
      </MotionDiv>

      {/* Transactions */}
      <MotionDiv variants={fadeUp}>
        <h2 className="mb-4 text-xl font-semibold">
          Recent Transactions
        </h2>

        <MotionDiv
          variants={staggerContainer}
          className="rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          {transactions.map(([title, amount, date]) => (
            <MotionDiv
              key={title}
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
          ))}
        </MotionDiv>
      </MotionDiv>

    </div>
  );
}

export default Wallet;
