import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

import Topbar from "../components/topbar";
import {
  MotionDiv,
  MotionButton,
  fadeUp,
  fadeIn,
  slideLeft,
  slideRight,
  staggerContainer,
} from "../components/motion";

import { trendingNFTs, recentActivity } from "../nft data/nftdata";

const heroSlides = [
  {
    id: 1,
    tag: "THE FUTURE OF DIGITAL OWNERSHIP",
    title: "Discover, collect and own",
    highlight: "digital treasures",
    description:
      "Buy, sell and create NFTs across art, music, gaming and more.",
    image:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    tag: "DIGITAL ART",
    title: "Own something",
    highlight: "truly unique",
    description:
      "Discover unique digital artwork from creators around the world.",
    image:
      "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    tag: "COLLECT. CREATE. EARN.",
    title: "Your digital world",
    highlight: "starts here",
    description:
      "Explore collectibles, discover creators and build your collection.",
    image:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=900&q=80",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);

  // Automatically change hero slide every 5 seconds
  useEffect(() => {
    const slider = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === heroSlides.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(slider);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === heroSlides.length - 1 ? 0 : prev + 1
    );
  };

  const previousSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? heroSlides.length - 1 : prev - 1
    );
  };

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      <Topbar />

      <main className="p-5 lg:p-7">

        {/* ================= HERO ================= */}

        <section className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#250047] via-[#17002e] to-[#090914]">

          {/* Background glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl"
          />

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-20 right-40 h-64 w-64 rounded-full bg-pink-600/10 blur-3xl"
          />

          {/* ================= SLIDE ================= */}

          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex min-h-[420px] items-center p-7 lg:p-10"
            >

              {/* ================= TEXT ================= */}

              <motion.div
                variants={slideRight}
                initial="hidden"
                animate="visible"
                className="max-w-xl"
              >
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="mb-3 text-sm font-medium tracking-wide text-purple-400"
                >
                  {slide.tag}
                </motion.p>

                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
                >
                  {slide.title}{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    {slide.highlight}
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  className="mt-5 max-w-lg text-sm leading-6 text-gray-400 sm:text-base"
                >
                  {slide.description}
                </motion.p>

                {/* ================= BUTTONS ================= */}

                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  className="mt-7 flex flex-wrap gap-3"
                >
                  <MotionButton
                    onClick={() => navigate("/marketplace")}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-purple-900/20"
                  >
                    Explore Market
                  </MotionButton>

                  <MotionButton
                    onClick={() => navigate("/create")}
                    className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10"
                  >
                    Create Now
                  </MotionButton>
                </motion.div>
              </motion.div>

              {/* ================= NFT IMAGE ================= */}

              <motion.div
                variants={slideLeft}
                initial="hidden"
                animate="visible"
                className="absolute right-8 top-1/2 hidden h-72 w-72 -translate-y-1/2 md:block lg:right-16 lg:h-80 lg:w-80"
              >
                {/* Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-4 rounded-3xl bg-purple-600/30 blur-3xl"
                />

                {/* Image */}
                <motion.div
                  animate={{
                    rotate: [6, 4, 6],
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative h-full w-full overflow-hidden rounded-3xl border border-purple-400/30 bg-[#111119] shadow-2xl shadow-purple-900/40"
                >
                  <img
                    src={slide.image}
                    alt={slide.highlight}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute bottom-4 left-4">
                    <p className="text-xs text-gray-300">
                      Featured NFT
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {slide.highlight}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

            </motion.div>
          </AnimatePresence>

          {/* ================= PREVIOUS ================= */}

          <MotionButton
            onClick={previousSlide}
            className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur hover:bg-black/60"
          >
            <FiChevronLeft size={18} />
          </MotionButton>

          {/* ================= NEXT ================= */}

          <MotionButton
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur hover:bg-black/60"
          >
            <FiChevronRight size={18} />
          </MotionButton>

          {/* ================= DOTS ================= */}

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {heroSlides.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSlide(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "w-6 bg-purple-400"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

        </section>

        {/* ================= TRENDING ================= */}

        <MotionDiv
          variants={fadeUp}
          className="mt-8"
        >
          <div className="mb-4 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>

              <h2 className="text-xl font-semibold">
                Trending Now
              </h2>
            </div>

            <button
              onClick={() => navigate("/marketplace")}
              className="text-sm font-medium text-purple-400 transition hover:text-purple-300"
            >
              View all
            </button>

          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {trendingNFTs.map((nft) => (
              <motion.div
                key={nft.id}
                variants={fadeUp}
              >
                <NFTCard nft={nft} />
              </motion.div>
            ))}
          </motion.div>
        </MotionDiv>

        {/* ================= LOWER DASHBOARD ================= */}

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 grid gap-5 lg:grid-cols-2"
        >
          <MarketOverview />
          <RecentActivity />
        </motion.section>

      </main>
    </div>
  );
}


/* =====================================================
   NFT CARD
===================================================== */

function NFTCard({ nft }) {
  return (
    <motion.article
      whileHover={{
        y: -6,
        scale: 1.01,
      }}
      transition={{
        duration: 0.2,
      }}
      className="group overflow-hidden rounded-xl border border-white/5 bg-[#101017]"
    >
      <div className="relative aspect-square overflow-hidden">

        <img
          src={nft.image}
          alt={nft.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-xs font-bold backdrop-blur">
          {nft.rank}
        </div>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/80"
        >
          <FiHeart size={15} />
        </motion.button>

      </div>

      <div className="p-3">

        <h3 className="truncate text-sm font-semibold">
          {nft.name}
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          by {nft.creator}
        </p>

        <div className="mt-4 flex items-end justify-between">

          <div>
            <p className="text-xs text-gray-500">
              Price
            </p>

            <p className="mt-1 font-semibold">
              {nft.price} NIM
            </p>
          </div>

          <span className="text-xs font-medium text-green-400">
            {nft.change}
          </span>

        </div>

      </div>
    </motion.article>
  );
}


/* =====================================================
   MARKET OVERVIEW
===================================================== */

function MarketOverview() {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-white/5 bg-[#101017] p-5"
    >
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">
          <FiTrendingUp className="text-purple-400" />

          <h2 className="font-semibold">
            Market Overview
          </h2>
        </div>

        <div className="flex rounded-lg bg-white/5 p-1 text-xs">

          <button className="rounded-md bg-purple-600 px-3 py-1.5">
            24H
          </button>

          <button className="px-3 py-1.5 text-gray-500">
            7D
          </button>

          <button className="px-3 py-1.5 text-gray-500">
            30D
          </button>

        </div>
      </div>

      <div className="relative mt-6 h-44 overflow-hidden rounded-lg">

        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent" />

        <svg
          viewBox="0 0 500 150"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120 C30 100 45 115 70 95 C100 70 110 110 135 90 C165 65 180 105 205 80 C230 55 250 105 275 85 C300 70 315 100 340 55 C365 15 380 70 405 35 C430 10 445 55 470 25 C485 10 495 30 500 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-purple-500"
          />
        </svg>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">

        <Stat
          label="Total Volume"
          value="1,240 NIM"
          change="+18.5%"
        />

        <Stat
          label="Sales"
          value="342"
          change="+16.2%"
        />

        <Stat
          label="Floor Price"
          value="12.5 NIM"
          change="+7.3%"
        />

      </div>
    </motion.div>
  );
}


/* =====================================================
   STAT
===================================================== */

function Stat({ label, value, change }) {
  return (
    <div>
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-green-400">
        {change}
      </p>
    </div>
  );
}


/* =====================================================
   RECENT ACTIVITY
===================================================== */

function RecentActivity() {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-white/5 bg-[#101017] p-5"
    >
      <div className="mb-5 flex items-center justify-between">

        <h2 className="font-semibold">
          Recent Activity
        </h2>

        <button className="text-sm text-purple-400">
          View all
        </button>

      </div>

      <div className="space-y-1">

        {recentActivity.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
            }}
            className="flex items-center justify-between rounded-lg p-3 transition hover:bg-white/5"
          >
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold">
                {activity.user.charAt(0)}
              </div>

              <div>
                <p className="text-sm">
                  <span className="font-medium">
                    {activity.user}
                  </span>{" "}

                  <span className="text-gray-500">
                    {activity.action}
                  </span>
                </p>

                <p className="text-xs text-gray-500">
                  {activity.item}
                </p>
              </div>

            </div>

            {activity.price && (
              <span className="text-sm font-medium">
                {activity.price}
              </span>
            )}

          </motion.div>
        ))}

      </div>
    </motion.div>
  );
}

export default Dashboard;