import { motion } from "framer-motion";
import {
  Wallet,
  Loader2,
  ShieldCheck,
  Store,
  ArrowRight,
  Zap,
  Sparkles,
  Gem,
  Image as ImageIcon,
} from "lucide-react";

import { useWallet } from "../context/walletContext";

function Auth() {
  const { connectWallet, loading } = useWallet();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080d] text-white">
      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="absolute bottom-[-15%] right-[-5%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute left-[-10%] top-[40%] h-[300px] w-[300px] rounded-full bg-pink-500/[0.06] blur-[100px]" />

        {/* Desktop glow */}

        <div className="absolute right-[10%] top-[20%] hidden h-[500px] w-[500px] rounded-full bg-purple-500/[0.07] blur-[140px] lg:block" />
      </div>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="w-full">

          {/* ================================================= */}
          {/* BRAND */}
          {/* ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="mb-10 flex items-center gap-3 lg:mb-14"
          >
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
                Testnet marketplace
              </p>
            </div>
          </motion.div>

          {/* ================================================= */}
          {/* DESKTOP LAYOUT */}
          {/* ================================================= */}

          <div className="lg:grid lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-16 xl:grid-cols-[1fr_0.85fr] xl:gap-24">

            {/* ================================================= */}
            {/* LEFT */}
            {/* ================================================= */}

            <motion.section
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.05,
                ease: "easeOut",
              }}
            >
              {/* Hero */}

              <div className="max-w-3xl">
                <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-purple-300/80">
                  Discover • Create • Trade
                </p>

                <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                  Your collection.
                  <br />

                  <span className="text-white/40">
                    Your marketplace.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg lg:text-xl lg:leading-8">
                  Discover unique digital collectibles,
                  create your own NFTs, and trade them
                  with testnet NIM through Nimiq Pay.
                  This marketplace never uses mainnet.
                </p>
              </div>

              {/* Connect */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                }}
                className="mt-10 max-w-2xl"
              >
                <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
                  <div className="rounded-[22px] border border-white/[0.06] bg-[#101017] p-6 sm:p-7">

                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                      {/* Wallet information */}

                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-purple-500/10">
                          <img
                            src="/nimiq.png"
                            alt="Nimiq"
                            className="h-9 w-9 object-contain"
                          />
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold">
                            Enter the marketplace
                          </h2>

                          <p className="mt-1 max-w-sm text-sm leading-5 text-white/35">
                            Switch Nimiq Pay to Testnet,
                            then connect your wallet to
                            enter the marketplace.
                          </p>
                        </div>
                      </div>

                      {/* Button */}

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
                        className="flex h-13 shrink-0 items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[210px]"
                      >
                        {loading ? (
                          <>
                            <Loader2
                              size={19}
                              className="animate-spin"
                            />

                            Connecting...
                          </>
                        ) : (
                          <>
                            <Wallet size={19} />

                            Connect Wallet

                            <ArrowRight size={17} />
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Security */}

                    <div className="mt-6 flex items-start gap-3 border-t border-white/[0.06] pt-5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-300">
                        <ShieldCheck size={16} />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-white/75">
                          Wallet-based identity
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-white/30">
                          Long-press Settings in Nimiq Pay for
                          10 seconds and choose Testnet. All
                          balances, mints, and trades stay on
                          TestAlbatross — no mainnet gateways.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Features */}

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <Feature
                  icon={Sparkles}
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
                  description="Buy and sell with testnet NIM."
                />
              </div>

              {/* Ecosystem */}

              <div className="mt-8 flex items-center gap-3 text-xs text-white/25">
                <div className="h-px w-8 bg-white/10" />

                <span>
                  Powered by the Nimiq ecosystem
                </span>
              </div>
            </motion.section>

            {/* ================================================= */}
            {/* RIGHT — DESKTOP NFT SHOWCASE */}
            {/* ================================================= */}

            <motion.section
              initial={{
                opacity: 0,
                x: 25,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: "easeOut",
              }}
              className="relative mt-14 hidden lg:block"
            >
              <div className="relative mx-auto aspect-[0.82] w-full max-w-[500px]">

                {/* Main glow */}

                <div className="absolute inset-[15%] rounded-full bg-purple-500/20 blur-[100px]" />

                {/* Back card */}

                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [3, 4, 3],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute right-0 top-[5%] h-[58%] w-[72%] rotate-3 overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/10" />

                  <div className="absolute left-6 top-6 flex items-center gap-2">
                    <Gem
                      size={16}
                      className="text-purple-300"
                    />

                    <span className="text-xs text-white/40">
                      Digital collectible
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6">
                    <p className="text-lg font-semibold">
                      NFT Collection
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      Powered by Nimiq
                    </p>
                  </div>
                </motion.div>

                {/* Main card */}

                <motion.div
                  animate={{
                    y: [0, -12, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute left-[5%] top-[15%] h-[64%] w-[78%] overflow-hidden rounded-[32px] border border-white/10 bg-[#111119] shadow-2xl shadow-black/50"
                >
                  {/* Artwork area */}

                  <div className="relative h-[68%] overflow-hidden bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-pink-500/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.25),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.2),transparent_35%)]" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl">
                        <img
                          src="/nimiq.png"
                          alt="Nimiq"
                          className="h-20 w-20 object-contain"
                        />
                      </div>
                    </div>

                    <div className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 backdrop-blur-md">
                      <ImageIcon
                        size={16}
                        className="text-white/60"
                      />
                    </div>
                  </div>

                  {/* NFT information */}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-white/30">
                          Featured collectible
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                          Nimiq Genesis
                        </h3>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                        <p className="text-[9px] uppercase tracking-wider text-white/25">
                          Price
                        </p>

                        <p className="mt-0.5 text-sm font-semibold">
                          NIM
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating stat */}

                <motion.div
                  animate={{
                    y: [0, 8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute bottom-[8%] right-[2%] rounded-2xl border border-white/10 bg-[#111119]/90 px-5 py-4 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
                      <Zap
                        size={16}
                        className="text-purple-300"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] text-white/30">
                        Marketplace
                      </p>

                      <p className="text-sm font-semibold">
                        Trade with testnet NIM
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating logo */}

                <div className="absolute bottom-[22%] left-[-2%] flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#111119]/90 shadow-xl backdrop-blur-xl">
                  <img
                    src="/nimiq.png"
                    alt="Nimiq"
                    className="h-10 w-10 object-contain"
                  />
                </div>
              </div>
            </motion.section>
          </div>

          {/* ================================================= */}
          {/* MOBILE / TABLET HOW IT WORKS */}
          {/* ================================================= */}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/30 lg:hidden">
            <Step
              number="01"
              title="Connect"
              description="Connect your wallet"
            />

            <div className="hidden h-px w-6 bg-white/10 sm:block" />

            <Step
              number="02"
              title="Explore"
              description="Discover NFTs"
            />

            <div className="hidden h-px w-6 bg-white/10 sm:block" />

            <Step
              number="03"
              title="Trade"
              description="Use NIM"
            />
          </div>
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
    <motion.div
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
    >
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
    </motion.div>
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
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-purple-300/60">
        {number}
      </span>

      <div>
        <p className="text-xs font-medium text-white/70">
          {title}
        </p>

        <p className="text-[10px] text-white/25">
          {description}
        </p>
      </div>
    </div>
  );
}
// hope this will be the last commit

export default Auth;