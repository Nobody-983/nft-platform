import React from "react";

const marketplaceItems = [
  {
    id: 1,
    title: "Digital Dreams",
    creator: "Alex Morgan",
    price: "0.85 ETH",
    category: "Art",
    image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4",
  },
  {
    id: 2,
    title: "Cyber Future",
    creator: "Nova Studio",
    price: "1.20 ETH",
    category: "Art",
    image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead",
  },
  {
    id: 3,
    title: "Neon Waves",
    creator: "Pixel Labs",
    price: "0.65 ETH",
    category: "Music",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f",
  },
  {
    id: 4,
    title: "Future City",
    creator: "Daniel Art",
    price: "2.10 ETH",
    category: "Art",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455",
  },
  {
    id: 5,
    title: "Golden Dimension",
    creator: "Maya Creative",
    price: "1.45 ETH",
    category: "Collectible",
    image: "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d",
  },
  {
    id: 6,
    title: "Abstract Soul",
    creator: "Chris Visuals",
    price: "0.95 ETH",
    category: "Art",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5",
  },
];

const categories = ["All", "Art", "Music", "Collectible", "Gaming"];

function Marketplace() {
  return (
    <div className="min-h-screen bg-[#0b0b12] px-6 py-6 text-white">
      
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-400">
            Discover, collect and trade unique digital assets.
          </p>
        </div>

        <button className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700">
          + Create NFT
        </button>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        <div className="relative w-full lg:max-w-md">
          <input
            type="text"
            placeholder="Search NFTs, creators..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category, index) => (
            <button
              key={category}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                index === 0
                  ? "bg-purple-600 text-white"
                  : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {marketplaceItems.map((item) => (
          <div
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-purple-500/40"
          >
            
            {/* NFT Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                {item.category}
              </div>

              <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg backdrop-blur-md transition hover:bg-purple-600">
                ♡
              </button>
            </div>

            {/* NFT Details */}
            <div className="p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  by {item.creator}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500">Current price</p>
                  <p className="mt-1 text-base font-semibold">
                    {item.price}
                  </p>
                </div>

                <button className="rounded-xl border border-purple-500/40 px-4 py-2 text-sm font-medium text-purple-400 transition hover:bg-purple-600 hover:text-white">
                  View NFT
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Marketplace;