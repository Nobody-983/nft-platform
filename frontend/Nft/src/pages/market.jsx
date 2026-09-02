
import React, { useState } from "react";
import { Heart, Search, Plus, ArrowUpRight } from "lucide-react";
import {
  MotionDiv,
  MotionButton,
  fadeUp,
  fadeIn,
  staggerContainer,
} from "../components/motion";

const marketplaceItems = [
  {
    id: 1,
    title: "Digital Dreams",
    creator: "Alex Morgan",
    price: "0.85 ETH",
    category: "Art",
    image:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4",
  },
  {
    id: 2,
    title: "Cyber Future",
    creator: "Nova Studio",
    price: "1.20 ETH",
    category: "Art",
    image:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead",
  },
  {
    id: 3,
    title: "Neon Waves",
    creator: "Pixel Labs",
    price: "0.65 ETH",
    category: "Music",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f",
  },
  {
    id: 4,
    title: "Future City",
    creator: "Daniel Art",
    price: "2.10 ETH",
    category: "Art",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455",
  },
  {
    id: 5,
    title: "Golden Dimension",
    creator: "Maya Creative",
    price: "1.45 ETH",
    category: "Collectible",
    image:
      "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d",
  },
  {
    id: 6,
    title: "Abstract Soul",
    creator: "Chris Visuals",
    price: "0.95 ETH",
    category: "Art",
    image:
      "https://images.unsplash.com/photo-1549490349-8643362247b5",
  },
];

const categories = ["All", "Art", "Music", "Collectible", "Gaming"];

function Marketplace() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favorites, setFavorites] = useState([]);

  // Filter marketplace items
  const filteredItems = marketplaceItems.filter((item) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(searchValue) ||
      item.creator.toLowerCase().includes(searchValue);

    const matchesCategory =
      selectedCategory === "All" ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(id)
        ? currentFavorites.filter((favoriteId) => favoriteId !== id)
        : [...currentFavorites, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6">

      {/* Header */}
      <MotionDiv
        variants={fadeUp}
        className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Marketplace
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Discover, collect and trade unique digital assets.
          </p>
        </div>

        <MotionButton
          onClick={() => alert("Create NFT feature coming soon")}
          className="flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700"
        >
          <Plus size={18} />
          Create NFT
        </MotionButton>
      </MotionDiv>

      {/* Search + Categories */}
      <MotionDiv
        variants={fadeUp}
        className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >

        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search NFTs, creators..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-purple-500"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <MotionButton
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                selectedCategory === category
                  ? "bg-purple-600 text-white"
                  : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {category}
            </MotionButton>
          ))}
        </div>
      </MotionDiv>

      {/* Marketplace Grid */}
      {filteredItems.length > 0 ? (
        <MotionDiv
          variants={staggerContainer}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filteredItems.map((item) => (
            <MotionDiv
              key={item.id}
              variants={fadeUp}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:-translate-y-1 hover:border-purple-500/40"
            >

              {/* NFT Image */}
              <div className="relative aspect-[4/3] overflow-hidden">

                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Category */}
                <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                  {item.category}
                </div>

                {/* Favorite */}
                <MotionButton
                  onClick={() => toggleFavorite(item.id)}
                  className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition ${
                    favorites.includes(item.id)
                      ? "bg-purple-600 text-white"
                      : "bg-black/60 text-white hover:bg-purple-600"
                  }`}
                >
                  <Heart
                    size={17}
                    fill={
                      favorites.includes(item.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </MotionButton>
              </div>

              {/* NFT Details */}
              <div className="p-5">

                <div className="mb-4">
                  <h2 className="text-lg font-semibold">
                    {item.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    by {item.creator}
                  </p>
                </div>

                <div className="flex items-end justify-between">

                  <div>
                    <p className="text-xs text-gray-500">
                      Current price
                    </p>

                    <p className="mt-1 text-base font-semibold">
                      {item.price}
                    </p>
                  </div>

                  {/* View NFT */}
                  <MotionButton
                    onClick={() =>
                      alert(`${item.title} selected`)
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 px-4 py-2 text-sm font-medium text-purple-400 transition hover:bg-purple-600 hover:text-white"
                  >
                    View NFT
                    <ArrowUpRight size={15} />
                  </MotionButton>

                </div>
              </div>
            </MotionDiv>
          ))}
        </MotionDiv>
      ) : (

        /* No Results */
        <MotionDiv
          variants={fadeIn}
          className="py-16 text-center"
        >
          <p className="text-lg font-semibold">
            No NFTs found
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Try another search or category.
          </p>
        </MotionDiv>
      )}
    </div>
  );
}

export default Marketplace;

