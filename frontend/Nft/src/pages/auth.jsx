import { motion } from "framer-motion";
import {
  Wallet,
  Loader2,
  ShieldCheck,
  Store,
  ArrowRight,
  Zap,
  Sparkles,
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
      </div>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10 sm:px-8">
        <motion.div
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
          className="w-full max-w-4xl"
        >
          {/* ================================================= */}
          {/* BRAND */}
          {/* ================================================= */}

          <div className="mb-10 flex items-center gap-3">
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

          {/* ================================================= */}
          {/* HERO */}
          {/* ================================================= */}

          <div className="max-w-3xl">
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

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
              Discover unique digital collectibles, create
              your own NFTs, and trade them directly using
              NIM through Nimiq Pay.
            </p>
          </div>

          {/* ================================================= */}
          {/* CONNECT WALLET */}
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
              delay: 0.15,
              ease: "easeOut",
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
                        Connect your Nimiq wallet to create
                        your account and start exploring.
                      </p>
                    </div>
                  </div>

                  {/* Connect button */}

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

                        <ArrowRight
                          size={17}
                        />
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
                      Your wallet is your account. Private keys
                      stay inside Nimiq Pay and transactions
                      require your approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================================================= */}
          {/* FEATURES */}
          {/* ================================================= */}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
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
              description="Buy and sell with NIM."
            />
          </div>

          {/* ================================================= */}
          {/* HOW IT WORKS */}
          {/* ================================================= */}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/30">
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

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="mt-8 flex items-center gap-3 text-xs text-white/25">
            <div className="h-px w-8 bg-white/10" />

            <span>
              Powered by the Nimiq ecosystem
            </span>
          </div>
        </motion.div>
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

export default Auth;