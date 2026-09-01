import {
  FiBell,
  FiHeart,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";

import { trendingNFTs, recentActivity } from "../nft data/nftdata";

function Dashboard() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      

      {/* Main content */}
      <main className="p-5 lg:p-7">

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#250047] via-[#17002e] to-[#090914] p-7 lg:p-10">

          {/* Glow effects */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute -bottom-20 right-20 h-52 w-52 rounded-full bg-pink-600/10 blur-3xl" />

          <div className="relative z-10 max-w-xl">

            <p className="mb-3 text-sm font-medium text-purple-400">
              THE FUTURE OF DIGITAL OWNERSHIP
            </p>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Discover, collect and own{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                digital treasures
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-6 text-gray-400 sm:text-base">
              Buy, sell and create NFTs across art, music, gaming and more.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold transition hover:scale-105">
                Explore Market
              </button>

              <button className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold transition hover:bg-white/10">
                Create Now
              </button>
            </div>

          </div>

          {/* Hero artwork */}
          <div className="absolute right-5 top-1/2 hidden h-64 w-64 -translate-y-1/2 md:block lg:right-14 lg:h-72 lg:w-72">

            <div className="absolute inset-5 rotate-6 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 blur-xl" />

            <div className="relative flex h-full w-full rotate-6 items-center justify-center rounded-3xl border border-purple-400/30 bg-gradient-to-br from-purple-500/30 via-blue-500/10 to-pink-500/20 backdrop-blur-xl shadow-2xl">

              <div className="h-32 w-32 rotate-12 rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-400/30 via-purple-500/40 to-fuchsia-500/30 shadow-[0_0_60px_rgba(139,92,246,0.5)] lg:h-40 lg:w-40" />

            </div>
          </div>

          {/* Slider dots */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="h-2 w-2 rounded-full bg-white/30" />
            <span className="h-2 w-2 rounded-full bg-white/30" />
          </div>

        </section>


        {/* ================= TRENDING ================= */}
        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>

              <h2 className="text-xl font-semibold">
                Trending Now
              </h2>
            </div>

            <button className="text-sm font-medium text-purple-400 hover:text-purple-300">
              View all
            </button>

          </div>


          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {trendingNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}

          </div>

        </section>


        {/* ================= LOWER DASHBOARD ================= */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">

          <MarketOverview />

          <RecentActivity />

        </section>

      </main>
    </div>
  );
}


/* =====================================================
   NFT CARD
===================================================== */

function NFTCard({ nft }) {

  return (
    <article className="group overflow-hidden rounded-xl border border-white/5 bg-[#101017] transition duration-300 hover:-translate-y-1 hover:border-purple-500/30">

      {/* Image */}
      <div className="relative aspect-square overflow-hidden">

        <img
          src={nft.image}
          alt={nft.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Rank */}
        <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-xs font-bold backdrop-blur">
          {nft.rank}
        </div>

        {/* Heart */}
        <button className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/80">
          <FiHeart size={15} />
        </button>

      </div>


      {/* Content */}
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

    </article>
  );
}


/* =====================================================
   MARKET OVERVIEW
===================================================== */

function MarketOverview() {

  return (
    <div className="rounded-xl border border-white/5 bg-[#101017] p-5">

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


      {/* Chart */}
      <div className="relative mt-6 h-44 overflow-hidden rounded-lg">

        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent" />

        <svg
          viewBox="0 0 500 150"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >

          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopOpacity="0.4" />
              <stop offset="100%" stopOpacity="0" />
            </linearGradient>
          </defs>

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

    </div>
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
    <div className="rounded-xl border border-white/5 bg-[#101017] p-5">

      <div className="mb-5 flex items-center justify-between">

        <h2 className="font-semibold">
          Recent Activity
        </h2>

        <button className="text-sm text-purple-400">
          View all
        </button>

      </div>


      <div className="space-y-1">

        {recentActivity.map((activity) => (

          <div
            key={activity.id}
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

          </div>

        ))}

      </div>

    </div>
  );
}


export default Dashboard;