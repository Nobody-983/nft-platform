import { motion } from "framer-motion";
import {
  Wallet,
  Loader2,
  ShieldCheck,
  Store,
  ArrowRight,
  Zap,
} from "lucide-react";

import { useWallet } from "../context/walletContext";

function Auth() {
  const {
    connectWallet,
    loading,
  } = useWallet();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080d] text-white">
      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="absolute bottom-[-15%] right-[-5%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute left-[-10%] top-[40%] h-[300px] w-[300px] rounded-full bg-pink-500/[0.06] blur-[100px]" />
      </div>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">

          {/* ================================================= */}
          {/* LEFT SIDE */}
          {/* ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            {/* Brand */}

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06]">
                <img
                  src="/nimiq.png"
                  alt="Nimiq NFT"
                  className="h-full w-full object-contain p-1.5"
                />
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight">
                  Nimiq NFT
                </p>

                <p className="text-xs text-white/35">
                  Digital marketplace
                </p>
              </div>
            </div>

            {/* Heading */}

            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-purple-300/80">
                Discover • Create • Trade
              </p>

              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Your collection.
                <br />

                <span className="text-white/45">
                  Your marketplace.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
                Discover unique digital collectibles,
                create your own NFTs, and trade them
                directly using NIM through Nimiq Pay.
              </p>
            </div>

            {/* Features */}

            <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
              <Feature
                icon={Store}
                title="Discover"
                description="Explore digital collectibles."
              />

              <Feature
                icon={Store}
                title="Create"
                description="Turn your ideas into NFTs."
              />

              <Feature
                icon={Zap}
                title="Trade"
                description="Buy and sell with NIM."
              />
            </div>

            {/* Small ecosystem note */}

            <div className="mt-10 flex items-center gap-3 text-sm text-white/35">
              <div className="h-px w-10 bg-white/10" />

              <span>
                Powered by the Nimiq ecosystem
              </span>
            </div>
          </motion.section>

          {/* ================================================= */}
          {/* RIGHT SIDE — AUTH CARD */}
          {/* ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: "easeOut",
            }}
            className="mx-auto w-full max-w-md lg:ml-auto"
          >
            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="rounded-[22px] border border-white/[0.06] bg-[#101017] p-6 sm:p-8">

                {/* Card heading */}

                <div className="mb-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-purple-500/10">
                    <img
                      src="/nimiq.png"
                      alt="Nimiq NFT"
                      className="h-9 w-9 object-contain"
                    />
                  </div>

                  <h2 className="text-2xl font-bold">
                    Enter the marketplace
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Connect your Nimiq wallet to create
                    your account and start exploring.
                  </p>
                </div>

                {/* Connect */}

                <motion.button
                  type="button"
                  onClick={connectWallet}
                  disabled={loading}
                  whileHover={{
                    scale: loading ? 1 : 1.015,
                  }}
                  whileTap={{
                    scale: loading ? 1 : 0.985,
                  }}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
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

                      <ArrowRight
                        size={18}
                        className="ml-auto"
                      />
                    </>
                  )}
                </motion.button>

                {/* Security */}

                <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-300">
                      <ShieldCheck size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Wallet-based identity
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Your wallet is your account. Private
                        keys stay inside Nimiq Pay and
                        transactions require your approval.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.07]" />

                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                    How it works
                  </span>

                  <div className="h-px flex-1 bg-white/[0.07]" />
                </div>

                {/* Steps */}

                <div className="space-y-3">
                  <Step
                    number="01"
                    title="Connect"
                    description="Connect your Nimiq wallet."
                  />

                  <Step
                    number="02"
                    title="Explore"
                    description="Discover and collect NFTs."
                  />

                  <Step
                    number="03"
                    title="Trade"
                    description="Buy and sell using NIM."
                  />
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-white/25">
              New here? Your marketplace account is
              created automatically when you connect.
            </p>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

/* ===================================================== */
/* FEATURE */
/* ===================================================== */

function Feature({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <Icon
        size={18}
        className="mb-3 text-purple-300"
      />

      <p className="text-sm font-semibold">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-white/35">
        {description}
      </p>
    </div>
  );
}

/* ===================================================== */
/* STEP */
/* ===================================================== */

function Step({
  number,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-7 text-[10px] font-semibold text-purple-300/60">
        {number}
      </span>

      <div>
        <p className="text-xs font-medium text-white/80">
          {title}
        </p>

        <p className="text-[11px] text-white/30">
          {description}
        </p>
      </div>
    </div>
  );
}

export default Auth;